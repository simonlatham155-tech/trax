import { X, Power } from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { Knob } from '@/components/common/Knob';
import { cn } from '@/utils/cn';
import { TRACK_COLORS } from '@/types';
import type { TrackEffects } from '@/types';

interface SectionProps {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
}

function Section({ title, enabled, onToggle, children, color = '#6c63ff' }: SectionProps) {
  return (
    <div className={cn('rounded border', enabled ? 'border-[#2a2a38]' : 'border-[#1a1a24]')}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e2a]">
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded flex items-center justify-center transition-colors',
            enabled ? 'text-white' : 'text-[#55557a] hover:text-[#8888aa]'
          )}
          style={enabled ? { backgroundColor: color + '44', color } : undefined}
        >
          <Power size={10} />
        </button>
        <span className={cn('text-xs font-semibold uppercase tracking-wider', enabled ? 'text-[#e8e8f0]' : 'text-[#55557a]')}>
          {title}
        </span>
      </div>
      <div className={cn('px-3 py-3', !enabled && 'opacity-40 pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}

export function EffectsPanel() {
  const openEffectsTrackId = useDAWStore((s) => s.ui.openEffectsTrackId);
  const openEffects = useDAWStore((s) => s.openEffects);
  const updateEffects = useDAWStore((s) => s.updateEffects);

  const track = useDAWStore((s) =>
    s.tracks.find((t) => t.id === openEffectsTrackId)
  );

  if (!track) return null;

  const color = TRACK_COLORS[track.color];
  const fx = track.effects;

  const update = (patch: Partial<TrackEffects>) => {
    updateEffects(track.id, patch);
  };

  return (
    <div className="w-72 shrink-0 flex flex-col bg-[#111118] border-l border-[#2a2a38] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a38]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-[#e8e8f0] truncate">{track.name}</span>
          <span className="text-[10px] text-[#55557a]">Effects</span>
        </div>
        <button
          onClick={() => openEffects(null)}
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Effects */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {/* EQ */}
        <Section
          title="EQ"
          enabled={fx.eq.enabled}
          color={color}
          onToggle={() => update({ eq: { ...fx.eq, enabled: !fx.eq.enabled } })}
        >
          <div className="flex gap-3 flex-wrap">
            {fx.eq.bands.map((band) => (
              <div key={band.id} className="flex flex-col items-center gap-1">
                <Knob
                  value={band.gain}
                  min={-12}
                  max={12}
                  size={32}
                  color={color}
                  label={band.id.toUpperCase()}
                  valueLabel={`${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)} dB`}
                  onChange={(v) => {
                    const bands = fx.eq.bands.map((b) =>
                      b.id === band.id ? { ...b, gain: v } : b
                    );
                    update({ eq: { ...fx.eq, bands } });
                  }}
                />
                <span className="text-[9px] text-[#55557a] font-mono">
                  {band.freq >= 1000 ? `${band.freq / 1000}k` : `${band.freq}`}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Compressor */}
        <Section
          title="Compressor"
          enabled={fx.compressor.enabled}
          color={color}
          onToggle={() =>
            update({ compressor: { ...fx.compressor, enabled: !fx.compressor.enabled } })
          }
        >
          <div className="flex gap-3 flex-wrap">
            <Knob
              value={fx.compressor.threshold}
              min={-60}
              max={0}
              size={32}
              color={color}
              label="THR"
              valueLabel={`${fx.compressor.threshold} dB`}
              onChange={(v) => update({ compressor: { ...fx.compressor, threshold: v } })}
            />
            <Knob
              value={fx.compressor.ratio}
              min={1}
              max={20}
              size={32}
              color={color}
              label="RATIO"
              valueLabel={`${fx.compressor.ratio.toFixed(1)}:1`}
              onChange={(v) => update({ compressor: { ...fx.compressor, ratio: v } })}
            />
            <Knob
              value={fx.compressor.attack * 1000}
              min={0.1}
              max={200}
              size={32}
              color={color}
              label="ATK"
              valueLabel={`${(fx.compressor.attack * 1000).toFixed(1)} ms`}
              onChange={(v) => update({ compressor: { ...fx.compressor, attack: v / 1000 } })}
            />
            <Knob
              value={fx.compressor.release * 1000}
              min={10}
              max={2000}
              size={32}
              color={color}
              label="REL"
              valueLabel={`${Math.round(fx.compressor.release * 1000)} ms`}
              onChange={(v) => update({ compressor: { ...fx.compressor, release: v / 1000 } })}
            />
            <Knob
              value={fx.compressor.makeupGain}
              min={0}
              max={24}
              size={32}
              color={color}
              label="GAIN"
              valueLabel={`+${fx.compressor.makeupGain.toFixed(1)} dB`}
              onChange={(v) => update({ compressor: { ...fx.compressor, makeupGain: v } })}
            />
          </div>
        </Section>

        {/* Reverb */}
        <Section
          title="Reverb"
          enabled={fx.reverb.enabled}
          color={color}
          onToggle={() =>
            update({ reverb: { ...fx.reverb, enabled: !fx.reverb.enabled } })
          }
        >
          <div className="flex gap-3">
            <Knob
              value={fx.reverb.wet}
              min={0}
              max={1}
              size={32}
              color={color}
              label="WET"
              valueLabel={`${Math.round(fx.reverb.wet * 100)}%`}
              onChange={(v) => update({ reverb: { ...fx.reverb, wet: v } })}
            />
            <Knob
              value={fx.reverb.decay}
              min={0.1}
              max={10}
              size={32}
              color={color}
              label="DECAY"
              valueLabel={`${fx.reverb.decay.toFixed(1)}s`}
              onChange={(v) => update({ reverb: { ...fx.reverb, decay: v } })}
            />
            <Knob
              value={fx.reverb.preDelay * 1000}
              min={0}
              max={200}
              size={32}
              color={color}
              label="PRE"
              valueLabel={`${Math.round(fx.reverb.preDelay * 1000)} ms`}
              onChange={(v) => update({ reverb: { ...fx.reverb, preDelay: v / 1000 } })}
            />
          </div>
        </Section>

        {/* Delay */}
        <Section
          title="Delay"
          enabled={fx.delay.enabled}
          color={color}
          onToggle={() =>
            update({ delay: { ...fx.delay, enabled: !fx.delay.enabled } })
          }
        >
          <div className="flex gap-3">
            <Knob
              value={fx.delay.wet}
              min={0}
              max={1}
              size={32}
              color={color}
              label="WET"
              valueLabel={`${Math.round(fx.delay.wet * 100)}%`}
              onChange={(v) => update({ delay: { ...fx.delay, wet: v } })}
            />
            <Knob
              value={fx.delay.time}
              min={0.01}
              max={2}
              size={32}
              color={color}
              label="TIME"
              valueLabel={`${fx.delay.time.toFixed(2)}s`}
              onChange={(v) => update({ delay: { ...fx.delay, time: v } })}
            />
            <Knob
              value={fx.delay.feedback}
              min={0}
              max={0.95}
              size={32}
              color={color}
              label="FDBK"
              valueLabel={`${Math.round(fx.delay.feedback * 100)}%`}
              onChange={(v) => update({ delay: { ...fx.delay, feedback: v } })}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
