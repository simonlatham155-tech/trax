import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDAWStore } from '@/store/daw-store';
import { cn } from '@/utils/cn';
import type { Clip } from '@/types';

const RULER_HEIGHT = 28;

// ─── Ruler ───────────────────────────────────────────────────────────────────

interface TimelineRulerProps {
  zoom: number;
  scrollX: number;
  width: number;
  bpm: number;
  numerator: number;
  position: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  onSeek: (beat: number) => void;
}

function TimelineRuler({
  zoom,
  scrollX,
  width,
  numerator,
  position,
  loopEnabled,
  loopStart,
  loopEnd,
  onSeek,
}: TimelineRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = RULER_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    const startBeat = scrollX / zoom;
    const endBeat = startBeat + width / zoom;
    const beatsPerBar = numerator;
    const firstBar = Math.floor(startBeat / beatsPerBar);
    const lastBar = Math.ceil(endBeat / beatsPerBar);

    // Loop region tint
    if (loopEnabled) {
      const lx = loopStart * zoom - scrollX;
      const lw = (loopEnd - loopStart) * zoom;
      ctx.fillStyle = 'rgba(108,99,255,0.12)';
      ctx.fillRect(lx, 0, lw, RULER_HEIGHT);
    }

    ctx.font = '10px system-ui';

    for (let bar = firstBar; bar <= lastBar; bar++) {
      const beat = bar * beatsPerBar;
      const x = (beat - startBeat) * zoom;

      // Bar line
      ctx.strokeStyle = '#2a2a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT);
      ctx.lineTo(x, 0);
      ctx.stroke();

      // Bar number
      ctx.fillStyle = '#9090b8';
      ctx.fillText(String(bar + 1), x + 4, 16);

      // Beat sub-ticks
      if (zoom > 30) {
        for (let b = 1; b < beatsPerBar; b++) {
          const bx = x + b * zoom;
          ctx.strokeStyle = '#1e1e2a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx, RULER_HEIGHT);
          ctx.lineTo(bx, RULER_HEIGHT * 0.45);
          ctx.stroke();
        }
      }
    }

    // Playhead line
    const playheadX = (position - startBeat) * zoom;
    ctx.strokeStyle = '#ff3c3c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, RULER_HEIGHT);
    ctx.stroke();

    // Playhead triangle
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 9);
    ctx.closePath();
    ctx.fill();
  }, [zoom, scrollX, width, numerator, position, loopEnabled, loopStart, loopEnd]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const beat = scrollX / zoom + x / zoom;
      onSeek(Math.max(0, beat));
    },
    [scrollX, zoom, onSeek]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={RULER_HEIGHT}
      onClick={handleClick}
      className="cursor-pointer block"
      style={{ height: RULER_HEIGHT, width }}
    />
  );
}

// ─── Waveform canvas ─────────────────────────────────────────────────────────

function WaveformCanvas({
  audioBuffer,
  color,
  width,
  height,
}: {
  audioBuffer: AudioBuffer;
  color: string;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const mid = height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      let min = 1,
        max = -1;
      const start = x * step;
      for (let s = 0; s < step && start + s < data.length; s++) {
        const v = data[start + s];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const yMin = mid + min * mid * 0.9;
      const yMax = mid + max * mid * 0.9;
      if (x === 0) ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
      ctx.lineTo(x, yMin);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [audioBuffer, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: 'block' }}
    />
  );
}

// ─── Clip view ────────────────────────────────────────────────────────────────

interface ClipViewProps {
  clip: Clip;
  color: string;
  zoom: number;
  scrollX: number;
  trackHeight: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number) => void;
}

function ClipView({
  clip,
  color,
  zoom,
  scrollX,
  trackHeight,
  isSelected,
  onSelect,
  onMove,
}: ClipViewProps) {
  const dragRef = useRef<{ startX: number; startBeat: number } | null>(null);

  const x = clip.startBeat * zoom - scrollX;
  const clipWidth = Math.max(8, clip.durationBeats * zoom);
  const clipHeight = trackHeight - 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
    dragRef.current = { startX: e.clientX, startBeat: clip.startBeat };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      onMove(clip.id, dx);
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Cull off-screen clips
  if (x + clipWidth < 0 || x > 4000) return null;

  // Hex → rgb for rgba usage
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const waveformHeight = Math.max(0, clipHeight - 20);
  const waveformWidth = Math.floor(clipWidth - 4);

  return (
    <div
      className={cn(
        'absolute top-0 overflow-hidden cursor-grab active:cursor-grabbing select-none',
        'transition-[border-color] duration-75'
      )}
      style={{
        left: x,
        width: clipWidth,
        height: clipHeight,
        background: `linear-gradient(180deg, rgba(${r},${g},${b},0.35) 0%, rgba(${r},${g},${b},0.18) 100%)`,
        borderLeft: `3px solid ${color}`,
        borderTop: isSelected ? `1.5px solid ${color}` : `1.5px solid rgba(${r},${g},${b},0.4)`,
        borderRight: isSelected ? `1.5px solid rgba(${r},${g},${b},0.6)` : 'none',
        borderBottom: isSelected ? `1.5px solid rgba(${r},${g},${b},0.6)` : 'none',
        boxShadow: isSelected ? `inset 0 0 0 1px rgba(255,255,255,0.08)` : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Clip name */}
      <span
        className="absolute top-1 left-2 text-[10px] font-semibold text-white/90 truncate pointer-events-none z-10 leading-none"
        style={{ maxWidth: clipWidth - 10 }}
      >
        {clip.name}
      </span>

      {/* Waveform / content area */}
      {clip.audioBuffer && waveformWidth > 4 && waveformHeight > 4 && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: waveformHeight }}
        >
          <WaveformCanvas
            audioBuffer={clip.audioBuffer}
            color={`rgba(${r},${g},${b},0.9)`}
            width={waveformWidth}
            height={waveformHeight}
          />
        </div>
      )}

      {/* Placeholder bars for clips without audio (MIDI-style pattern) */}
      {!clip.audioBuffer && clipWidth > 12 && waveformHeight > 4 && (
        <MidiPattern color={color} width={clipWidth} height={waveformHeight} />
      )}
    </div>
  );
}

// Decorative MIDI-style note bars for clips without audio
function MidiPattern({
  color,
  width,
  height,
}: {
  color: string;
  width: number;
  height: number;
}) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Deterministic pseudo-random bars seeded by color
  const seed = r * 1000 + g * 100 + b;
  const bars: { x: number; y: number; w: number }[] = [];
  let rng = seed;
  const next = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  const cols = Math.floor(width / 8);
  const rows = Math.floor(height / 4);
  for (let i = 0; i < Math.min(20, cols * 2); i++) {
    bars.push({
      x: Math.floor(next() * (width - 12)) + 4,
      y: Math.floor(next() * (rows - 1)) * 4,
      w: Math.floor(next() * 16) + 8,
    });
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
      style={{ height }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: bar.x,
            bottom: bar.y + 2,
            width: Math.min(bar.w, width - bar.x - 4),
            height: 3,
            backgroundColor: `rgba(${r},${g},${b},0.7)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Grid lines ───────────────────────────────────────────────────────────────

function GridLines({
  zoom,
  scrollX,
  width,
  numerator,
  height,
}: {
  zoom: number;
  scrollX: number;
  width: number;
  numerator: number;
  height: number;
}) {
  const startBeat = scrollX / zoom;
  const endBeat = startBeat + width / zoom;
  const firstBar = Math.floor(startBeat / numerator);
  const lastBar = Math.ceil(endBeat / numerator);

  return (
    <>
      {Array.from({ length: lastBar - firstBar + 1 }, (_, i) => {
        const bar = firstBar + i;
        const beat = bar * numerator;
        const x = beat * zoom - scrollX;
        return (
          <div
            key={bar}
            className="absolute top-0 w-px h-full"
            style={{ left: x, backgroundColor: '#1e1e2c' }}
          />
        );
      })}
      {zoom > 30 &&
        Array.from({ length: (lastBar - firstBar + 1) * numerator }, (_, i) => {
          const beat = firstBar * numerator + i;
          if (beat % numerator === 0) return null;
          const x = beat * zoom - scrollX;
          return (
            <div
              key={`b-${beat}`}
              className="absolute top-0 w-px h-full"
              style={{ left: x, backgroundColor: '#161620' }}
            />
          );
        })}
    </>
  );
}

// ─── Main Timeline ────────────────────────────────────────────────────────────

export function Timeline() {
  const tracks = useDAWStore((s) => s.tracks);
  const zoom = useDAWStore((s) => s.ui.zoom);
  const scrollX = useDAWStore((s) => s.ui.scrollX);
  const scrollY = useDAWStore((s) => s.ui.scrollY);
  const position = useDAWStore((s) => s.transport.position);
  const selectedClipId = useDAWStore((s) => s.ui.selectedClipId);
  const bpm = useDAWStore((s) => s.project.bpm);
  const numerator = useDAWStore((s) => s.project.timeSignature.numerator);
  const loopStart = useDAWStore((s) => s.transport.loopStart);
  const loopEnd = useDAWStore((s) => s.transport.loopEnd);
  const loopEnabled = useDAWStore((s) => s.transport.loopEnabled);

  const setPosition = useDAWStore((s) => s.setPosition);
  const selectClip = useDAWStore((s) => s.selectClip);
  const updateClip = useDAWStore((s) => s.updateClip);
  const setScroll = useDAWStore((s) => s.setScroll);
  const setZoom = useDAWStore((s) => s.setZoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * factor);
      } else if (e.shiftKey) {
        setScroll(scrollX + e.deltaY * 2, scrollY);
      } else {
        setScroll(scrollX + e.deltaX * 2, scrollY + e.deltaY);
      }
    },
    [zoom, scrollX, scrollY, setZoom, setScroll]
  );

  const handleClipMove = useCallback(
    (clipId: string, dx: number) => {
      const track = tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (!track) return;
      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return;
      const deltaBeat = dx / zoom;
      const newStart = Math.max(0, clip.startBeat + deltaBeat);
      updateClip(track.id, clipId, { startBeat: newStart });
    },
    [tracks, zoom, updateClip]
  );

  const startBeat = scrollX / zoom;

  const COLOR_MAP: Record<string, string> = {
    purple: '#6c63ff',
    cyan: '#06b6d4',
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    blue: '#3b82f6',
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-[#0a0a10]"
      onWheel={handleWheel}
    >
      {/* Ruler */}
      <div className="sticky top-0 z-10 bg-[#0a0a12] border-b border-[#1e1e2a]">
        <TimelineRuler
          zoom={zoom}
          scrollX={scrollX}
          width={width}
          bpm={bpm}
          numerator={numerator}
          position={position}
          loopEnabled={loopEnabled}
          loopStart={loopStart}
          loopEnd={loopEnd}
          onSeek={setPosition}
        />
      </div>

      {/* Track lanes */}
      <div
        className="relative"
        style={{ transform: `translateY(-${scrollY % 1}px)` }}
      >
        {tracks.map((track) => {
          const colorHex = COLOR_MAP[track.color] || '#6c63ff';

          return (
            <div
              key={track.id}
              className="relative border-b border-[#1a1a24] overflow-hidden"
              style={{ height: track.height, background: '#0c0c14' }}
            >
              {/* Grid */}
              <GridLines
                zoom={zoom}
                scrollX={scrollX}
                width={width}
                numerator={numerator}
                height={track.height}
              />

              {/* Loop region */}
              {loopEnabled && (
                <div
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    left: loopStart * zoom - scrollX,
                    width: (loopEnd - loopStart) * zoom,
                    background: 'rgba(108,99,255,0.07)',
                    borderLeft: '1px solid rgba(108,99,255,0.3)',
                    borderRight: '1px solid rgba(108,99,255,0.3)',
                  }}
                />
              )}

              {/* Clips */}
              {track.clips.map((clip) => (
                <ClipView
                  key={clip.id}
                  clip={clip}
                  color={colorHex}
                  zoom={zoom}
                  scrollX={scrollX}
                  trackHeight={track.height}
                  isSelected={clip.id === selectedClipId}
                  onSelect={selectClip}
                  onMove={handleClipMove}
                />
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-px pointer-events-none z-20"
                style={{
                  left: (position - startBeat) * zoom,
                  background: 'rgba(255,60,60,0.7)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
