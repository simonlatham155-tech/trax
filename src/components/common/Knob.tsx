import { useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  color?: string;
  label?: string;
  valueLabel?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Knob({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  size = 36,
  color = '#6c63ff',
  label,
  valueLabel,
  onChange,
  className,
}: KnobProps) {
  const startRef = useRef<{ y: number; value: number } | null>(null);

  const normalized = (value - min) / (max - min);
  const angle = -135 + normalized * 270;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startRef.current = { y: e.clientY, value };

      const handleMove = (e: MouseEvent) => {
        if (!startRef.current) return;
        const delta = (startRef.current.y - e.clientY) / 150;
        const newValue = Math.max(
          min,
          Math.min(max, startRef.current.value + delta * (max - min))
        );
        const snapped = Math.round(newValue / step) * step;
        onChange(Math.round(snapped * 1000) / 1000);
      };

      const handleUp = () => {
        startRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [value, min, max, step, onChange]
  );

  const handleDoubleClick = useCallback(() => {
    const def = (min + max) / 2;
    onChange(def);
  }, [min, max, onChange]);

  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const rad = (angle * Math.PI) / 180;
  const thumbX = cx + r * Math.sin(rad);
  const thumbY = cy - r * Math.cos(rad);

  const arcPath = (() => {
    const startAngle = -135;
    const endAngle = angle;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = normalized > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  })();

  return (
    <div
      className={cn('flex flex-col items-center gap-0.5 select-none', className)}
      title={valueLabel ?? String(value)}
    >
      <svg
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="cursor-ns-resize"
      >
        {/* Track arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2a2a38"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${(270 / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={0}
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Value arc */}
        {normalized > 0 && (
          <path d={arcPath} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        )}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="#3a3a50" />
        {/* Thumb */}
        <circle cx={thumbX} cy={thumbY} r={2.5} fill={color} />
      </svg>
      {label && (
        <span className="text-[10px] text-[#55557a] font-medium uppercase tracking-wider leading-none">
          {label}
        </span>
      )}
    </div>
  );
}
