import { cn } from '@/utils/cn';

const iconUrl = `${import.meta.env.BASE_URL}bridge-icon.svg`;

interface BridgeAppIconProps {
  size?: number;
  className?: string;
  connected?: boolean;
}

export function BridgeAppIcon({ size = 40, className, connected = true }: BridgeAppIconProps) {
  const dotSize = Math.max(6, Math.round(size * 0.22));

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-xl w-full h-full"
        draggable={false}
      />
      <span
        className={cn(
          'absolute rounded-full border-2 border-[#111118]',
          connected ? 'bg-[#22c55e]' : 'bg-[#55557a]'
        )}
        style={{
          width: dotSize,
          height: dotSize,
          top: -dotSize * 0.15,
          right: -dotSize * 0.15,
        }}
      />
    </div>
  );
}
