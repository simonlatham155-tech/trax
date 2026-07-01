import type { TrackEffects } from '@/types';

export interface TrackChainNodes {
  input: GainNode;
  output: GainNode;
  pan: StereoPannerNode;
  eqFilters: BiquadFilterNode[];
  compressor: DynamicsCompressorNode;
  makeupGain: GainNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  delayWet: GainNode;
  delayDry: GainNode;
  reverb: ConvolverNode;
  reverbWet: GainNode;
  reverbDry: GainNode;
}

function createReverbImpulse(ctx: BaseAudioContext, decay: number, preDelay: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const preDelaySamples = Math.floor(preDelay * sr);
  const length = Math.floor((decay + preDelay) * sr);
  const impulse = ctx.createBuffer(2, length, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
      } else {
        const t = (i - preDelaySamples) / sr;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / decay, 2);
      }
    }
  }
  return impulse;
}

export function createTrackChain(ctx: BaseAudioContext): TrackChainNodes {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const pan = ctx.createStereoPanner();

  const eqFilters: BiquadFilterNode[] = [];
  let prev: AudioNode = input;
  for (let i = 0; i < 4; i++) {
    const f = ctx.createBiquadFilter();
    prev.connect(f);
    prev = f;
    eqFilters.push(f);
  }

  const compressor = ctx.createDynamicsCompressor();
  const makeupGain = ctx.createGain();
  prev.connect(compressor);
  compressor.connect(makeupGain);

  const delay = ctx.createDelay(2);
  const delayFeedback = ctx.createGain();
  const delayWet = ctx.createGain();
  const delayDry = ctx.createGain();

  makeupGain.connect(delayDry);
  makeupGain.connect(delay);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delay.connect(delayWet);

  const delayMerge = ctx.createGain();
  delayDry.connect(delayMerge);
  delayWet.connect(delayMerge);

  const reverb = ctx.createConvolver();
  const reverbWet = ctx.createGain();
  const reverbDry = ctx.createGain();

  delayMerge.connect(reverbDry);
  delayMerge.connect(reverb);
  reverb.connect(reverbWet);

  const reverbMerge = ctx.createGain();
  reverbDry.connect(reverbMerge);
  reverbWet.connect(reverbMerge);

  reverbMerge.connect(pan);
  pan.connect(output);

  return {
    input,
    output,
    pan,
    eqFilters,
    compressor,
    makeupGain,
    delay,
    delayFeedback,
    delayWet,
    delayDry,
    reverb,
    reverbWet,
    reverbDry,
  };
}

export function syncTrackChain(
  chain: TrackChainNodes,
  effects: TrackEffects,
  volume: number,
  pan: number,
  ctx: BaseAudioContext,
  when = ctx.currentTime
): void {
  const t = when;

  chain.input.gain.setValueAtTime(1, t);
  chain.pan.pan.setValueAtTime(pan, t);
  chain.output.gain.setValueAtTime(volume, t);

  const { eq, compressor, reverb, delay } = effects;

  for (let i = 0; i < chain.eqFilters.length; i++) {
    const filter = chain.eqFilters[i];
    const band = eq.bands[i];
    if (!band || !eq.enabled) {
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(1000, t);
      filter.Q.setValueAtTime(1, t);
      filter.gain.setValueAtTime(0, t);
      continue;
    }
    filter.type = band.type;
    filter.frequency.setValueAtTime(band.freq, t);
    filter.Q.setValueAtTime(band.q, t);
    filter.gain.setValueAtTime(band.enabled ? band.gain : 0, t);
  }

  if (compressor.enabled) {
    chain.compressor.threshold.setValueAtTime(compressor.threshold, t);
    chain.compressor.ratio.setValueAtTime(compressor.ratio, t);
    chain.compressor.attack.setValueAtTime(compressor.attack, t);
    chain.compressor.release.setValueAtTime(compressor.release, t);
    chain.compressor.knee.setValueAtTime(compressor.knee, t);
    chain.makeupGain.gain.setValueAtTime(
      Math.pow(10, compressor.makeupGain / 20),
      t
    );
  } else {
    chain.compressor.threshold.setValueAtTime(0, t);
    chain.compressor.ratio.setValueAtTime(1, t);
    chain.makeupGain.gain.setValueAtTime(1, t);
  }

  if (delay.enabled) {
    chain.delay.delayTime.setValueAtTime(delay.time, t);
    chain.delayFeedback.gain.setValueAtTime(delay.feedback, t);
    chain.delayWet.gain.setValueAtTime(delay.wet, t);
    chain.delayDry.gain.setValueAtTime(1 - delay.wet, t);
  } else {
    chain.delayWet.gain.setValueAtTime(0, t);
    chain.delayDry.gain.setValueAtTime(1, t);
  }

  if (reverb.enabled) {
    chain.reverb.buffer = createReverbImpulse(ctx, reverb.decay, reverb.preDelay);
    chain.reverbWet.gain.setValueAtTime(reverb.wet, t);
    chain.reverbDry.gain.setValueAtTime(1 - reverb.wet, t);
  } else {
    chain.reverbWet.gain.setValueAtTime(0, t);
    chain.reverbDry.gain.setValueAtTime(1, t);
  }
}
