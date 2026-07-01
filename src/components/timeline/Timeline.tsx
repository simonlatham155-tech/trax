import React, { useCallback, useEffect, useRef } from 'react';
import { useDAWStore } from '@/store/daw-store';
import { cn } from '@/utils/cn';
import { snapToGrid } from '@/utils/beats';
import { beginGesture, endGesture } from '@/store/history';
import { ClipWaveform } from '@/components/timeline/ClipWaveform';

const RULER_HEIGHT = 28;

interface TimelineRulerProps {
  zoom: number;
  scrollX: number;
  width: number;
  bpm: number;
  numerator: number;
  position: number;
  onSeek: (beat: number) => void;
}

function TimelineRuler({
  zoom,
  scrollX,
  width,
  numerator,
  position,
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

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    const startBeat = scrollX / zoom;
    const endBeat = startBeat + width / zoom;
    const beatsPerBar = numerator;

    ctx.font = '10px system-ui';
    ctx.fillStyle = '#55557a';

    const firstBar = Math.floor(startBeat / beatsPerBar);
    const lastBar = Math.ceil(endBeat / beatsPerBar);

    for (let bar = firstBar; bar <= lastBar; bar++) {
      const beat = bar * beatsPerBar;
      const x = (beat - startBeat) * zoom;

      ctx.strokeStyle = '#2a2a38';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT);
      ctx.lineTo(x, 0);
      ctx.stroke();

      ctx.fillStyle = '#8888aa';
      ctx.fillText(String(bar + 1), x + 3, 14);

      if (zoom > 40) {
        for (let b = 1; b < beatsPerBar; b++) {
          const bx = x + b * zoom;
          ctx.strokeStyle = '#1e1e2a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx, RULER_HEIGHT);
          ctx.lineTo(bx, RULER_HEIGHT * 0.5);
          ctx.stroke();
        }
      }
    }

    const playheadX = (position - startBeat) * zoom;
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, RULER_HEIGHT);
    ctx.stroke();

    ctx.fillStyle = '#6c63ff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
  }, [zoom, scrollX, width, numerator, position]);

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
      className="cursor-pointer"
      style={{ height: RULER_HEIGHT, width }}
    />
  );
}

interface ClipViewProps {
  clip: {
    id: string;
    name: string;
    startBeat: number;
    durationBeats: number;
    gain: number;
    color: string;
    audioBuffer?: AudioBuffer;
  };
  zoom: number;
  scrollX: number;
  trackHeight: number;
  isSelected: boolean;
  snapEnabled: boolean;
  snapGrid: number;
  onSelect: (id: string) => void;
  onMove: (id: string, beat: number, isFinal: boolean) => void;
}

function ClipView({
  clip,
  zoom,
  scrollX,
  trackHeight,
  isSelected,
  snapEnabled,
  snapGrid,
  onSelect,
  onMove,
}: ClipViewProps) {
  const dragRef = useRef<{ startX: number; startBeat: number; dragging: boolean } | null>(null);

  const x = clip.startBeat * zoom - scrollX;
  const clipWidth = Math.max(8, clip.durationBeats * zoom);
  const clipBodyHeight = trackHeight - 8;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
    dragRef.current = { startX: e.clientX, startBeat: clip.startBeat, dragging: false };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      if (!dragRef.current.dragging && Math.abs(dx) > 2) {
        dragRef.current.dragging = true;
        beginGesture();
      }
      const beat = dragRef.current.startBeat + dx / zoom;
      onMove(clip.id, beat, false);
    };

    const handleUp = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      if (dragRef.current.dragging) {
        const beat = dragRef.current.startBeat + dx / zoom;
        onMove(clip.id, beat, true);
        endGesture();
      }
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  if (x + clipWidth < 0 || x > 2000) return null;

  return (
    <div
      className={cn(
        'absolute top-1 rounded overflow-hidden cursor-grab active:cursor-grabbing select-none border',
        isSelected ? 'border-white/60' : 'border-transparent'
      )}
      style={{
        left: x,
        width: clipWidth,
        height: clipBodyHeight,
        backgroundColor: `${clip.color}22`,
        borderColor: isSelected ? clip.color : 'transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="w-full h-1 relative z-10"
        style={{ backgroundColor: clip.color }}
      />
      <ClipWaveform
        audioBuffer={clip.audioBuffer}
        width={clipWidth}
        height={clipBodyHeight - 18}
        color={clip.color}
      />
      <span
        className="relative z-10 px-1.5 pt-0.5 text-[10px] font-medium truncate block"
        style={{ color: clip.color }}
      >
        {clip.name}
      </span>
    </div>
  );
}

export function Timeline() {
  const tracks = useDAWStore((s) => s.tracks);
  const zoom = useDAWStore((s) => s.ui.zoom);
  const scrollX = useDAWStore((s) => s.ui.scrollX);
  const scrollY = useDAWStore((s) => s.ui.scrollY);
  const position = useDAWStore((s) => s.transport.position);
  const selectedClipId = useDAWStore((s) => s.ui.selectedClipId);
  const bpm = useDAWStore((s) => s.project.bpm);
  const numerator = useDAWStore((s) => s.project.timeSignature.numerator);

  const snapEnabled = useDAWStore((s) => s.ui.snapEnabled);
  const snapGrid = useDAWStore((s) => s.ui.snapGrid);

  const setPosition = useDAWStore((s) => s.setPosition);
  const selectClip = useDAWStore((s) => s.selectClip);
  const updateClipSilent = useDAWStore((s) => s.updateClipSilent);
  const updateClip = useDAWStore((s) => s.updateClip);
  const setScroll = useDAWStore((s) => s.setScroll);
  const setZoom = useDAWStore((s) => s.setZoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(800);

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
    (clipId: string, beat: number, isFinal: boolean) => {
      const track = tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (!track) return;
      let newStart = Math.max(0, beat);
      if (isFinal && snapEnabled) {
        newStart = snapToGrid(newStart, snapGrid);
      }
      if (isFinal) {
        updateClip(track.id, clipId, { startBeat: newStart });
      } else {
        updateClipSilent(track.id, clipId, { startBeat: newStart });
      }
    },
    [tracks, snapEnabled, snapGrid, updateClip, updateClipSilent]
  );

  const loopStart = useDAWStore((s) => s.transport.loopStart);
  const loopEnd = useDAWStore((s) => s.transport.loopEnd);
  const loopEnabled = useDAWStore((s) => s.transport.loopEnabled);

  const startBeat = scrollX / zoom;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-[#0a0a0f]"
      onWheel={handleWheel}
    >
      {/* Ruler */}
      <div className="sticky top-0 z-10 bg-[#0f0f1a] border-b border-[#2a2a38]">
        <TimelineRuler
          zoom={zoom}
          scrollX={scrollX}
          width={width}
          bpm={bpm}
          numerator={numerator}
          position={position}
          onSeek={setPosition}
        />
      </div>

      {/* Track lanes */}
      <div
        className="relative"
        style={{ transform: `translateY(-${scrollY % 1}px)` }}
      >
        {tracks.map((track) => {
          const { color: trackColor } = track;
          const colorHex =
            {
              purple: '#6c63ff',
              cyan: '#06b6d4',
              green: '#22c55e',
              amber: '#f59e0b',
              red: '#ef4444',
              pink: '#ec4899',
              blue: '#3b82f6',
            }[trackColor] || '#6c63ff';

          return (
            <div
              key={track.id}
              className="relative border-b border-[#1e1e2a] overflow-hidden"
              style={{ height: track.height }}
            >
              {/* Grid lines */}
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
                  className="absolute top-0 h-full bg-[#6c63ff]/10 border-l border-r border-[#6c63ff]/40"
                  style={{
                    left: loopStart * zoom - scrollX,
                    width: (loopEnd - loopStart) * zoom,
                  }}
                />
              )}

              {/* Clips */}
              {track.clips.map((clip) => (
                <ClipView
                  key={clip.id}
                  clip={{ ...clip, color: colorHex }}
                  zoom={zoom}
                  scrollX={scrollX}
                  trackHeight={track.height}
                  isSelected={clip.id === selectedClipId}
                  snapEnabled={snapEnabled}
                  snapGrid={snapGrid}
                  onSelect={selectClip}
                  onMove={handleClipMove}
                />
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-px bg-[#6c63ff]/70 pointer-events-none z-10"
                style={{ left: (position - startBeat) * zoom }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
            className="absolute top-0 w-px h-full bg-[#1e1e2a]"
            style={{ left: x }}
          />
        );
      })}
      {zoom > 40 &&
        Array.from({ length: (lastBar - firstBar + 1) * numerator }, (_, i) => {
          const beat = firstBar * numerator + i;
          if (beat % numerator === 0) return null;
          const x = beat * zoom - scrollX;
          return (
            <div
              key={`beat-${beat}`}
              className="absolute top-0 w-px h-full bg-[#161620]"
              style={{ left: x }}
            />
          );
        })}
    </>
  );
}

