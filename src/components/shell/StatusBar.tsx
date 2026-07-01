import { useEffect, useState } from 'react';
import { useDAWStore } from '@/store/daw-store';
import { audioEngine } from '@/engine/audio-engine';
import { vstBridge, type BridgeStatus } from '@/services/vstBridge';
import { cn } from '@/utils/cn';
import { promptBridgeDownload } from '@/utils/bridge-download';

export function StatusBar() {
  const state = useDAWStore((s) => s.transport.state);
  const sampleRate = useDAWStore((s) => s.project.sampleRate);
  const bufferSize = useDAWStore((s) => s.project.bufferSize);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(vstBridge.currentStatus);

  useEffect(() => vstBridge.onStatusChange(setBridgeStatus), []);

  useEffect(() => {
    const update = () => {
      const ctx = audioEngine.audioContext;
      if (!ctx) {
        setLatencyMs(null);
        return;
      }
      const sec = (ctx.baseLatency ?? 0) + (ctx.outputLatency ?? 0);
      setLatencyMs(Math.round(sec * 1000 * 10) / 10);
    };
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  const stateLabel =
    state === 'playing' ? 'Playing' : state === 'recording' ? 'Recording' : state === 'paused' ? 'Paused' : 'Stopped';

  const bridgeLabel = {
    connected: 'TRAX Bridge: Running',
    connecting: 'TRAX Bridge: Connecting…',
    disconnected: 'TRAX Bridge: Not installed',
    error: 'TRAX Bridge: Not found',
  }[bridgeStatus];

  const bridgeColor = {
    connected: 'text-[#22c55e]',
    connecting: 'text-[#f59e0b]',
    disconnected: 'text-[#55557a]',
    error: 'text-[#ef4444]',
  }[bridgeStatus];

  return (
    <div className="flex items-center gap-4 px-3 py-1 bg-[#08080c] border-t border-[#1e1e2a] text-[10px] text-[#55557a] shrink-0 h-6 font-mono">
      <span className={cn(state === 'stopped' ? 'text-[#55557a]' : 'text-[#6c63ff]')}>{stateLabel}</span>
      <span>SR: {sampleRate} Hz</span>
      <span>Buffer: {bufferSize}</span>
      <span>Latency: {latencyMs !== null ? `~${latencyMs} ms` : '—'}</span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => bridgeStatus !== 'connected' && promptBridgeDownload()}
        className={cn(
          bridgeColor,
          bridgeStatus !== 'connected' && 'hover:underline cursor-pointer'
        )}
      >
        {bridgeLabel}
      </button>
      <span>MIDI: Web MIDI</span>
      <span>Audio: Web Audio</span>
    </div>
  );
}
