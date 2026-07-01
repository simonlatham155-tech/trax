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
  Undo2,
  Redo2,
} from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { formatTime, formatBeatPosition, beatsToSeconds } from '@/utils/beats';
import { cn } from '@/utils/cn';
import { ProjectBar } from '@/components/project/ProjectBar';
import { useHistoryState } from '@/hooks/use-history';

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
  const undo = useDAWStore((s) => s.undo);
  const redo = useDAWStore((s) => s.redo);

  const { canUndo, canRedo } = useHistoryState();

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
      audioEngine.startPlayback(position);
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
      audioEngine.startPlayback(position);
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePlay, handleStop, undo, redo]);

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

      <div className="w-px h-8 bg-[#2a2a38]" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => canUndo && undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded transition-all',
            canUndo
              ? 'bg-[#1a1a24] text-[#e8e8f0] hover:bg-[#22222e]'
              : 'bg-[#1a1a24] text-[#3a3a50] cursor-not-allowed'
          )}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => canRedo && redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded transition-all',
            canRedo
              ? 'bg-[#1a1a24] text-[#e8e8f0] hover:bg-[#22222e]'
              : 'bg-[#1a1a24] text-[#3a3a50] cursor-not-allowed'
          )}
        >
          <Redo2 size={14} />
        </button>
      </div>

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
    </div>
  );
}
