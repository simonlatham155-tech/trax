import { useCallback, useEffect, useRef } from 'react';

interface ClipWaveformProps {
  audioBuffer?: AudioBuffer;
  width: number;
  height: number;
  color: string;
}

export function ClipWaveform({ audioBuffer, width, height, color }: ClipWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (!audioBuffer || w < 2) return;

    const data = audioBuffer.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / w));
    const mid = h / 2;

    ctx.fillStyle = color + '99';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x++) {
      const start = x * step;
      let min = 0;
      let max = 0;
      for (let i = start; i < start + step && i < data.length; i++) {
        const v = data[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const top = mid - max * mid * 0.9;
      const bottom = mid - min * mid * 0.9;
      ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
    }
  }, [audioBuffer, width, height, color]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-80"
      style={{ width, height }}
    />
  );
}
