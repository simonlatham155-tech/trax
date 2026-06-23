import { useCallback } from 'react';
import { Transport } from '@/components/transport/Transport';
import { TrackList } from '@/components/track/TrackList';
import { Timeline } from '@/components/timeline/Timeline';
import { Mixer } from '@/components/mixer/Mixer';
import { EffectsPanel } from '@/components/effects/EffectsPanel';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { ZoomIn, ZoomOut, Magnet, Upload } from 'lucide-react';

function BottomStatusBar() {
  const position = useDAWStore((s) => s.transport.position);
  const zoom = useDAWStore((s) => s.ui.zoom);
  const snapEnabled = useDAWStore((s) => s.ui.snapEnabled);
  const snapGrid = useDAWStore((s) => s.ui.snapGrid);
  const bpm = useDAWStore((s) => s.project.bpm);
  const timeSignature = useDAWStore((s) => s.project.timeSignature);
  const tracks = useDAWStore((s) => s.tracks);

  const setZoom = useDAWStore((s) => s.setZoom);
  const toggleSnap = useDAWStore((s) => s.toggleSnap);
  const setSnapGrid = useDAWStore((s) => s.setSnapGrid);
  const addTrack = useDAWStore((s) => s.addTrack);

  const totalClips = tracks.reduce((sum, t) => sum + t.clips.length, 0);

  return (
    <div className="flex items-center gap-4 px-3 py-1 bg-[#0a0a0f] border-t border-[#1e1e2a] text-[10px] text-[#55557a] shrink-0">
      <span>
        {timeSignature.numerator}/{timeSignature.denominator} · {bpm} BPM
      </span>
      <span>Bar {Math.floor(position / timeSignature.numerator) + 1}</span>
      <span>{tracks.length} tracks · {totalClips} clips</span>

      <div className="flex-1" />

      {/* Snap */}
      <button
        onClick={toggleSnap}
        className={`flex items-center gap-1 transition-colors ${
          snapEnabled ? 'text-[#6c63ff]' : 'text-[#55557a] hover:text-[#8888aa]'
        }`}
        title="Toggle snap"
      >
        <Magnet size={11} />
        <span>{snapEnabled ? 'Snap' : 'Free'}</span>
      </button>

      <select
        value={snapGrid}
        onChange={(e) => setSnapGrid(parseFloat(e.target.value))}
        className="bg-[#111118] text-[#55557a] border border-[#2a2a38] rounded px-1 text-[10px] outline-none"
      >
        <option value={0.0625}>1/16</option>
        <option value={0.125}>1/8</option>
        <option value={0.25}>1/4</option>
        <option value={0.5}>1/2</option>
        <option value={1}>1 Bar</option>
        <option value={2}>2 Bars</option>
        <option value={4}>4 Bars</option>
      </select>

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(zoom * 0.8)}
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={11} />
        </button>
        <span className="w-8 text-center font-mono">{Math.round(zoom)}</span>
        <button
          onClick={() => setZoom(zoom * 1.25)}
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={11} />
        </button>
      </div>
    </div>
  );
}

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
        });
      }
    },
    [addClip]
  );

  return (
    <div
      className="contents"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
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
  const openEffectsTrackId = useDAWStore((s) => s.ui.openEffectsTrackId);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] relative">
      {/* Transport bar */}
      <Transport />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Track headers */}
        <TrackList />

        {/* Timeline / arrangement */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Timeline />
        </div>

        {/* Effects panel */}
        {openEffectsTrackId && <EffectsPanel />}

        <DropZone />
      </div>

      {/* Mixer */}
      {showMixer && <Mixer />}

      {/* Status bar */}
      <BottomStatusBar />
    </div>
  );
}

import React from 'react';
