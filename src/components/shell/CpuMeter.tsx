import { useEffect, useRef, useState } from 'react';

/** Lightweight UI CPU estimate from frame timing (not true audio-thread CPU). */
export function CpuMeter() {
  const [cpu, setCpu] = useState(12);
  const lastRef = useRef(performance.now());
  const loadRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const delta = now - lastRef.current;
      lastRef.current = now;
      const frameLoad = Math.min(100, Math.max(0, ((delta - 16.67) / 16.67) * 100));
      loadRef.current = loadRef.current * 0.9 + frameLoad * 0.1;
      setCpu(Math.round(8 + loadRef.current * 0.4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = cpu > 70 ? '#ef4444' : cpu > 45 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex items-center gap-1.5" title="UI load estimate">
      <span className="text-[9px] text-[#55557a] uppercase">CPU</span>
      <div className="w-12 h-1.5 bg-[#1a1a24] rounded overflow-hidden">
        <div className="h-full transition-all duration-300" style={{ width: `${cpu}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] font-mono text-[#8888aa] w-7">{cpu}%</span>
    </div>
  );
}
