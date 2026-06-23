import { useDAWStore } from '@/store/daw-store';
import { beatsToSeconds } from '@/utils/beats';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private scheduledSources: Map<string, AudioBufferSourceNode[]> = new Map();
  private animationFrame: number | null = null;
  private startTime = 0;
  private startBeat = 0;
  private metronomeWorker: ReturnType<typeof setInterval> | null = null;
  private metronomeSounds: { click: AudioBuffer | null; accent: AudioBuffer | null } = {
    click: null,
    accent: null,
  };

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext({ sampleRate: 44100, latencyHint: 'interactive' });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -3;
    this.masterCompressor.knee.value = 6;
    this.masterCompressor.ratio.value = 4;
    this.masterCompressor.attack.value = 0.005;
    this.masterCompressor.release.value = 0.1;

    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.ctx.destination);

    await this.createMetronomeSounds();
  }

  private async createMetronomeSounds(): Promise<void> {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    const makeClick = (freq: number, duration: number): AudioBuffer => {
      const buf = this.ctx!.createBuffer(1, Math.floor(sr * duration), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const env = Math.exp(-t * 80);
        data[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.5;
      }
      return buf;
    };

    this.metronomeSounds.accent = makeClick(1200, 0.05);
    this.metronomeSounds.click = makeClick(900, 0.04);
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private get bpm(): number {
    return useDAWStore.getState().project.bpm;
  }

  private get timeSignature() {
    return useDAWStore.getState().project.timeSignature;
  }

  startPlayback(fromBeat: number): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopPlayback();

    this.startBeat = fromBeat;
    this.startTime = this.ctx.currentTime;

    this.scheduleAllClips(fromBeat);
    this.startPositionTracking();

    const state = useDAWStore.getState();
    if (state.transport.metronomeEnabled) {
      this.startMetronome(fromBeat);
    }
  }

  private scheduleAllClips(fromBeat: number): void {
    const state = useDAWStore.getState();
    const { tracks, project } = state;
    const hasSoloed = tracks.some((t) => t.soloed);

    for (const track of tracks) {
      if (track.muted || (hasSoloed && !track.soloed)) continue;

      const sources: AudioBufferSourceNode[] = [];
      for (const clip of track.clips) {
        if (!clip.audioBuffer) continue;
        const clipEndBeat = clip.startBeat + clip.durationBeats;
        if (clipEndBeat <= fromBeat) continue;

        const source = this.scheduleClip(
          { ...clip, audioBuffer: clip.audioBuffer },
          track,
          fromBeat,
          project.bpm
        );
        if (source) sources.push(source);
      }
      this.scheduledSources.set(track.id, sources);
    }
  }

  private scheduleClip(
    clip: { startBeat: number; durationBeats: number; audioBuffer: AudioBuffer; gain: number },
    track: { volume: number; pan: number },
    fromBeat: number,
    bpm: number
  ): AudioBufferSourceNode | null {
    if (!this.ctx || !this.masterGain) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = clip.audioBuffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = clip.gain * track.volume;

    const panNode = this.ctx.createStereoPanner();
    panNode.pan.value = track.pan;

    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.masterGain);

    const clipStartSeconds = beatsToSeconds(clip.startBeat, bpm);
    const playheadSeconds = beatsToSeconds(fromBeat, bpm);

    let when = this.startTime;
    let offset = 0;

    if (clip.startBeat < fromBeat) {
      offset = playheadSeconds - clipStartSeconds;
    } else {
      when = this.startTime + (clipStartSeconds - playheadSeconds);
    }

    const duration = beatsToSeconds(clip.durationBeats, bpm) - offset;
    if (duration <= 0) return null;

    source.start(when, offset, duration);
    return source;
  }

  private startMetronome(fromBeat: number): void {
    if (!this.ctx) return;
    const { numerator } = this.timeSignature;
    const beatDuration = 60 / this.bpm;
    const startFractional = Math.ceil(fromBeat);
    let beatIndex = startFractional;

    const schedule = (): void => {
      if (!this.ctx || !this.metronomeSounds.click) return;
      const now = this.ctx.currentTime;
      const beatTime =
        this.startTime + beatsToSeconds(beatIndex - this.startBeat, this.bpm);

      if (beatTime < now + beatDuration * 2) {
        const buf =
          beatIndex % numerator === 0
            ? this.metronomeSounds.accent
            : this.metronomeSounds.click;
        if (buf) {
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          src.start(Math.max(now, beatTime));
        }
        beatIndex++;
      }
    };

    this.metronomeWorker = setInterval(schedule, (beatDuration * 1000) / 2);
  }

  private startPositionTracking(): void {
    const tick = (): void => {
      if (!this.ctx) return;
      const elapsed = this.ctx.currentTime - this.startTime;
      const currentBeat = this.startBeat + (elapsed / 60) * this.bpm;

      const state = useDAWStore.getState();
      if (
        state.transport.loopEnabled &&
        currentBeat >= state.transport.loopEnd
      ) {
        this.startPlayback(state.transport.loopStart);
        return;
      }

      useDAWStore.getState().setPosition(currentBeat);
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  stopPlayback(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.metronomeWorker !== null) {
      clearInterval(this.metronomeWorker);
      this.metronomeWorker = null;
    }
    for (const sources of this.scheduledSources.values()) {
      for (const src of sources) {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // already stopped
        }
      }
    }
    this.scheduledSources.clear();
  }

  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx!.currentTime, 0.01);
    }
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init();
    await this.resume();
    const arrayBuffer = await file.arrayBuffer();
    return this.ctx!.decodeAudioData(arrayBuffer);
  }

  /** Load and decode an audio file from a filesystem path (Electron only) */
  async decodeAudioPath(filePath: string): Promise<AudioBuffer> {
    await this.init();
    await this.resume();
    const api = window.electronAPI;
    if (!api) throw new Error('decodeAudioPath requires Electron');
    const bytes = await api.readFile(filePath);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    return this.ctx!.decodeAudioData(arrayBuffer);
  }

  getAnalyserNode(): AnalyserNode | null {
    if (!this.ctx || !this.masterGain) return null;
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    this.masterGain.connect(analyser);
    return analyser;
  }

  get audioContext(): AudioContext | null {
    return this.ctx;
  }
}

export const audioEngine = new AudioEngine();
