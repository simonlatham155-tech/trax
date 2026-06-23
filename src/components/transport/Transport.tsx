import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Circle,
  Repeat,
  Volume2,
  Sliders,
  Music,
  MousePointer2,
  Pencil,
  Scissors,
  Eraser,
  Magnet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { EditTool } from '@/types';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { formatTime, formatBeatPosition, beatsToSeconds } from '@/utils/beats';
import { cn } from '@/utils/cn';
import { ProjectBar } from '@/components/project/ProjectBar';
import { BridgeStatusIndicator } from '@/components/plugins/BridgeStatus';

function BpmInput() {
  const bpm = useDAWStore((s) => s.project.bpm);
  const setBpm = useDAWStore((s) => s.setBpm);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setInputVal(String(bpm));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v)) setBpm(v);
    setEditing(false);
  };

  return editing ? (
    <input
      ref={inputRef}
      className="w-14 bg-[#1a1a24] border border-[#6c63ff] rounded text-center text-[#e8e8f0] text-sm font-mono outline-none px-1"
      value={inputVal}
      onChange={(e) => setInputVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  ) : (
    <button
      className="flex flex-col items-center hover:text-[#e8e8f0] transition-colors"
      onClick={startEdit}
      title="Click to edit BPM"
    >
      <span className="text-[10px] text-[#55557a] uppercase tracking-wider">BPM</span>
      <span className="text-lg font-mono font-bold text-[#e8e8f0] leading-none">{bpm}</span>
    </button>
  );
}

function TimeDisplay() {
  const position = useDAWStore((s) => s.transport.position);
  const bpm = useDAWStore((s) => s.project.bpm);
  const timeSignature = useDAWStore((s) => s.project.timeSignature);
  const seconds = beatsToSeconds(position, bpm);

  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-[#55557a] uppercase tracking-wider">BAR</span>
        <span className="text-lg font-mono font-bold text-[#6c63ff] leading-none">
          {formatBeatPosition(position, timeSignature.numerator)}
        </span>
      </div>
      <div className="w-px h-8 bg-[#2a2a38]" />
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-[#55557a] uppercase tracking-wider">TIME</span>
        <span className="text-lg font-mono font-bold text-[#8888aa] leading-none">
          {formatTime(seconds)}
        </span>
      </div>
    </div>
  );
}

export function Transport() {
  const state = useDAWStore((s) => s.transport.state);
  const position = useDAWStore((s) => s.transport.position);
  const loopEnabled = useDAWStore((s) => s.transport.loopEnabled);
  const metronomeEnabled = useDAWStore((s) => s.transport.metronomeEnabled);
  const masterVolume = useDAWStore((s) => s.masterVolume);
  const showMixer = useDAWStore((s) => s.ui.showMixer);

  const play = useDAWStore((s) => s.play);
  const pause = useDAWStore((s) => s.pause);
  const stop = useDAWStore((s) => s.stop);
  const record = useDAWStore((s) => s.record);
  const setPosition = useDAWStore((s) => s.setPosition);
  const toggleLoop = useDAWStore((s) => s.toggleLoop);
  const toggleMetronome = useDAWStore((s) => s.toggleMetronome);
  const setMasterVolume = useDAWStore((s) => s.setMasterVolume);
  const toggleMixer = useDAWStore((s) => s.toggleMixer);

  const isPlaying = state === 'playing';
  const isRecording = state === 'recording';

  const handlePlay = useCallback(async () => {
    await audioEngine.init();
    await audioEngine.resume();
    if (isPlaying) {
      pause();
      audioEngine.stopPlayback();
    } else {
      play();
      await audioEngine.startPlayback(position);
    }
  }, [isPlaying, pause, play, position]);

  const handleStop = useCallback(() => {
    stop();
    audioEngine.stopPlayback();
  }, [stop]);

  const handleRecord = useCallback(async () => {
    await audioEngine.init();
    await audioEngine.resume();
    if (isRecording) {
      stop();
      audioEngine.stopPlayback();
    } else {
      record();
      await audioEngine.startPlayback(position);
    }
  }, [isRecording, stop, record, position]);

  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlay();
      }
      if (e.code === 'Home') {
        handleStop();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePlay, handleStop]);

  const TransportBtn = ({
    children,
    onClick,
    active,
    danger,
    title,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded transition-all',
        active && !danger && 'bg-[#6c63ff] text-white',
        active && danger && 'bg-[#ef4444] text-white',
        !active && 'bg-[#1a1a24] text-[#8888aa] hover:bg-[#22222e] hover:text-[#e8e8f0]'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#111118] border-b border-[#2a2a38] h-14 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 shrink-0">
        <div className="w-7 h-7 rounded bg-[#6c63ff] flex items-center justify-center">
          <Music size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm text-[#e8e8f0] tracking-widest uppercase">TRAX</span>
      </div>

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Project controls */}
      <ProjectBar />

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Transport controls */}
      <div className="flex items-center gap-1.5">
        <TransportBtn
          onClick={() => { handleStop(); setPosition(0); }}
          title="Return to start (Home)"
        >
          <SkipBack size={14} />
        </TransportBtn>
        <TransportBtn onClick={handlePlay} active={isPlaying} title="Play/Pause (Space)">
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </TransportBtn>
        <TransportBtn onClick={handleStop} title="Stop (Home)">
          <Square size={13} />
        </TransportBtn>
        <TransportBtn
          onClick={handleRecord}
          active={isRecording}
          danger
          title="Record"
        >
          <Circle size={13} />
        </TransportBtn>
        <TransportBtn
          onClick={() => setPosition(position + useDAWStore.getState().project.timeSignature.numerator)}
          title="Skip forward"
        >
          <SkipForward size={14} />
        </TransportBtn>
      </div>

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Position display */}
      <TimeDisplay />

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* BPM */}
      <BpmInput />

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Loop & Metronome */}
      <div className="flex items-center gap-1.5">
        <TransportBtn onClick={toggleLoop} active={loopEnabled} title="Toggle loop">
          <Repeat size={14} />
        </TransportBtn>
        <TransportBtn onClick={toggleMetronome} active={metronomeEnabled} title="Toggle metronome">
          <span className="text-[11px] font-bold font-mono">♩</span>
        </TransportBtn>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Master volume */}
      <div className="flex items-center gap-2">
        <Volume2 size={13} className="text-[#55557a]" />
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-24 h-1"
          title={`Master volume: ${Math.round(masterVolume * 100)}%`}
        />
        <span className="text-[10px] text-[#55557a] font-mono w-8">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Mixer toggle */}
      <TransportBtn onClick={toggleMixer} active={showMixer} title="Toggle mixer">
        <Sliders size={14} />
      </TransportBtn>

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* VST Bridge status */}
      <BridgeStatusIndicator />
    </div>
  );
}

// ── Arrange toolbar (tool selector + snap + zoom) ─────────────────────────────

const TOOLS: { id: EditTool; icon: React.ReactNode; label: string; key: string }[] = [
  { id: 'pointer', icon: <MousePointer2 size={13} />, label: 'Select  (F1)', key: 'F1' },
  { id: 'draw',    icon: <Pencil size={13} />,        label: 'Draw    (F2)', key: 'F2' },
  { id: 'split',   icon: <Scissors size={13} />,      label: 'Split   (F3)', key: 'F3' },
  { id: 'erase',   icon: <Eraser size={13} />,        label: 'Erase   (F4)', key: 'F4' },
];

export function ArrangeToolbar() {
  const tool = useDAWStore((s) => s.ui.tool);
  const zoom = useDAWStore((s) => s.ui.zoom);
  const snapEnabled = useDAWStore((s) => s.ui.snapEnabled);
  const snapGrid = useDAWStore((s) => s.ui.snapGrid);
  const setTool = useDAWStore((s) => s.setTool);
  const setZoom = useDAWStore((s) => s.setZoom);
  const toggleSnap = useDAWStore((s) => s.toggleSnap);
  const setSnapGrid = useDAWStore((s) => s.setSnapGrid);

  // Keyboard shortcuts F1–F4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const t = TOOLS.find((t) => t.key === e.code || t.key === e.key);
      if (t) { e.preventDefault(); setTool(t.id); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setTool]);

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 bg-[#0d0d16] border-b border-[#1e1e2a] shrink-0 h-8">
      {/* Tools */}
      <div className="flex items-center gap-0.5 mr-3">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setTool(t.id)}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded transition-colors',
              tool === t.id
                ? 'bg-[#6c63ff] text-white'
                : 'text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#1e1e2a]'
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[#2a2a38] mx-1" />

      {/* Snap */}
      <button
        onClick={toggleSnap}
        title="Toggle snap"
        className={cn(
          'flex items-center gap-1 px-1.5 h-6 rounded text-[10px] transition-colors',
          snapEnabled ? 'text-[#6c63ff] bg-[#6c63ff]/10' : 'text-[#55557a] hover:text-[#8888aa]'
        )}
      >
        <Magnet size={10} />
        <span className="font-semibold">Snap</span>
      </button>

      <select
        value={snapGrid}
        onChange={(e) => setSnapGrid(parseFloat(e.target.value))}
        className="bg-[#111118] text-[#55557a] border border-[#2a2a38] rounded px-1 text-[10px] outline-none h-5 ml-1"
      >
        <option value={0.0625}>1/16</option>
        <option value={0.125}>1/8</option>
        <option value={0.25}>1/4</option>
        <option value={0.5}>1/2</option>
        <option value={1}>1 Bar</option>
        <option value={2}>2 Bars</option>
        <option value={4}>4 Bars</option>
      </select>

      <div className="w-px h-4 bg-[#2a2a38] mx-2" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button onClick={() => setZoom(zoom * 0.75)} className="text-[#55557a] hover:text-[#e8e8f0] transition-colors" title="Zoom out">
          <ZoomOut size={11} />
        </button>
        <span className="text-[10px] text-[#55557a] font-mono w-8 text-center">{Math.round(zoom)}</span>
        <button onClick={() => setZoom(zoom * 1.33)} className="text-[#55557a] hover:text-[#e8e8f0] transition-colors" title="Zoom in">
          <ZoomIn size={11} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Track count summary */}
      <TrackSummary />
    </div>
  );
}

function TrackSummary() {
  const tracks = useDAWStore((s) => s.tracks);
  const bpm = useDAWStore((s) => s.project.bpm);
  const sig = useDAWStore((s) => s.project.timeSignature);
  const clips = tracks.reduce((n, t) => n + t.clips.length, 0);
  return (
    <span className="text-[9px] text-[#3a3a4a] font-mono">
      {tracks.length} tracks · {clips} clips · {bpm} BPM · {sig.numerator}/{sig.denominator}
    </span>
  );
}
