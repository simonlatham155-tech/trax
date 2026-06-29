import { useState, useRef, useCallback } from 'react';
import {
  Mic,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Sliders,
  Upload,
  Plus,
} from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { cn } from '@/utils/cn';
import { TRACK_COLORS } from '@/types';
import type { Track } from '@/types';
import { PluginManager } from '@/components/plugins/PluginManager';
import type { BridgePlugin } from '@/services/vstBridge';
import { vstBridge } from '@/services/vstBridge';

interface TrackHeaderProps {
  track: Track;
  isSelected: boolean;
}

const TYPE_LABEL: Record<Track['type'], string> = {
  audio: 'AUDIO',
  midi: 'MIDI',
  bus: 'BUS',
};

const TYPE_COLOR: Record<Track['type'], string> = {
  audio: '#1e4a6e',
  midi: '#1e3a5f',
  bus: '#1e3e2a',
};

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

  const handleImportAudioFile = useCallback(
    async (file: File) => {
      const buffer = await audioEngine.decodeAudioFile(file);
      const bpm = useDAWStore.getState().project.bpm;
      const durationBeats = (buffer.duration / 60) * bpm;
      const lastEnd = track.clips.reduce(
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
        originalBpm: useDAWStore.getState().project.bpm,
      });
    },
    [track, color, addClip]
  );


  const setTrackInstrument = useDAWStore((s) => s.setTrackInstrument);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(track.name);
  const [showPluginPicker, setShowPluginPicker] = useState(false);

  const handlePluginSelect = useCallback(
    async (plugin: BridgePlugin) => {
      setTrackInstrument(track.id, plugin.path);
      updateTrack(track.id, { name: plugin.name });
      setNameValue(plugin.name);
      // Pre-load the plugin in the bridge for faster first render
      if (vstBridge.currentStatus === 'connected') {
        await vstBridge.loadPlugin(track.id, plugin.path);
      }
    },
    [track.id, setTrackInstrument, updateTrack]
  );

  const pluginName = track.instrument
    ? track.instrument.split(/[\\/]/).pop()?.replace(/\.(vst3|vst|dll|component)$/i, '') ?? 'Plugin'
    : null;

  return (
    <div
      className={cn(
        'flex flex-col w-full border-b border-[#1e1e2a] select-none transition-colors',
        isSelected ? 'bg-[#1c1c28]' : 'bg-[#131318]'
      )}
      style={{ height: track.height }}
      onClick={() => selectTrack(track.id)}
    >
      {/* ── Row 1: dot + name + M/S/arm + collapse ── */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
        {/* Colored circle */}
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/30"
          style={{ backgroundColor: color }}
        />

        {/* Track name */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              className="w-full bg-[#22222e] text-[#e8e8f0] text-xs rounded px-1 outline-none border border-[#6c63ff]"
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
              className="text-xs font-semibold text-[#e8e8f0] truncate block cursor-text leading-tight"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingName(true);
              }}
            >
              {track.name}
            </span>
          )}
        </div>

        {/* M button */}
        <button
          title="Mute"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(track.id);
          }}
          className={cn(
            'w-5 h-5 rounded text-[10px] font-bold transition-colors flex items-center justify-center shrink-0',
            track.muted
              ? 'bg-[#f59e0b] text-black'
              : 'bg-[#2a2a38] text-[#8888aa] hover:text-[#e8e8f0]'
          )}
        >
          M
        </button>

        {/* S button */}
        <button
          title="Solo"
          onClick={(e) => {
            e.stopPropagation();
            toggleSolo(track.id);
          }}
          className={cn(
            'w-5 h-5 rounded text-[10px] font-bold transition-colors flex items-center justify-center shrink-0',
            track.soloed
              ? 'bg-[#22c55e] text-black'
              : 'bg-[#2a2a38] text-[#8888aa] hover:text-[#e8e8f0]'
          )}
        >
          S
        </button>

        {/* Collapse toggle */}
        <button
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {!collapsed && track.height >= 64 && (
        <>
          {/* ── Row 2: type badge + plugin badge ── */}
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white/90 shrink-0"
              style={{ backgroundColor: TYPE_COLOR[track.type] }}
            >
              {TYPE_LABEL[track.type]}
            </span>
            <button
              className="flex items-center gap-0.5 text-[10px] text-[#a0a0c0] bg-[#1e1e2c] hover:bg-[#2a2a3a] border border-[#2a2a3a] rounded px-1.5 py-0.5 truncate max-w-[120px] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowPluginPicker(true);
              }}
              title={pluginName ? `Plugin: ${pluginName}` : 'Select VST plugin'}
            >
              {pluginName ? (
                <>
                  <span className="truncate">{pluginName}</span>
                  <ChevronDown size={8} className="shrink-0 opacity-60 ml-0.5" />
                </>
              ) : (
                <>
                  <Plus size={8} className="shrink-0 opacity-70" />
                  <span className="truncate">Add VST</span>
                </>
              )}
            </button>

            {/* Right side icons */}
            <div className="ml-auto flex items-center gap-0.5">
              <button
                title={track.armed ? 'Disarm track' : 'Arm track for recording'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArm(track.id);
                }}
                className={cn(
                  'w-4 h-4 flex items-center justify-center rounded transition-colors relative',
                  track.armed
                    ? 'text-[#ef4444] bg-[#ef4444]/15'
                    : 'text-[#55557a] hover:text-[#ef4444]'
                )}
              >
                <Mic size={9} />
                {track.armed && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                )}
              </button>
              <button
                title="Import audio"
                className="w-4 h-4 flex items-center justify-center text-[#55557a] hover:text-[#e8e8f0] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={9} />
              </button>
              <button
                title="Effects"
                className="w-4 h-4 flex items-center justify-center text-[#55557a] hover:text-[#e8e8f0] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openEffects(track.id);
                }}
              >
                <Sliders size={9} />
              </button>
              <button
                title="Duplicate"
                className="w-4 h-4 flex items-center justify-center text-[#55557a] hover:text-[#e8e8f0] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateTrack(track.id);
                }}
              >
                <Copy size={9} />
              </button>
              <button
                title="Remove track"
                className="w-4 h-4 flex items-center justify-center text-[#55557a] hover:text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove "${track.name}"?`)) removeTrack(track.id);
                }}
              >
                <Trash2 size={9} />
              </button>
            </div>
          </div>

          {/* ── Row 3: volume + pan sliders + VU meters ── */}
          <div className="flex flex-col gap-0.5 px-2 pb-1.5 mt-auto">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[#55557a] w-3 shrink-0">V</span>
              <input
                type="range" min={0} max={1.5} step={0.01}
                value={track.volume}
                onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-1 min-w-0"
                style={{ accentColor: color }}
                title={`Volume: ${Math.round(track.volume * 100)}%`}
              />
              <MiniVU color={color} volume={track.volume} muted={track.muted} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[#55557a] w-3 shrink-0">P</span>
              <input
                type="range" min={-1} max={1} step={0.01}
                value={track.pan}
                onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-1 min-w-0"
                style={{ accentColor: color }}
                title={`Pan: ${track.pan > 0 ? `R${Math.round(track.pan*100)}` : track.pan < 0 ? `L${Math.round(-track.pan*100)}` : 'C'}`}
              />
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportAudioFile(file);
          e.target.value = '';
        }}
      />

      {showPluginPicker && (
        <PluginManager
          selected={track.instrument}
          onSelect={handlePluginSelect}
          onClose={() => setShowPluginPicker(false)}
        />
      )}
    </div>
  );
}

function MiniVU({
  color,
  volume,
  muted,
}: {
  color: string;
  volume: number;
  muted: boolean;
}) {
  const bars = 5;
  const lit = muted ? 0 : Math.round(volume * bars);
  return (
    <div className="flex items-end gap-px shrink-0">
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          className="w-1 rounded-sm transition-colors"
          style={{
            height: 4 + i * 2,
            backgroundColor:
              i < lit
                ? i >= bars - 1
                  ? '#ef4444'
                  : i >= bars - 2
                  ? '#f59e0b'
                  : color
                : '#2a2a38',
          }}
        />
      ))}
    </div>
  );
}

import React from 'react';
