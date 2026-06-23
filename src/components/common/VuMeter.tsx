import { useEffect, useRef } from 'react';

interface VuMeterProps {
  analyser?: AnalyserNode | null;
  width?: number;
  height?: number;
  vertical?: boolean;
}

export function VuMeter({ analyser, width = 8, height = 60, vertical = true }: VuMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const peakDecayRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Float32Array(analyser.fftSize);

    const draw = () => {
      analyser.getFloatTimeDomainData(dataArray);
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);

      const db = 20 * Math.log10(rms + 1e-10);
      const normalized = Math.max(0, Math.min(1, (db + 60) / 60));

      if (normalized > peakRef.current) {
        peakRef.current = normalized;
        peakDecayRef.current = 0;
      } else {
        peakDecayRef.current += 0.001;
        peakRef.current = Math.max(0, peakRef.current - peakDecayRef.current);
      }

      ctx.clearRect(0, 0, width, height);

      if (vertical) {
        const fillHeight = normalized * height;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(0.7, '#f59e0b');
        gradient.addColorStop(0.9, '#ef4444');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - fillHeight, width, fillHeight);

        const peakY = height - peakRef.current * height;
        ctx.fillStyle = peakRef.current > 0.9 ? '#ef4444' : '#ffffff';
        ctx.fillRect(0, peakY, width, 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, width, height, vertical]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
      className="rounded-sm"
    />
  );
}
