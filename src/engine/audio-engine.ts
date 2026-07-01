import { useDAWStore } from '@/store/daw-store';
import { beatsToSeconds } from '@/utils/beats';
import type { Track, Clip } from '@/types';
import {
  createTrackChain,
  syncTrackChain,
  type TrackChainNodes,
} from '@/engine/effects-chain';

export interface RenderOptions {
  bpm: number;
  fromBeat?: number;
  toBeat?: number;
  masterVolume?: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private trackChains: Map<string, TrackChainNodes> = new Map();
  private trackAnalysers: Map<string, AnalyserNode> = new Map();
  private scheduledSources: Map<string, AudioBufferSourceNode[]> = new Map();
  private animationFrame: number | null = null;
  private startTime = 0;
  private startBeat = 0;
  private metronomeWorker: ReturnType<typeof setInterval> | null = null;
  private metronomeSounds: { click: AudioBuffer | null; accent: AudioBuffer | null } = {
    click: null,
    accent: null,
  };
  private storeUnsubscribe: (() => void) | null = null;

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

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;

    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    await this.createMetronomeSounds();
    this.subscribeToStore();
    this.prepareAllTrackChains();
  }

  /** Create per-track effect chains and analysers without starting playback. */
  prepareAllTrackChains(): void {
    if (!this.ctx || !this.masterGain) return;
    const { tracks } = useDAWStore.getState();
    for (const track of tracks) {
      this.ensureTrackChain(track);
    }
  }

  private subscribeToStore(): void {
    if (this.storeUnsubscribe) return;
    this.storeUnsubscribe = useDAWStore.subscribe((state, prev) => {
      if (!this.ctx) return;

      // Create chains for newly added tracks
      for (const track of state.tracks) {
        if (!prev.tracks.find((t) => t.id === track.id)) {
          this.ensureTrackChain(track);
        }
      }

      for (const track of state.tracks) {
        const prevTrack = prev.tracks.find((t) => t.id === track.id);
        if (
          !prevTrack ||
          prevTrack.volume !== track.volume ||
          prevTrack.pan !== track.pan ||
          JSON.stringify(prevTrack.effects) !== JSON.stringify(track.effects)
        ) {
          this.syncTrack(track);
        }
      }
      if (state.masterVolume !== prev.masterVolume) {
        this.setMasterVolume(state.masterVolume);
      }
    });
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

  private ensureTrackChain(track: Track): TrackChainNodes {
    if (!this.ctx || !this.masterGain) throw new Error('Audio engine not initialized');

    let chain = this.trackChains.get(track.id);
    if (!chain) {
      chain = createTrackChain(this.ctx);
      chain.output.connect(this.masterGain);

      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 2048;
      chain.output.connect(analyser);
      this.trackAnalysers.set(track.id, analyser);

      this.trackChains.set(track.id, chain);
    }

    syncTrackChain(chain, track.effects, track.volume, track.pan, this.ctx);
    return chain;
  }

  private syncTrack(track: Track): void {
    if (!this.ctx) return;
    if (this.trackChains.has(track.id)) {
      const chain = this.trackChains.get(track.id)!;
      syncTrackChain(chain, track.effects, track.volume, track.pan, this.ctx);
    }
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

      const chain = this.ensureTrackChain(track);
      const sources: AudioBufferSourceNode[] = [];

      for (const clip of track.clips) {
        if (!clip.audioBuffer) continue;
        const clipEndBeat = clip.startBeat + clip.durationBeats;
        if (clipEndBeat <= fromBeat) continue;

        const source = this.scheduleClip(clip, chain, fromBeat, project.bpm);
        if (source) sources.push(source);
      }
      this.scheduledSources.set(track.id, sources);
    }
  }

  private scheduleClip(
    clip: Pick<Clip, 'startBeat' | 'durationBeats' | 'audioBuffer' | 'gain' | 'fadeIn' | 'fadeOut'>,
    chain: TrackChainNodes,
    fromBeat: number,
    bpm: number
  ): AudioBufferSourceNode | null {
    if (!this.ctx) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = clip.audioBuffer!;

    const gainNode = this.ctx.createGain();
    const clipGain = clip.gain;
    const clipDurationSec = beatsToSeconds(clip.durationBeats, bpm);
    const fadeInSec = beatsToSeconds(clip.fadeIn, bpm);
    const fadeOutSec = beatsToSeconds(clip.fadeOut, bpm);

    const clipStartSeconds = beatsToSeconds(clip.startBeat, bpm);
    const playheadSeconds = beatsToSeconds(fromBeat, bpm);

    let when = this.startTime;
    let offset = 0;

    if (clip.startBeat < fromBeat) {
      offset = playheadSeconds - clipStartSeconds;
    } else {
      when = this.startTime + (clipStartSeconds - playheadSeconds);
    }

    const duration = clipDurationSec - offset;
    if (duration <= 0) return null;

    gainNode.gain.setValueAtTime(0, when);
    const effectiveStart = offset;
    const effectiveEnd = offset + duration;

    if (fadeInSec > 0 && effectiveStart < fadeInSec) {
      const fadeStart = Math.max(0, fadeInSec - effectiveStart);
      gainNode.gain.setValueAtTime(0, when);
      gainNode.gain.linearRampToValueAtTime(clipGain, when + fadeStart);
    } else {
      gainNode.gain.setValueAtTime(clipGain, when);
    }

    if (fadeOutSec > 0) {
      const fadeOutStartBeat = clip.durationBeats - clip.fadeOut;
      const fadeOutStartSec = beatsToSeconds(fadeOutStartBeat, bpm) - clipStartSeconds;
      if (fadeOutStartSec < effectiveEnd) {
        const localFadeStart = Math.max(0, fadeOutStartSec - effectiveStart);
        const localFadeEnd = duration;
        gainNode.gain.setValueAtTime(clipGain, when + localFadeStart);
        gainNode.gain.linearRampToValueAtTime(0, when + localFadeEnd);
      }
    }

    source.connect(gainNode);
    gainNode.connect(chain.input);

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

  getTrackAnalyser(trackId: string): AnalyserNode | null {
    return this.trackAnalysers.get(trackId) ?? null;
  }

  getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init();
    await this.resume();
    const arrayBuffer = await file.arrayBuffer();
    return this.ctx!.decodeAudioData(arrayBuffer);
  }

  /** Offline render of the full mix (or a beat range) to an AudioBuffer. */
  async renderMix(options?: RenderOptions): Promise<AudioBuffer> {
    const state = useDAWStore.getState();
    const bpm = options?.bpm ?? state.project.bpm;
    const masterVolume = options?.masterVolume ?? state.masterVolume;
    const fromBeat = options?.fromBeat ?? 0;

    let toBeat = options?.toBeat;
    if (toBeat === undefined) {
      toBeat = 16;
      for (const track of state.tracks) {
        for (const clip of track.clips) {
          toBeat = Math.max(toBeat, clip.startBeat + clip.durationBeats);
        }
      }
      toBeat = Math.max(toBeat, 4);
    }

    const durationSec = beatsToSeconds(toBeat - fromBeat, bpm);
    const sampleRate = state.project.sampleRate;
    const offline = new OfflineAudioContext(2, Math.ceil(durationSec * sampleRate), sampleRate);

    const masterGain = offline.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(offline.destination);

    const hasSoloed = state.tracks.some((t) => t.soloed);
    const startTime = 0;

    for (const track of state.tracks) {
      if (track.muted || (hasSoloed && !track.soloed)) continue;

      const chain = createTrackChain(offline);
      syncTrackChain(chain, track.effects, track.volume, track.pan, offline, 0);
      chain.output.connect(masterGain);

      for (const clip of track.clips) {
        if (!clip.audioBuffer) continue;
        const clipEndBeat = clip.startBeat + clip.durationBeats;
        if (clipEndBeat <= fromBeat || clip.startBeat >= toBeat) continue;

        const source = offline.createBufferSource();
        source.buffer = clip.audioBuffer;

        const gainNode = offline.createGain();
        const clipGain = clip.gain;
        const clipDurationSec = beatsToSeconds(clip.durationBeats, bpm);
        const fadeInSec = beatsToSeconds(clip.fadeIn, bpm);
        const fadeOutSec = beatsToSeconds(clip.fadeOut, bpm);

        const clipStartSeconds = beatsToSeconds(clip.startBeat, bpm);
        const rangeStartSeconds = beatsToSeconds(fromBeat, bpm);

        let when = startTime;
        let offset = 0;

        if (clip.startBeat < fromBeat) {
          offset = rangeStartSeconds - clipStartSeconds;
        } else {
          when = startTime + (clipStartSeconds - rangeStartSeconds);
        }

        const clipEndSec = clipStartSeconds + clipDurationSec;
        const rangeEndSec = rangeStartSeconds + durationSec;
        const playEnd = Math.min(clipEndSec, rangeEndSec);
        const playStart = Math.max(clipStartSeconds, rangeStartSeconds);
        const duration = playEnd - playStart - (clipStartSeconds + offset < playStart ? playStart - (clipStartSeconds + offset) : 0);

        if (offset < playStart - clipStartSeconds) {
          offset = playStart - clipStartSeconds;
        }

        const actualDuration = Math.min(duration, clipDurationSec - offset);
        if (actualDuration <= 0) continue;

        gainNode.gain.setValueAtTime(clipGain, when);
        if (fadeInSec > 0) {
          const fadeInEnd = clipStartSeconds + fadeInSec;
          if (fadeInEnd > playStart) {
            const localStart = Math.max(0, fadeInEnd - Math.max(clipStartSeconds + offset, playStart));
            gainNode.gain.setValueAtTime(0, when);
            gainNode.gain.linearRampToValueAtTime(clipGain, when + localStart);
          }
        }
        if (fadeOutSec > 0) {
          const fadeOutStart = clipStartSeconds + clipDurationSec - fadeOutSec;
          if (fadeOutStart < playEnd) {
            const localFadeStart = fadeOutStart - Math.max(clipStartSeconds + offset, playStart);
            if (localFadeStart >= 0) {
              gainNode.gain.setValueAtTime(clipGain, when + localFadeStart);
              gainNode.gain.linearRampToValueAtTime(0, when + actualDuration);
            }
          }
        }

        source.connect(gainNode);
        gainNode.connect(chain.input);
        source.start(when, offset, actualDuration);
      }
    }

    return offline.startRendering();
  }

  get audioContext(): AudioContext | null {
    return this.ctx;
  }
}

export const audioEngine = new AudioEngine();
