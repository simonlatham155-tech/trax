import React, { useCallback, useEffect, useState } from 'react';
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

function isAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true;
  return /\.(wav|mp3|ogg|flac|aac|m4a|aiff?)$/i.test(file.name);
}

function DropZone() {
  const addClip = useDAWStore((s) => s.addClip);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);

      const files = Array.from(e.dataTransfer?.files ?? []).filter(isAudioFile);
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

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget) return;
      setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      void handleDrop(e);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleDrop]);

  if (!dragging) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#6c63ff]/10 border-2 border-dashed border-[#6c63ff] flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <Upload size={32} className="text-[#6c63ff]" />
        <span className="text-[#6c63ff] font-semibold">Drop audio files</span>
      </div>
    </div>
  );
}

function EmptyWorkspaceHint() {
  const tracks = useDAWStore((s) => s.tracks);
  const loadDemoProject = useDAWStore((s) => s.loadDemoProject);
  const hasClips = tracks.some((t) => t.clips.length > 0);

  if (hasClips) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="text-center max-w-sm px-6 pointer-events-auto">
        <p className="text-sm text-[#8888aa] mb-3">Drop a .wav or .mp3 here, or try the demo project.</p>
        <button
          onClick={() => loadDemoProject()}
          className="px-4 py-2 rounded-lg bg-[#6c63ff] text-white text-sm font-semibold hover:bg-[#7a72ff] transition-colors"
        >
          Load Demo Project
        </button>
      </div>
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
      <div className="flex flex-col h-full bg-[#0a0a0f]">
        <MenuBar />
        <Transport />
        <ArrangeToolbar />

        <div className="flex flex-1 overflow-hidden relative min-h-0">
          <TrackList />

          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
            <Timeline />
            <EmptyWorkspaceHint />
            <DropZone />
            <WelcomePanel />
          </div>

          {openEffectsTrackId && <EffectsPanel />}
        </div>

        {showPianoRoll && pianoRollClipId && (
          <PianoRoll clipId={pianoRollClipId} />
        )}

        {showMixer && <Mixer />}

        <StatusBar />
      </div>
    </BridgeDownloadProvider>
  );
}
