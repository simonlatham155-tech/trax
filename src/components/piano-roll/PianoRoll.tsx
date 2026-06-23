import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronDown, ChevronUp, Pencil, MousePointer2, Eraser } from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { generateId } from '@/utils/id';
import { cn } from '@/utils/cn';
import type { MidiNote } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const KEY_WIDTH = 48;
const ROW_HEIGHT = 14;      // px per semitone
const TOTAL_NOTES = 128;
const VELOCITY_AREA_H = 60;
const DEFAULT_VELOCITY = 100;
const MIN_NOTE_BEATS = 0.0625;

// Note names
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const isBlack = (pitch: number) => [1,3,6,8,10].includes(pitch % 12);
const noteName = (pitch: number) => `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 2}`;

type PRTool = 'draw' | 'pointer' | 'erase';

// ── Piano keys sidebar ────────────────────────────────────────────────────────
function PianoKeys({ scrollTop, onPreview }: {
  scrollTop: number; onPreview?: (pitch: number, on: boolean) => void;
}) {
  return (
    <div className="relative overflow-hidden shrink-0 border-r border-[#2a2a38]"
      style={{ width: KEY_WIDTH, height: TOTAL_NOTES * ROW_HEIGHT }}>
      {Array.from({ length: TOTAL_NOTES }, (_, i) => {
        const pitch = TOTAL_NOTES - 1 - i;
        const black = isBlack(pitch);
        const isC = pitch % 12 === 0;
        return (
          <div key={pitch}
            className={cn(
              'absolute left-0 flex items-center justify-end pr-1 select-none cursor-pointer border-b',
              black
                ? 'bg-[#1e1e2a] border-[#111118] hover:bg-[#2a2a38]'
                : isC
                ? 'bg-[#1a1a26] border-[#2a2a38] hover:bg-[#22222e]'
                : 'bg-[#151520] border-[#2a2a38] hover:bg-[#1e1e2a]'
            )}
            style={{ top: i * ROW_HEIGHT, width: KEY_WIDTH, height: ROW_HEIGHT }}
            onMouseDown={() => onPreview?.(pitch, true)}
            onMouseUp={() => onPreview?.(pitch, false)}
            onMouseLeave={() => onPreview?.(pitch, false)}
          >
            {isC && <span className="text-[8px] text-[#55557a]">{noteName(pitch)}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Note block ────────────────────────────────────────────────────────────────
function NoteBlock({ note, zoom, color, isSelected, onMouseDown }: {
  note: MidiNote; zoom: number; color: string; isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, note: MidiNote, mode: 'move' | 'resize') => void;
}) {
  const y = (TOTAL_NOTES - 1 - note.pitch) * ROW_HEIGHT;
  const x = note.startBeat * zoom;
  const w = Math.max(4, note.durationBeats * zoom - 1);
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);

  return (
    <div className="absolute cursor-grab active:cursor-grabbing select-none rounded-sm"
      style={{
        left: x, top: y + 1, width: w, height: ROW_HEIGHT - 2,
        backgroundColor: isSelected ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},0.85)`,
        border: isSelected ? `1px solid white` : `1px solid rgba(255,255,255,0.2)`,
      }}
      onMouseDown={e => { e.stopPropagation(); onMouseDown(e, note, 'move'); }}
    >
      {/* Resize handle right */}
      <div className="absolute top-0 right-0 h-full w-2 cursor-col-resize"
        onMouseDown={e => { e.stopPropagation(); onMouseDown(e, note, 'resize'); }} />
    </div>
  );
}

// ── Velocity bars ─────────────────────────────────────────────────────────────
function VelocityEditor({ notes, color, zoom, width, onVelocityChange }: {
  notes: MidiNote[]; color: string; zoom: number; width: number;
  onVelocityChange: (noteId: string, velocity: number) => void;
}) {
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);

  return (
    <div className="relative bg-[#080810] border-t border-[#2a2a38]" style={{ height: VELOCITY_AREA_H }}>
      <div className="absolute left-2 top-1 text-[9px] text-[#3a3a4a] font-semibold uppercase tracking-wider">Velocity</div>
      {notes.map(note => {
        const x = note.startBeat * zoom;
        const barW = Math.max(2, note.durationBeats * zoom - 2);
        const barH = (note.velocity / 127) * (VELOCITY_AREA_H - 12);
        return (
          <div key={note.id} className="absolute bottom-2 cursor-ns-resize"
            style={{ left: x, width: barW, height: VELOCITY_AREA_H - 8, display: 'flex', alignItems: 'flex-end' }}
            onMouseDown={e => {
              e.stopPropagation();
              const startY = e.clientY;
              const startV = note.velocity;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const move = (ev: MouseEvent) => {
                const dy = startY - ev.clientY;
                const newV = Math.max(1, Math.min(127, Math.round(startV + dy)));
                onVelocityChange(note.id, newV);
              };
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
            }}
          >
            <div className="w-full rounded-t-sm" style={{ height: barH, backgroundColor: `rgba(${r},${g},${b},0.8)` }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Grid canvas ───────────────────────────────────────────────────────────────
function GridCanvas({ zoom, scrollX, width, height, numerator }: {
  zoom: number; scrollX: number; width: number; height: number; numerator: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr; c.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const startBeat = scrollX / zoom;
    const endBeat = startBeat + width / zoom;

    // Horizontal lines (per semitone + octave emphasis)
    for (let p = 0; p < TOTAL_NOTES; p++) {
      const y = p * ROW_HEIGHT;
      if (y > height) break;
      const isOctave = (TOTAL_NOTES - 1 - p) % 12 === 0;
      ctx.fillStyle = isOctave ? '#1a1a28' : '#111118';
      ctx.fillRect(0, y, width, ROW_HEIGHT);
      ctx.fillStyle = isOctave ? '#2a2a3a' : '#1e1e28';
      ctx.fillRect(0, y + ROW_HEIGHT - 1, width, 1);
    }

    // Black key rows
    for (let p = 0; p < TOTAL_NOTES; p++) {
      const pitch = TOTAL_NOTES - 1 - p;
      if (isBlack(pitch)) {
        const y = p * ROW_HEIGHT;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, y, width, ROW_HEIGHT);
      }
    }

    // Vertical bar / beat lines
    const first = Math.floor(startBeat / numerator);
    const last  = Math.ceil(endBeat / numerator);
    for (let bar = first; bar <= last; bar++) {
      const x = bar * numerator * zoom - scrollX;
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, 0, 1, height);
      if (zoom > 30) {
        for (let b = 1; b < numerator; b++) {
          const bx = x + b * zoom;
          ctx.fillStyle = '#1a1a28'; ctx.fillRect(bx, 0, 1, height);
        }
      }
    }
  }, [zoom, scrollX, width, height, numerator]);

  return <canvas ref={ref} width={width} height={height} className="absolute top-0 left-0 pointer-events-none" style={{ width, height }} />;
}

// ── Main Piano Roll ───────────────────────────────────────────────────────────
export function PianoRoll({ clipId }: { clipId: string }) {
  const allTracks = useDAWStore(s => s.tracks);
  const track = allTracks.find(t => t.clips.some(c => c.id === clipId));
  const clip = track?.clips.find(c => c.id === clipId);
  const openPianoRoll = useDAWStore(s => s.openPianoRoll);
  const addMidiNote = useDAWStore(s => s.addMidiNote);
  const updateMidiNote = useDAWStore(s => s.updateMidiNote);
  const removeMidiNote = useDAWStore(s => s.removeMidiNote);
  const snapEnabled = useDAWStore(s => s.ui.snapEnabled);
  const snapGrid = useDAWStore(s => s.ui.snapGrid);
  const bpm = useDAWStore(s => s.project.bpm);
  const position = useDAWStore(s => s.transport.position);
  const numerator = useDAWStore(s => s.project.timeSignature.numerator);

  const [tool, setTool] = useState<PRTool>('draw');
  const [zoom, setZoom] = useState(80);
  const [scrollX, setScrollX] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [height, setHeight] = useState(220);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridWidth = containerRef.current ? containerRef.current.clientWidth - KEY_WIDTH : 800;
  const gridHeight = TOTAL_NOTES * ROW_HEIGHT;

  // Scroll to center of notes or middle C on first open
  useEffect(() => {
    const notes = clip?.notes;
    if (notes && notes.length > 0) {
      const midPitch = notes.reduce((s, n) => s + n.pitch, 0) / notes.length;
      setScrollTop(Math.max(0, (TOTAL_NOTES - 1 - Math.round(midPitch)) * ROW_HEIGHT - 100));
    } else {
      setScrollTop((TOTAL_NOTES - 1 - 60) * ROW_HEIGHT - 100); // middle C
    }
  }, [clipId]);

  const snap = useCallback((beat: number) => {
    if (!snapEnabled) return Math.max(0, beat);
    return Math.max(0, Math.round(beat / snapGrid) * snapGrid);
  }, [snapEnabled, snapGrid]);

  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!track || !clip) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const relX = e.clientX - rect.left + scrollX;
    const relY = e.clientY - rect.top + scrollTop;
    const beat = relX / zoom;
    const pitch = TOTAL_NOTES - 1 - Math.floor(relY / ROW_HEIGHT);
    if (pitch < 0 || pitch >= TOTAL_NOTES) return;

    if (tool === 'draw') {
      const snapped = snap(beat);
      const noteId = generateId();
      addMidiNote(track.id, clip.id, {
        pitch, startBeat: snapped, durationBeats: snapGrid || 0.25, velocity: DEFAULT_VELOCITY,
      });
      setSelectedNoteId(noteId);
    }
  }, [track, clip, scrollX, scrollTop, zoom, tool, snap, snapGrid, addMidiNote]);

  const handleNoteMouseDown = useCallback((e: React.MouseEvent, note: MidiNote, mode: 'move' | 'resize') => {
    if (!track || !clip) return;
    if (tool === 'erase') { removeMidiNote(track.id, clip.id, note.id); return; }
    setSelectedNoteId(note.id);
    const startX = e.clientX;
    const startBeat = note.startBeat;
    const startDur = note.durationBeats;
    const startPitch = note.pitch;
    const startY = e.clientY;

    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      if (mode === 'resize') {
        updateMidiNote(track.id, clip.id, note.id, { durationBeats: Math.max(MIN_NOTE_BEATS, snap(startDur + dx)) });
      } else {
        const dy = ev.clientY - startY;
        const pitchDelta = -Math.round(dy / ROW_HEIGHT);
        updateMidiNote(track.id, clip.id, note.id, {
          startBeat: snap(startBeat + dx),
          pitch: Math.max(0, Math.min(127, startPitch + pitchDelta)),
        });
      }
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }, [track, clip, tool, zoom, snap, updateMidiNote, removeMidiNote]);

  const handleVelocityChange = useCallback((noteId: string, velocity: number) => {
    if (!track || !clip) return;
    updateMidiNote(track.id, clip.id, noteId, { velocity });
  }, [track, clip, updateMidiNote]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoom(z => Math.max(20, Math.min(300, z * (e.deltaY > 0 ? 0.9 : 1.1))));
    } else {
      setScrollX(x => Math.max(0, x + e.deltaX * 2));
      setScrollTop(y => Math.max(0, y + e.deltaY));
    }
  }, []);

  // Resize handle
  const resizeDrag = useRef<{ startY: number; startH: number } | null>(null);
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeDrag.current = { startY: e.clientY, startH: height };
    const move = (ev: MouseEvent) => {
      if (!resizeDrag.current) return;
      setHeight(Math.max(120, Math.min(600, resizeDrag.current!.startH - (ev.clientY - resizeDrag.current!.startY))));
    };
    const up = () => { resizeDrag.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const color = track ? (
    { purple:'#6c63ff',cyan:'#06b6d4',green:'#22c55e',amber:'#f59e0b',red:'#ef4444',pink:'#ec4899',blue:'#3b82f6' }[track.color] || '#6c63ff'
  ) : '#6c63ff';

  if (!clip || !track) return null;
  const notes = clip.notes ?? [];

  return (
    <div className="flex flex-col border-t-2 border-[#6c63ff]/40 bg-[#0a0a12] shrink-0" style={{ height }}>
      {/* Resize handle top */}
      <div className="h-1.5 cursor-row-resize bg-[#1e1e2a] hover:bg-[#6c63ff]/30 transition-colors shrink-0"
        onMouseDown={handleResizeMouseDown} />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-[#1e1e2a] bg-[#0d0d18] shrink-0 h-8">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-[#e8e8f0] truncate">{track.name}</span>
        <span className="text-[10px] text-[#55557a]">/ {clip.name}</span>
        <span className="text-[9px] text-[#3a3a4a] ml-1">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>

        <div className="flex-1" />

        {/* Tools */}
        <div className="flex gap-0.5">
          {([
            { id: 'pointer' as PRTool, icon: <MousePointer2 size={11} />, label: 'Select' },
            { id: 'draw'    as PRTool, icon: <Pencil size={11} />,        label: 'Draw' },
            { id: 'erase'   as PRTool, icon: <Eraser size={11} />,        label: 'Erase' },
          ]).map(t => (
            <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
              className={cn('w-6 h-6 flex items-center justify-center rounded transition-colors',
                tool === t.id ? 'bg-[#6c63ff] text-white' : 'text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#1e1e2a]')}>
              {t.icon}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setZoom(z => Math.max(20, z * 0.75))} className="text-[#55557a] hover:text-[#e8e8f0]"><ChevronDown size={12}/></button>
          <span className="text-[10px] text-[#55557a] font-mono w-6 text-center">{Math.round(zoom)}</span>
          <button onClick={() => setZoom(z => Math.min(300, z * 1.33))} className="text-[#55557a] hover:text-[#e8e8f0]"><ChevronUp size={12}/></button>
        </div>

        <button onClick={() => openPianoRoll(null)}
          className="ml-2 w-6 h-6 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Roll + velocity */}
      <div className="flex flex-1 min-h-0 overflow-hidden" ref={containerRef} onWheel={handleWheel}>
        {/* Piano keys */}
        <div className="overflow-hidden shrink-0" style={{ width: KEY_WIDTH }}>
          <div style={{ transform: `translateY(-${scrollTop}px)` }}>
            <PianoKeys scrollTop={scrollTop} />
          </div>
        </div>

        {/* Note grid + velocity stacked */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Note area */}
          <div className="flex-1 relative overflow-hidden cursor-crosshair"
            onMouseDown={handleGridMouseDown}
          >
            <div style={{ transform: `translate(-${scrollX}px, -${scrollTop}px)`, width: gridWidth + scrollX, height: gridHeight }}>
              <GridCanvas zoom={zoom} scrollX={scrollX} width={gridWidth} height={gridHeight} numerator={numerator} />
              {/* Playhead */}
              <div className="absolute top-0 h-full w-px pointer-events-none z-20"
                style={{ left: (position - (clip.startBeat)) * zoom, background: 'rgba(255,60,60,0.7)' }} />
              {/* Notes */}
              {notes.map(n => (
                <NoteBlock key={n.id} note={n} zoom={zoom} color={color}
                  isSelected={n.id === selectedNoteId}
                  onMouseDown={handleNoteMouseDown} />
              ))}
            </div>
          </div>

          {/* Velocity editor */}
          <div className="shrink-0" style={{ overflowX: 'hidden' }}>
            <div style={{ transform: `translateX(-${scrollX}px)` }}>
              <VelocityEditor notes={notes} color={color} zoom={zoom}
                width={gridWidth} onVelocityChange={handleVelocityChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
