import { useCallback } from 'react';
import { Transport, ArrangeToolbar } from '@/components/transport/Transport';
import { MenuBar } from '@/components/shell/MenuBar';
import { StatusBar } from '@/components/shell/StatusBar';
import { WelcomePanel } from '@/components/shell/WelcomePanel';
import { BridgeDownloadProvider } from '@/components/shell/BridgeDownloadProvider';
import { TrackList } from '@/components/track/TrackList';
import { Timeline } from '@/components/timeline/Timeline';
import { Mixer } from '@/components/mixer/Mixer';
import { EffectsPanel } from '@/components/effects/EffectsPanel';
import { PianoRoll } from '@/components/piano-roll/PianoRoll';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { Upload } from 'lucide-react';

function DropZone() {
  const addClip = useDAWStore((s) => s.addClip);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('audio/')
      );
      if (files.length === 0) return;

      await audioEngine.init();
      const { addTrack } = useDAWStore.getState();

      for (const file of files) {
        const buffer = await audioEngine.decodeAudioFile(file);
        const bpm = useDAWStore.getState().project.bpm;
        const durationBeats = (buffer.duration / 60) * bpm;

        addTrack('audio');
        const newTracks = useDAWStore.getState().tracks;
        const newTrack = newTracks[newTracks.length - 1];

        addClip(newTrack.id, {
          startBeat: 0,
          durationBeats,
          name: file.name.replace(/\.[^.]+$/, ''),
          color: '#6c63ff',
          audioBuffer: buffer,
          gain: 1.0,
          fadeIn: 0,
          fadeOut: 0,
          originalBpm: bpm,
        });
      }
    },
    [addClip]
  );

  return (
    <div
      className="contents"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-50 bg-[#6c63ff]/10 border-2 border-dashed border-[#6c63ff] rounded flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-[#6c63ff]" />
            <span className="text-[#6c63ff] font-semibold">Drop audio files</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const showMixer = useDAWStore((s) => s.ui.showMixer);
  const showPianoRoll = useDAWStore((s) => s.ui.showPianoRoll);
  const pianoRollClipId = useDAWStore((s) => s.ui.pianoRollClipId);
  const openEffectsTrackId = useDAWStore((s) => s.ui.openEffectsTrackId);

  return (
    <BridgeDownloadProvider>
    <div className="flex flex-col h-full bg-[#0a0a0f] relative">
      <MenuBar />
      <Transport />

      {/* Tool / snap / zoom bar */}
      <ArrangeToolbar />

      {/* Main content area — grows to fill remaining height */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Track headers */}
        <TrackList />

        {/* Timeline / arrangement */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          <Timeline />
        </div>

        {/* Effects panel */}
        {openEffectsTrackId && <EffectsPanel />}

        <DropZone />
      </div>

      {/* Piano Roll — resizable bottom panel */}
      {showPianoRoll && pianoRollClipId && (
        <PianoRoll clipId={pianoRollClipId} />
      )}

      {/* Mixer */}
      {showMixer && <Mixer />}

      <StatusBar />
      <WelcomePanel />
    </div>
    </BridgeDownloadProvider>
  );
}

import React from 'react';
