import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDAWStore } from '@/store/daw-store';
import type { Clip, Track } from '@/types';
import { generateId } from '@/utils/id';
import { TRACK_COLORS } from '@/types';

const RULER_HEIGHT = 28;
const RESIZE_HANDLE_PX = 8;
const MIN_CLIP_BEATS = 0.125;
const TRACK_RESIZE_HANDLE_PX = 6;
const MIN_TRACK_HEIGHT = 48;

// ─── Color map ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  purple: '#6c63ff', cyan: '#06b6d4', green: '#22c55e',
  amber: '#f59e0b',  red: '#ef4444',  pink: '#ec4899', blue: '#3b82f6',
};

// ─── Ruler ────────────────────────────────────────────────────────────────────
function TimelineRuler({
  zoom, scrollX, width, numerator, position,
  loopEnabled, loopStart, loopEnd, onSeek,
}: {
  zoom: number; scrollX: number; width: number; bpm: number;
  numerator: number; position: number; loopEnabled: boolean;
  loopStart: number; loopEnd: number;
  onSeek: (beat: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr; c.height = RULER_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    const startBeat = scrollX / zoom;
    const endBeat = startBeat + width / zoom;
    const first = Math.floor(startBeat / numerator);
    const last  = Math.ceil(endBeat / numerator);

    if (loopEnabled) {
      const lx = loopStart * zoom - scrollX;
      const lw = (loopEnd - loopStart) * zoom;
      ctx.fillStyle = 'rgba(108,99,255,0.12)';
      ctx.fillRect(lx, 0, lw, RULER_HEIGHT);
    }

    ctx.font = '10px system-ui';
    for (let bar = first; bar <= last; bar++) {
      const beat = bar * numerator;
      const x = (beat - startBeat) * zoom;
      ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, RULER_HEIGHT); ctx.lineTo(x, 0); ctx.stroke();
      ctx.fillStyle = '#9090b8';
      ctx.fillText(String(bar + 1), x + 4, 16);
      if (zoom > 30) {
        for (let b = 1; b < numerator; b++) {
          const bx = x + b * zoom;
          ctx.strokeStyle = '#1e1e2a'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx, RULER_HEIGHT); ctx.lineTo(bx, RULER_HEIGHT * 0.45); ctx.stroke();
        }
      }
    }

    const px = (position - startBeat) * zoom;
    ctx.strokeStyle = '#ff3c3c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, RULER_HEIGHT); ctx.stroke();
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath(); ctx.moveTo(px - 5, 0); ctx.lineTo(px + 5, 0); ctx.lineTo(px, 9); ctx.closePath(); ctx.fill();
  }, [zoom, scrollX, width, numerator, position, loopEnabled, loopStart, loopEnd]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, scrollX / zoom + (e.clientX - rect.left) / zoom));
  }, [scrollX, zoom, onSeek]);

  return (
    <canvas ref={ref} width={width} height={RULER_HEIGHT} onClick={handleClick}
      className="cursor-pointer block" style={{ height: RULER_HEIGHT, width }} />
  );
}

// ─── Waveform canvas ──────────────────────────────────────────────────────────
function WaveformCanvas({ audioBuffer, color, width, height }: {
  audioBuffer: AudioBuffer; color: string; width: number; height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c || width <= 0 || height <= 0) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr; c.height = height * dpr;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height);
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const mid = height / 2;
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      let min = 1, max = -1;
      const s0 = x * step;
      for (let s = 0; s < step && s0 + s < data.length; s++) {
        const v = data[s0 + s]; if (v < min) min = v; if (v > max) max = v;
      }
      ctx.lineTo(x, mid + min * mid * 0.9);
      ctx.lineTo(x, mid + max * mid * 0.9);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }, [audioBuffer, color, width, height]);
  return <canvas ref={ref} width={width} height={height} style={{ width, height, display: 'block' }} />;
}

// ─── MIDI mini pattern ────────────────────────────────────────────────────────
function MidiPattern({ clip, color, width, height }: {
  clip: Clip; color: string; width: number; height: number;
}) {
  if (clip.notes && clip.notes.length > 0) {
    // Real notes
    const notes = clip.notes;
    const minP = Math.min(...notes.map(n => n.pitch));
    const maxP = Math.max(...notes.map(n => n.pitch));
    const span = Math.max(maxP - minP + 1, 12);
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {notes.map(n => {
          const x = (n.startBeat / clip.durationBeats) * width;
          const w = Math.max(2, (n.durationBeats / clip.durationBeats) * width - 1);
          const y = ((maxP - n.pitch) / span) * height;
          const h = Math.max(2, height / span);
          return (
            <div key={n.id} className="absolute rounded-sm"
              style={{ left: x, top: y, width: w, height: h,
                backgroundColor: `rgba(${r},${g},${b},0.85)` }} />
          );
        })}
      </div>
    );
  }
  // Placeholder pattern
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  let rng = r * 1000 + g * 100 + b;
  const next = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; };
  const bars = [];
  const cols = Math.floor(width / 8);
  const rows = Math.floor(height / 4);
  for (let i = 0; i < Math.min(20, cols * 2); i++) {
    bars.push({ x: Math.floor(next() * (width - 12)) + 4, y: Math.floor(next() * (rows-1)) * 4, w: Math.floor(next() * 16) + 8 });
  }
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bars.map((bar, i) => (
        <div key={i} className="absolute rounded-sm"
          style={{ left: bar.x, bottom: bar.y + 2, width: Math.min(bar.w, width - bar.x - 4), height: 3,
            backgroundColor: `rgba(${r},${g},${b},0.7)` }} />
      ))}
    </div>
  );
}

// ─── Clip context menu ────────────────────────────────────────────────────────
function ClipContextMenu({ x, y, clip, trackId, onClose }: {
  x: number; y: number; clip: Clip; trackId: string; onClose: () => void;
}) {
  const removeClip = useDAWStore(s => s.removeClip);
  const updateClip = useDAWStore(s => s.updateClip);
  const openPianoRoll = useDAWStore(s => s.openPianoRoll);
  const track = useDAWStore(s => s.tracks.find(t => t.id === trackId));

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [onClose]);

  const items = [
    track?.type === 'midi' && {
      label: '♪ Open in Piano Roll',
      action: () => { openPianoRoll(clip.id); onClose(); }
    },
    { label: 'Rename', action: () => {
      const name = prompt('Clip name:', clip.name);
      if (name) { updateClip(trackId, clip.id, { name }); }
      onClose();
    }},
    { label: 'Duplicate', action: () => {
      const { addClip } = useDAWStore.getState();
      addClip(trackId, { ...clip, startBeat: clip.startBeat + clip.durationBeats });
      onClose();
    }},
    { label: 'Delete', danger: true, action: () => { removeClip(trackId, clip.id); onClose(); }},
  ].filter(Boolean) as { label: string; danger?: boolean; action: () => void }[];

  return (
    <div className="fixed z-[200] bg-[#1a1a24] border border-[#2a2a38] rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onMouseDown={e => e.stopPropagation()}
    >
      {items.map((item) => (
        <button key={item.label} onClick={item.action}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2a38] transition-colors ${item.danger ? 'text-red-400' : 'text-[#e8e8f0]'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Single clip view ─────────────────────────────────────────────────────────
function ClipView({ clip, color, trackId, trackType, zoom, scrollX, trackHeight, isSelected }: {
  clip: Clip; color: string; trackId: string; trackType: Track['type'];
  zoom: number; scrollX: number; trackHeight: number; isSelected: boolean;
}) {
  const tool = useDAWStore(s => s.ui.tool);
  const snapEnabled = useDAWStore(s => s.ui.snapEnabled);
  const snapGrid = useDAWStore(s => s.ui.snapGrid);
  const selectClip = useDAWStore(s => s.selectClip);
  const updateClip = useDAWStore(s => s.updateClip);
  const removeClip = useDAWStore(s => s.removeClip);
  const addClip = useDAWStore(s => s.addClip);
  const openPianoRoll = useDAWStore(s => s.openPianoRoll);
  const dragRef = useRef<{ type: 'move' | 'resize'; startX: number; startBeat: number; startDur: number } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const x = clip.startBeat * zoom - scrollX;
  const w = Math.max(8, clip.durationBeats * zoom);
  const h = trackHeight - 1;

  const snap = (beat: number) => {
    if (!snapEnabled) return Math.max(0, beat);
    return Math.max(0, Math.round(beat / snapGrid) * snapGrid);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button === 2) return;

    if (tool === 'erase') { removeClip(trackId, clip.id); return; }
    if (tool === 'split') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const splitBeat = snap(clip.startBeat + clickX / zoom);
      if (splitBeat <= clip.startBeat + MIN_CLIP_BEATS || splitBeat >= clip.startBeat + clip.durationBeats - MIN_CLIP_BEATS) return;
      const leftDur = splitBeat - clip.startBeat;
      const rightDur = clip.durationBeats - leftDur;
      updateClip(trackId, clip.id, { durationBeats: leftDur });
      addClip(trackId, { ...clip, startBeat: splitBeat, durationBeats: rightDur });
      return;
    }

    selectClip(clip.id);
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isResizing = e.clientX - rect.left > w - RESIZE_HANDLE_PX - (x < 0 ? -x : 0);

    dragRef.current = {
      type: isResizing ? 'resize' : 'move',
      startX: e.clientX,
      startBeat: clip.startBeat,
      startDur: clip.durationBeats,
    };

    const handleMove = (ev: MouseEvent) => {
      const d = dragRef.current; if (!d) return;
      const delta = (ev.clientX - d.startX) / zoom;
      if (d.type === 'move') {
        updateClip(trackId, clip.id, { startBeat: snap(d.startBeat + delta) });
      } else {
        const newDur = Math.max(MIN_CLIP_BEATS, snap(d.startDur + delta));
        updateClip(trackId, clip.id, { durationBeats: newDur });
      }
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackType === 'midi') openPianoRoll(clip.id);
  };

  if (x + w < 0 || x > 4000) return null;

  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  const waveH = Math.max(0, h - 20);

  const cursor = tool === 'erase' ? 'cursor-not-allowed' :
    tool === 'split' ? 'cursor-col-resize' :
    'cursor-grab active:cursor-grabbing';

  return (
    <>
      <div
        className={`absolute top-0 overflow-hidden select-none ${cursor}`}
        style={{
          left: x, width: w, height: h,
          background: `linear-gradient(180deg, rgba(${r},${g},${b},0.38) 0%, rgba(${r},${g},${b},0.20) 100%)`,
          borderLeft: `3px solid ${color}`,
          borderTop: isSelected ? `1.5px solid ${color}` : `1.5px solid rgba(${r},${g},${b},0.4)`,
          borderRight: isSelected ? `1.5px solid rgba(${r},${g},${b},0.6)` : 'none',
          borderBottom: isSelected ? `1.5px solid rgba(${r},${g},${b},0.6)` : 'none',
          boxShadow: isSelected ? `inset 0 0 0 1px rgba(255,255,255,0.06)` : undefined,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        {/* Clip name */}
        <span className="absolute top-1 left-2 text-[10px] font-semibold text-white/90 truncate pointer-events-none z-10 leading-none"
          style={{ maxWidth: w - 12 }}>
          {clip.name}
        </span>

        {/* Content */}
        {clip.audioBuffer && waveH > 4 && w > 8 && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: waveH }}>
            <WaveformCanvas audioBuffer={clip.audioBuffer}
              color={`rgba(${r},${g},${b},0.9)`}
              width={Math.floor(w - 4)} height={waveH} />
          </div>
        )}
        {!clip.audioBuffer && w > 12 && waveH > 4 && (
          <MidiPattern clip={clip} color={color} width={w} height={waveH} />
        )}

        {/* Resize handle */}
        {tool === 'pointer' && (
          <div className="absolute top-0 right-0 h-full cursor-col-resize opacity-0 hover:opacity-100 hover:bg-white/10 transition-opacity"
            style={{ width: RESIZE_HANDLE_PX }}
            onMouseDown={(e) => {
              e.stopPropagation();
              dragRef.current = { type: 'resize', startX: e.clientX, startBeat: clip.startBeat, startDur: clip.durationBeats };
              const move = (ev: MouseEvent) => {
                if (!dragRef.current) return;
                const delta = (ev.clientX - dragRef.current.startX) / zoom;
                updateClip(trackId, clip.id, { durationBeats: Math.max(MIN_CLIP_BEATS, snap(dragRef.current.startDur + delta)) });
              };
              const up = () => { dragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
            }}
          />
        )}
      </div>

      {ctxMenu && (
        <ClipContextMenu x={ctxMenu.x} y={ctxMenu.y} clip={clip} trackId={trackId}
          onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

// ─── Grid lines ───────────────────────────────────────────────────────────────
function GridLines({ zoom, scrollX, width, numerator, height }: {
  zoom: number; scrollX: number; width: number; numerator: number; height: number;
}) {
  const startBeat = scrollX / zoom;
  const first = Math.floor(startBeat / numerator);
  const last  = Math.ceil((startBeat + width / zoom) / numerator);
  return (
    <>
      {Array.from({ length: last - first + 1 }, (_, i) => {
        const x = (first + i) * numerator * zoom - scrollX;
        return <div key={i} className="absolute top-0 h-full w-px" style={{ left: x, backgroundColor: '#1e1e2c' }} />;
      })}
      {zoom > 30 && Array.from({ length: (last - first + 1) * numerator }, (_, i) => {
        const beat = first * numerator + i;
        if (beat % numerator === 0) return null;
        const x = beat * zoom - scrollX;
        return <div key={`b${beat}`} className="absolute top-0 h-full w-px" style={{ left: x, backgroundColor: '#161620' }} />;
      })}
    </>
  );
}

// ─── Track lane (clips + resize border) ──────────────────────────────────────
function TrackLane({ track, zoom, scrollX, position, startBeat, loopEnabled, loopStart, loopEnd, width }: {
  track: Track; zoom: number; scrollX: number; position: number; startBeat: number;
  loopEnabled: boolean; loopStart: number; loopEnd: number; width: number;
}) {
  const selectedClipId = useDAWStore(s => s.ui.selectedClipId);
  const updateTrack = useDAWStore(s => s.updateTrack);
  const tool = useDAWStore(s => s.ui.tool);
  const snapEnabled = useDAWStore(s => s.ui.snapEnabled);
  const snapGrid = useDAWStore(s => s.ui.snapGrid);
  const addClip = useDAWStore(s => s.addClip);
  const colorHex = COLOR_MAP[track.color] || '#6c63ff';

  // Track height resize
  const resizeDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const handleResizeDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeDragRef.current = { startY: e.clientY, startH: track.height };
    const move = (ev: MouseEvent) => {
      if (!resizeDragRef.current) return;
      const newH = Math.max(MIN_TRACK_HEIGHT, resizeDragRef.current.startH + ev.clientY - resizeDragRef.current.startY);
      updateTrack(track.id, { height: newH });
    };
    const up = () => { resizeDragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const handleLaneClick = (e: React.MouseEvent) => {
    if (tool !== 'draw') return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickBeat = scrollX / zoom + (e.clientX - rect.left) / zoom;
    const snapped = snapEnabled ? Math.round(clickBeat / snapGrid) * snapGrid : clickBeat;
    const dur = snapGrid * 4;
    addClip(track.id, {
      startBeat: Math.max(0, snapped), durationBeats: dur,
      name: 'Clip', color: colorHex, gain: 1, fadeIn: 0, fadeOut: 0,
      notes: track.type === 'midi' ? [] : undefined,
    });
  };

  return (
    <div className="relative border-b border-[#1a1a24] overflow-visible"
      style={{ height: track.height, background: '#0c0c14', cursor: tool === 'draw' ? 'crosshair' : undefined }}
      onClick={handleLaneClick}
    >
      <GridLines zoom={zoom} scrollX={scrollX} width={width} numerator={4} height={track.height} />

      {loopEnabled && (
        <div className="absolute top-0 h-full pointer-events-none"
          style={{ left: loopStart * zoom - scrollX, width: (loopEnd - loopStart) * zoom,
            background: 'rgba(108,99,255,0.07)', borderLeft: '1px solid rgba(108,99,255,0.3)', borderRight: '1px solid rgba(108,99,255,0.3)' }}
        />
      )}

      {track.clips.map(clip => (
        <ClipView key={clip.id} clip={clip} color={colorHex}
          trackId={track.id} trackType={track.type}
          zoom={zoom} scrollX={scrollX} trackHeight={track.height}
          isSelected={clip.id === selectedClipId} />
      ))}

      {/* Playhead */}
      <div className="absolute top-0 h-full w-px pointer-events-none z-20"
        style={{ left: (position - startBeat) * zoom, background: 'rgba(255,60,60,0.7)' }} />

      {/* Resize handle */}
      <div className="absolute bottom-0 left-0 right-0 cursor-row-resize hover:bg-[#6c63ff]/20 transition-colors"
        style={{ height: TRACK_RESIZE_HANDLE_PX }}
        onMouseDown={handleResizeDrag} />
    </div>
  );
}

// ─── Main Timeline ────────────────────────────────────────────────────────────
export function Timeline() {
  const tracks = useDAWStore(s => s.tracks);
  const zoom = useDAWStore(s => s.ui.zoom);
  const scrollX = useDAWStore(s => s.ui.scrollX);
  const scrollY = useDAWStore(s => s.ui.scrollY);
  const position = useDAWStore(s => s.transport.position);
  const bpm = useDAWStore(s => s.project.bpm);
  const numerator = useDAWStore(s => s.project.timeSignature.numerator);
  const loopStart = useDAWStore(s => s.transport.loopStart);
  const loopEnd = useDAWStore(s => s.transport.loopEnd);
  const loopEnabled = useDAWStore(s => s.transport.loopEnabled);

  const setPosition = useDAWStore(s => s.seekTo);
  const setScroll = useDAWStore(s => s.setScroll);
  const setZoom = useDAWStore(s => s.setZoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
    } else if (e.shiftKey) {
      setScroll(scrollX + e.deltaY * 2, scrollY);
    } else {
      setScroll(scrollX + e.deltaX * 2, scrollY + e.deltaY);
    }
  }, [zoom, scrollX, scrollY, setZoom, setScroll]);

  const startBeat = scrollX / zoom;

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#0a0a10]" onWheel={handleWheel}>
      {/* Ruler */}
      <div className="sticky top-0 z-10 bg-[#0a0a12] border-b border-[#1e1e2a]">
        <TimelineRuler zoom={zoom} scrollX={scrollX} width={width} bpm={bpm}
          numerator={numerator} position={position} loopEnabled={loopEnabled}
          loopStart={loopStart} loopEnd={loopEnd} onSeek={setPosition} />
      </div>

      {/* Track lanes */}
      <div className="relative" style={{ transform: `translateY(-${scrollY % 1}px)` }}>
        {tracks.map(track => (
          <TrackLane key={track.id} track={track} zoom={zoom} scrollX={scrollX}
            position={position} startBeat={startBeat} loopEnabled={loopEnabled}
            loopStart={loopStart} loopEnd={loopEnd} width={width} />
        ))}
      </div>
    </div>
  );
}
