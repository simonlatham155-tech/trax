import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useDAWStore } from '@/store/daw-store';
import { TRACK_COLORS } from '@/types';
import { Knob } from '@/components/common/Knob';
import { VuMeter } from '@/components/common/VuMeter';
import { audioEngine } from '@/engine/audio-engine';
import { cn } from '@/utils/cn';

function ChannelStrip({ trackId }: { trackId: string }) {
  const track = useDAWStore((s) => s.tracks.find((t) => t.id === trackId));
  const selectedTrackId = useDAWStore((s) => s.ui.selectedTrackId);
  const setTrackVolume = useDAWStore((s) => s.setTrackVolume);
  const setTrackPan = useDAWStore((s) => s.setTrackPan);
  const toggleMute = useDAWStore((s) => s.toggleMute);
  const toggleSolo = useDAWStore((s) => s.toggleSolo);
  const selectTrack = useDAWStore((s) => s.selectTrack);

  useEffect(() => {
    audioEngine.init();
  }, []);

  if (!track) return null;

  const color = TRACK_COLORS[track.color];
  const isSelected = track.id === selectedTrackId;
  const faderDb = 20 * Math.log10(track.volume + 1e-6);
  const analyser = audioEngine.getTrackAnalyser(track.id);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 px-2 py-3 rounded border cursor-pointer min-w-[72px] transition-colors',
        isSelected ? 'bg-[#1a1a24] border-[#3a3a50]' : 'bg-[#111118] border-[#1e1e2a] hover:bg-[#161620]'
      )}
      onClick={() => selectTrack(track.id)}
    >
      {/* Color bar */}
      <div
        className="w-full h-1 rounded-full"
        style={{ backgroundColor: color }}
      />

      {/* Pan knob */}
      <Knob
        value={track.pan}
        min={-1}
        max={1}
        size={32}
        color={color}
        label="PAN"
        valueLabel={track.pan === 0 ? 'C' : track.pan > 0 ? `R${Math.round(track.pan * 100)}` : `L${Math.round(-track.pan * 100)}`}
        onChange={(v) => setTrackPan(track.id, v)}
      />

      {/* VU meter + Fader */}
      <div className="flex-1 flex items-center gap-1.5 py-1">
        <VuMeter analyser={analyser} width={6} height={90} />
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.005}
          value={track.volume}
          onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: 90,
            width: 4,
          } as React.CSSProperties}
          title={`${Math.round(faderDb)} dB`}
        />
      </div>

      {/* Level in dB */}
      <span className="text-[9px] font-mono text-[#55557a]">
        {faderDb > -60 ? `${Math.round(faderDb > 0 ? faderDb : faderDb)} dB` : '-∞'}
      </span>

      {/* Mute / Solo */}
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(track.id);
          }}
          className={cn(
            'w-5 h-5 rounded text-[9px] font-bold transition-colors',
            track.muted
              ? 'bg-[#f59e0b33] text-[#f59e0b]'
              : 'bg-[#1e1e2a] text-[#55557a] hover:text-[#8888aa]'
          )}
        >
          M
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSolo(track.id);
          }}
          className={cn(
            'w-5 h-5 rounded text-[9px] font-bold transition-colors',
            track.soloed
              ? 'bg-[#22c55e33] text-[#22c55e]'
              : 'bg-[#1e1e2a] text-[#55557a] hover:text-[#8888aa]'
          )}
        >
          S
        </button>
      </div>

      {/* Track name */}
      <span
        className="text-[9px] text-[#8888aa] truncate max-w-[56px] text-center"
        title={track.name}
      >
        {track.name}
      </span>
    </div>
  );
}

function MasterStrip() {
  const masterVolume = useDAWStore((s) => s.masterVolume);
  const setMasterVolume = useDAWStore((s) => s.setMasterVolume);
  const masterDb = 20 * Math.log10(masterVolume + 1e-6);
  const analyser = audioEngine.getMasterAnalyser();

  return (
    <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded border bg-[#1a1a24] border-[#3a3a50] min-w-[72px]">
      <div className="w-full h-1 rounded-full bg-[#6c63ff]" />
      <Knob
        value={0}
        min={-1}
        max={1}
        size={32}
        color="#6c63ff"
        label="PAN"
        onChange={() => {}}
      />
      <div className="flex-1 flex items-center gap-1.5 py-1">
        <VuMeter analyser={analyser} width={6} height={90} />
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.005}
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: 90,
            width: 4,
          } as React.CSSProperties}
          title={`${Math.round(masterDb)} dB`}
        />
      </div>
      <span className="text-[9px] font-mono text-[#55557a]">
        {masterDb > -60 ? `${Math.round(masterDb)} dB` : '-∞'}
      </span>
      <div className="flex gap-1">
        <div className="w-5 h-5 rounded bg-[#1e1e2a]" />
        <div className="w-5 h-5 rounded bg-[#1e1e2a]" />
      </div>
      <span className="text-[9px] text-[#8888aa] font-semibold">MASTER</span>
    </div>
  );
}

export function Mixer() {
  const tracks = useDAWStore((s) => s.tracks);
  const toggleMixer = useDAWStore((s) => s.toggleMixer);

  useEffect(() => {
    audioEngine.init();
  }, []);

  return (
    <div className="h-64 border-t border-[#2a2a38] bg-[#0a0a0f] flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a38]">
        <span className="text-[11px] font-semibold text-[#8888aa] uppercase tracking-wider">
          Mixer
        </span>
        <button
          onClick={toggleMixer}
          className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Channel strips */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-1.5 px-3 py-2 h-full">
          {tracks.map((track) => (
            <ChannelStrip key={track.id} trackId={track.id} />
          ))}
          <div className="w-px bg-[#2a2a38] mx-1 self-stretch" />
          <MasterStrip />
        </div>
      </div>
    </div>
  );
}
