import { useDAWStore } from '@/store/daw-store';
import { beatsToSeconds } from '@/utils/beats';
import { vstBridge } from '@/services/vstBridge';
import type { Track, Clip } from '@/types';

// ── Per-track node chain ───────────────────────────────────────────────────────
// source(s) → gainNode → panNode → eqNodes → compNode → reverbGain → delayGain → masterGain
interface TrackNodes {
  gain: GainNode;
  pan: StereoPannerNode;
  eq: BiquadFilterNode[];
  comp: DynamicsCompressorNode;
  reverbConv: ConvolverNode;
  reverbGain: GainNode;
  delayNode: DelayNode;
  delayFeedback: GainNode;
  delayGain: GainNode;
  dry: GainNode;         // dry signal after pan, before wet send
  output: GainNode;      // final output connected to master
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  // Per-track persistent nodes
  private trackNodes = new Map<string, TrackNodes>();

  // Scheduled playback sources (clipId → sources)
  private scheduledSources = new Map<string, AudioBufferSourceNode[]>();
  private animationFrame: number | null = null;
  private startTime = 0;
  private startBeat = 0;

  // Metronome
  private metronomeTimer: ReturnType<typeof setInterval> | null = null;
  private metronomeSounds: { click: AudioBuffer | null; accent: AudioBuffer | null } = { click: null, accent: null };

  // ── Init ─────────────────────────────────────────────────────────────────────

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

    await this._makeMetronomeSounds();

    // Build nodes for existing tracks
    const { tracks } = useDAWStore.getState();
    for (const track of tracks) this._ensureTrackNodes(track);
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  // ── Per-track node management ─────────────────────────────────────────────

  private _ensureTrackNodes(track: Track): TrackNodes {
    if (this.trackNodes.has(track.id)) return this.trackNodes.get(track.id)!;
    const ctx = this.ctx!;

    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const dry = ctx.createGain();
    const output = ctx.createGain();

    // 4-band EQ
    const eq = track.effects.eq.bands.map(band => {
      const f = ctx.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.freq;
      f.gain.value = band.gain;
      f.Q.value = band.q;
      return f;
    });

    // Compressor
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = track.effects.compressor.threshold;
    comp.ratio.value = track.effects.compressor.ratio;
    comp.attack.value = track.effects.compressor.attack;
    comp.release.value = track.effects.compressor.release;
    comp.knee.value = track.effects.compressor.knee;

    // Reverb (convolver with impulse)
    const reverbConv = ctx.createConvolver();
    reverbConv.buffer = this._makeImpulse(track.effects.reverb.decay, track.effects.reverb.preDelay);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = track.effects.reverb.enabled ? track.effects.reverb.wet : 0;

    // Delay
    const delayNode = ctx.createDelay(5.0);
    delayNode.delayTime.value = track.effects.delay.time;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = track.effects.delay.feedback;
    const delayGain = ctx.createGain();
    delayGain.gain.value = track.effects.delay.enabled ? track.effects.delay.wet : 0;
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // Chain: gain → pan → eq[0..3] → comp → dry
    gain.connect(pan);
    let prev: AudioNode = pan;
    for (const f of eq) { prev.connect(f); prev = f; }
    prev.connect(comp);
    comp.connect(dry);

    // Wet sends from dry
    dry.connect(reverbConv);
    reverbConv.connect(reverbGain);
    reverbGain.connect(output);

    dry.connect(delayNode);
    delayGain.connect(output);
    delayNode.connect(delayGain);

    // Dry signal also to output
    dry.connect(output);
    output.connect(this.masterGain!);

    // Set initial values
    gain.gain.value = track.muted ? 0 : track.volume;
    pan.pan.value = track.pan;

    const nodes: TrackNodes = { gain, pan, eq, comp, reverbConv, reverbGain, delayNode, delayFeedback, delayGain, dry, output };
    this.trackNodes.set(track.id, nodes);
    return nodes;
  }

  /** Call this whenever track.volume, track.muted, track.pan, or track.effects changes */
  syncTrack(trackId: string): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const track = useDAWStore.getState().tracks.find(t => t.id === trackId);
    if (!track) return;

    const nodes = this.trackNodes.get(trackId);
    if (!nodes) { this._ensureTrackNodes(track); return; }

    const hasSoloed = useDAWStore.getState().tracks.some(t => t.soloed);
    const audible = !track.muted && (!hasSoloed || track.soloed);
    const targetGain = audible ? track.volume : 0;

    nodes.gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.01);
    nodes.pan.pan.setTargetAtTime(track.pan, ctx.currentTime, 0.01);

    // EQ bands
    const { eq: eqFx } = track.effects;
    nodes.eq.forEach((f, i) => {
      const band = eqFx.bands[i];
      if (!band) return;
      f.type = band.type;
      f.frequency.setTargetAtTime(band.freq, ctx.currentTime, 0.01);
      f.gain.setTargetAtTime(eqFx.enabled && band.enabled ? band.gain : 0, ctx.currentTime, 0.01);
      f.Q.setTargetAtTime(band.q, ctx.currentTime, 0.01);
    });

    // Compressor
    const { compressor: cmp } = track.effects;
    if (cmp.enabled) {
      nodes.comp.threshold.setTargetAtTime(cmp.threshold, ctx.currentTime, 0.01);
      nodes.comp.ratio.setTargetAtTime(cmp.ratio, ctx.currentTime, 0.01);
      nodes.comp.attack.setTargetAtTime(cmp.attack, ctx.currentTime, 0.01);
      nodes.comp.release.setTargetAtTime(cmp.release, ctx.currentTime, 0.01);
      nodes.comp.knee.setTargetAtTime(cmp.knee, ctx.currentTime, 0.01);
    }

    // Reverb
    const { reverb } = track.effects;
    nodes.reverbGain.gain.setTargetAtTime(reverb.enabled ? reverb.wet : 0, ctx.currentTime, 0.02);

    // Delay
    const { delay } = track.effects;
    nodes.delayNode.delayTime.setTargetAtTime(delay.time, ctx.currentTime, 0.01);
    nodes.delayFeedback.gain.setTargetAtTime(delay.feedback, ctx.currentTime, 0.01);
    nodes.delayGain.gain.setTargetAtTime(delay.enabled ? delay.wet : 0, ctx.currentTime, 0.02);
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  async startPlayback(fromBeat: number): Promise<void> {
    if (!this.ctx || !this.masterGain) return;
    this.stopPlayback();

    this.startBeat = fromBeat;
    this.startTime = this.ctx.currentTime;

    // Ensure all track nodes exist and are synced
    const { tracks } = useDAWStore.getState();
    for (const track of tracks) {
      this._ensureTrackNodes(track);
      this.syncTrack(track.id);
    }

    // Pre-render MIDI clips via bridge
    await this._preRenderMidiClips();

    this._scheduleAllClips(fromBeat);
    this._startPositionTracking();

    const state = useDAWStore.getState();
    if (state.transport.metronomeEnabled) this._startMetronome(fromBeat);
  }

  stopPlayback(): void {
    if (this.animationFrame !== null) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; }
    if (this.metronomeTimer !== null) { clearInterval(this.metronomeTimer); this.metronomeTimer = null; }
    for (const sources of this.scheduledSources.values()) {
      for (const src of sources) {
        try { src.stop(); src.disconnect(); } catch { /* already stopped */ }
      }
    }
    this.scheduledSources.clear();
  }

  private _scheduleAllClips(fromBeat: number): void {
    const { tracks, project } = useDAWStore.getState();
    for (const track of tracks) {
      const nodes = this.trackNodes.get(track.id);
      if (!nodes) continue;
      const sources: AudioBufferSourceNode[] = [];
      for (const clip of track.clips) {
        if (!clip.audioBuffer) continue;
        const clipEnd = clip.startBeat + clip.durationBeats;
        if (clipEnd <= fromBeat) continue;
        const src = this._scheduleClip(clip, track, nodes, fromBeat, project.bpm);
        if (src) sources.push(src);
      }
      this.scheduledSources.set(track.id, sources);
    }
  }

  private _scheduleClip(
    clip: Clip,
    track: Track,
    nodes: TrackNodes,
    fromBeat: number,
    bpm: number,
  ): AudioBufferSourceNode | null {
    if (!this.ctx || !clip.audioBuffer) return null;

    const src = this.ctx.createBufferSource();
    src.buffer = clip.audioBuffer;

    // Ableton-style warp: adjust playbackRate so audio conforms to project BPM
    if (clip.originalBpm && clip.originalBpm > 0) {
      src.playbackRate.value = bpm / clip.originalBpm;
    }

    // Per-clip gain
    const clipGain = this.ctx.createGain();
    clipGain.gain.value = clip.gain;
    src.connect(clipGain);
    clipGain.connect(nodes.gain);  // feeds into track node chain

    const clipStartSec = beatsToSeconds(clip.startBeat, bpm);
    const playheadSec = beatsToSeconds(fromBeat, bpm);

    let when = this.startTime;
    let offset = 0;
    if (clip.startBeat < fromBeat) {
      offset = playheadSec - clipStartSec;
    } else {
      when = this.startTime + (clipStartSec - playheadSec);
    }

    const warpRate = src.playbackRate.value;
    const duration = (beatsToSeconds(clip.durationBeats, bpm) - offset) / warpRate;
    if (duration <= 0) return null;

    src.start(when, offset * warpRate, duration * warpRate);
    return src;
  }

  private _startPositionTracking(): void {
    const tick = (): void => {
      if (!this.ctx) return;
      const elapsed = this.ctx.currentTime - this.startTime;
      const currentBeat = this.startBeat + (elapsed / 60) * useDAWStore.getState().project.bpm;
      const state = useDAWStore.getState();
      if (state.transport.loopEnabled && currentBeat >= state.transport.loopEnd) {
        this.startPlayback(state.transport.loopStart);
        return;
      }
      useDAWStore.getState().setPosition(currentBeat);
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private _startMetronome(fromBeat: number): void {
    if (!this.ctx) return;
    const { numerator } = useDAWStore.getState().project.timeSignature;
    const beatDuration = 60 / useDAWStore.getState().project.bpm;
    let beatIndex = Math.ceil(fromBeat);

    const schedule = (): void => {
      if (!this.ctx || !this.metronomeSounds.click) return;
      const now = this.ctx.currentTime;
      const beatTime = this.startTime + beatsToSeconds(beatIndex - this.startBeat, useDAWStore.getState().project.bpm);
      if (beatTime < now + beatDuration * 2) {
        const buf = beatIndex % numerator === 0 ? this.metronomeSounds.accent : this.metronomeSounds.click;
        if (buf) {
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          src.start(Math.max(now, beatTime));
        }
        beatIndex++;
      }
    };
    this.metronomeTimer = setInterval(schedule, (beatDuration * 1000) / 2);
  }

  // ── MIDI pre-render ───────────────────────────────────────────────────────

  private async _preRenderMidiClips(): Promise<void> {
    if (vstBridge.currentStatus !== 'connected') return;
    const { tracks, project } = useDAWStore.getState();
    for (const track of tracks) {
      if (!track.instrument) continue;
      for (const clip of track.clips) {
        if (!clip.notes?.length) continue;
        if (clip.audioBuffer) continue; // already rendered (cleared on note edit)
        try {
          const buf = await vstBridge.renderMidi(track.id, clip.notes, project.bpm, clip.durationBeats, track.volume);
          useDAWStore.getState().updateClip(track.id, clip.id, { audioBuffer: buf, originalBpm: project.bpm });
        } catch (e) {
          console.warn(`Bridge render failed for ${clip.id}:`, e);
        }
      }
    }
  }

  // ── External sync API (called by store subscriptions) ─────────────────────

  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx!.currentTime, 0.01);
    }
  }

  // Called when track nodes need to be created for a new track
  onTrackAdded(track: Track): void {
    if (this.ctx) this._ensureTrackNodes(track);
  }

  // Called when a track is removed
  onTrackRemoved(trackId: string): void {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      try { nodes.output.disconnect(); } catch { /* ok */ }
      this.trackNodes.delete(trackId);
    }
  }

  // ── Audio file decode ────────────────────────────────────────────────────

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init();
    await this.resume();
    return this.ctx!.decodeAudioData(await file.arrayBuffer());
  }

  get audioContext(): AudioContext | null { return this.ctx; }

  // ── Metronome sounds ─────────────────────────────────────────────────────

  private async _makeMetronomeSounds(): Promise<void> {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const make = (freq: number, dur: number): AudioBuffer => {
      const buf = this.ctx!.createBuffer(1, Math.floor(sr * dur), sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        d[i] = Math.exp(-t * 80) * Math.sin(2 * Math.PI * freq * t) * 0.5;
      }
      return buf;
    };
    this.metronomeSounds.accent = make(1200, 0.05);
    this.metronomeSounds.click  = make(900,  0.04);
  }

  // ── Reverb impulse ───────────────────────────────────────────────────────

  private _makeImpulse(decay: number, preDelay: number): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * (decay + preDelay));
    const buf = ctx.createBuffer(2, len, sr);
    const preSamples = Math.floor(sr * preDelay);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = preSamples; i < len; i++) {
        const t = (i - preSamples) / sr;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * (3 / decay));
      }
    }
    return buf;
  }
}

export const audioEngine = new AudioEngine();

// ── Store subscriptions — live sync without restart ───────────────────────────

let lastTracks: string[] = [];

useDAWStore.subscribe((state) => {
  // Sync each track's audio nodes whenever store changes
  const currentIds = state.tracks.map(t => t.id);

  // New tracks
  for (const track of state.tracks) {
    if (!lastTracks.includes(track.id)) {
      audioEngine.onTrackAdded(track);
    }
    audioEngine.syncTrack(track.id);
  }

  // Removed tracks
  for (const id of lastTracks) {
    if (!currentIds.includes(id)) audioEngine.onTrackRemoved(id);
  }

  lastTracks = currentIds;
});
