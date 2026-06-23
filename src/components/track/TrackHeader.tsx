import { useState, useRef, useCallback } from 'react';
import {
  Mic,
  Mic2,
  Volume2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Sliders,
  Upload,
  GripVertical,
} from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { cn } from '@/utils/cn';
import { TRACK_COLORS } from '@/types';
import type { Track } from '@/types';

interface TrackHeaderProps {
  track: Track;
  isSelected: boolean;
}

export function TrackHeader({ track, isSelected }: TrackHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectTrack = useDAWStore((s) => s.selectTrack);
  const removeTrack = useDAWStore((s) => s.removeTrack);
  const duplicateTrack = useDAWStore((s) => s.duplicateTrack);
  const toggleMute = useDAWStore((s) => s.toggleMute);
  const toggleSolo = useDAWStore((s) => s.toggleSolo);
  const toggleArm = useDAWStore((s) => s.toggleArm);
  const setTrackVolume = useDAWStore((s) => s.setTrackVolume);
  const setTrackPan = useDAWStore((s) => s.setTrackPan);
  const updateTrack = useDAWStore((s) => s.updateTrack);
  const openEffects = useDAWStore((s) => s.openEffects);
  const addClip = useDAWStore((s) => s.addClip);

  const color = TRACK_COLORS[track.color];

  const handleImportAudio = useCallback(async (file: File) => {
    const buffer = await audioEngine.decodeAudioFile(file);
    const bpm = useDAWStore.getState().project.bpm;
    const durationBeats = (buffer.duration / 60) * bpm;

    const existingClips = track.clips;
    const lastEnd = existingClips.reduce(
      (max, c) => Math.max(max, c.startBeat + c.durationBeats),
      0
    );

    addClip(track.id, {
      startBeat: lastEnd,
      durationBeats,
      name: file.name.replace(/\.[^.]+$/, ''),
      color,
      audioBuffer: buffer,
      gain: 1.0,
      fadeIn: 0,
      fadeOut: 0,
    });
  }, [track, color, addClip]);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(track.name);

  return (
    <div
      className={cn(
        'flex flex-col w-full border-b border-[#1e1e2a] bg-[#111118] select-none',
        isSelected && 'bg-[#1a1a24]'
      )}
      style={{ height: track.height }}
      onClick={() => selectTrack(track.id)}
    >
      {/* Top row */}
      <div className="flex items-center gap-1.5 px-2 pt-1.5">
        {/* Color indicator */}
        <div
          className="w-1.5 h-8 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Collapse toggle */}
        <button
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Name */}
        {editingName ? (
          <input
            autoFocus
            className="flex-1 bg-[#22222e] text-[#e8e8f0] text-xs rounded px-1 outline-none border border-[#6c63ff]"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => {
              updateTrack(track.id, { name: nameValue });
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateTrack(track.id, { name: nameValue });
                setEditingName(false);
              }
              if (e.key === 'Escape') {
                setNameValue(track.name);
                setEditingName(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-xs font-medium text-[#e8e8f0] truncate cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
          >
            {track.name}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 ml-auto">
          <TrackBtn
            onClick={(e) => {
              e.stopPropagation();
              toggleMute(track.id);
            }}
            active={track.muted}
            activeColor="#f59e0b"
            title="Mute"
          >
            <Volume2 size={11} />
          </TrackBtn>
          <TrackBtn
            onClick={(e) => {
              e.stopPropagation();
              toggleSolo(track.id);
            }}
            active={track.soloed}
            activeColor="#22c55e"
            title="Solo"
          >
            <span className="text-[9px] font-bold">S</span>
          </TrackBtn>
          <TrackBtn
            onClick={(e) => {
              e.stopPropagation();
              toggleArm(track.id);
            }}
            active={track.armed}
            activeColor="#ef4444"
            title="Record arm"
          >
            <Mic size={11} />
          </TrackBtn>
        </div>
      </div>

      {/* Bottom row: volume, pan, effects */}
      {!collapsed && track.height >= 64 && (
        <div className="flex items-center gap-2 px-2 pb-1 mt-auto">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-[9px] text-[#55557a] w-3">V</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.01}
              value={track.volume}
              onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1"
              title={`Volume: ${Math.round(track.volume * 100)}%`}
            />
          </div>
          <div className="flex items-center gap-1 w-20">
            <span className="text-[9px] text-[#55557a] w-3">P</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={track.pan}
              onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1"
              title={`Pan: ${track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}`}
            />
          </div>

          {/* Icons */}
          <button
            title="Import audio"
            className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload size={11} />
          </button>
          <button
            title="Effects"
            className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              openEffects(track.id);
            }}
          >
            <Sliders size={11} />
          </button>
          <button
            title="Duplicate track"
            className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              duplicateTrack(track.id);
            }}
          >
            <Copy size={11} />
          </button>
          <button
            title="Remove track"
            className="text-[#55557a] hover:text-red-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remove "${track.name}"?`)) removeTrack(track.id);
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportAudio(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function TrackBtn({
  children,
  onClick,
  active,
  activeColor,
  title,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  activeColor: string;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors',
        active ? 'text-white' : 'text-[#55557a] hover:text-[#8888aa]'
      )}
      style={active ? { backgroundColor: activeColor + '33', color: activeColor } : undefined}
    >
      {children}
    </button>
  );
}

import React from 'react';
