/**
 * TRAX AudioWorklet plugin processor.
 * Built-in algorithms run in the audio thread; custom plugins use the same message API.
 */

class DriveAlgorithm {
  constructor(params) {
    this.drive = params.drive ?? 0.4;
    this.mix = params.mix ?? 1;
  }
  setParam(id, value) {
    if (id === 'drive') this.drive = value;
    if (id === 'mix') this.mix = value;
  }
  process(input, output) {
    const ch = Math.min(input.length, output.length);
    const k = 1 + this.drive * 20;
    const dry = 1 - this.mix;
    for (let c = 0; c < ch; c++) {
      const inp = input[c];
      const out = output[c];
      for (let i = 0; i < inp.length; i++) {
        const x = inp[i] * k;
        const wet = Math.tanh(x);
        out[i] = inp[i] * dry + wet * this.mix;
      }
    }
    return true;
  }
}

class FilterAlgorithm {
  constructor(params) {
    this.cutoff = params.cutoff ?? 2000;
    this.resonance = params.resonance ?? 0.5;
    this.z1 = [0, 0];
  }
  setParam(id, value) {
    if (id === 'cutoff') this.cutoff = value;
    if (id === 'resonance') this.resonance = value;
  }
  process(input, output, sampleRate) {
    const ch = Math.min(input.length, output.length);
    const fc = Math.max(20, Math.min(sampleRate * 0.45, this.cutoff));
    const q = 0.5 + this.resonance * 9.5;
    const g = Math.tan((Math.PI * fc) / sampleRate);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;

    for (let c = 0; c < ch; c++) {
      const inp = input[c];
      const out = output[c];
      let z1 = this.z1[c] || 0;
      for (let i = 0; i < inp.length; i++) {
        const v3 = inp[i] - z1;
        const v1 = a1 * v3;
        const v2 = z1 + a2 * v3;
        z1 = v2 + a3 * v3;
        out[i] = v2;
      }
      this.z1[c] = z1;
    }
    return true;
  }
}

class ChorusAlgorithm {
  constructor(params) {
    this.rate = params.rate ?? 0.8;
    this.depth = params.depth ?? 0.004;
    this.mix = params.mix ?? 0.5;
    this.phase = 0;
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.writePos = 0;
  }
  setParam(id, value) {
    if (id === 'rate') this.rate = value;
    if (id === 'depth') this.depth = value;
    if (id === 'mix') this.mix = value;
  }
  process(input, output, sampleRate) {
    const ch = Math.min(input.length, output.length);
    const dry = 1 - this.mix;
    for (let c = 0; c < ch; c++) {
      const inp = input[c];
      const out = output[c];
      for (let i = 0; i < inp.length; i++) {
        this.phase += (this.rate * 2 * Math.PI) / sampleRate;
        const mod = Math.sin(this.phase) * this.depth * sampleRate;
        const readPos = (this.writePos - 240 - mod + this.bufferSize) % this.bufferSize;
        const idx = Math.floor(readPos);
        const frac = readPos - idx;
        const s0 = this.buffer[idx % this.bufferSize];
        const s1 = this.buffer[(idx + 1) % this.bufferSize];
        const delayed = s0 + frac * (s1 - s0);
        this.buffer[this.writePos] = inp[i];
        this.writePos = (this.writePos + 1) % this.bufferSize;
        out[i] = inp[i] * dry + delayed * this.mix;
      }
    }
    return true;
  }
}

class BitcrushAlgorithm {
  constructor(params) {
    this.bits = params.bits ?? 8;
    this.sampleReduce = params.sampleReduce ?? 0.5;
    this.mix = params.mix ?? 1;
    this.hold = [0, 0];
    this.counter = [0, 0];
  }
  setParam(id, value) {
    if (id === 'bits') this.bits = value;
    if (id === 'sampleReduce') this.sampleReduce = value;
    if (id === 'mix') this.mix = value;
  }
  process(input, output, sampleRate) {
    const ch = Math.min(input.length, output.length);
    const levels = Math.pow(2, Math.max(1, Math.min(16, this.bits)));
    const step = Math.max(1, Math.floor((1 - this.sampleReduce) * sampleRate * 0.05));
    const dry = 1 - this.mix;
    for (let c = 0; c < ch; c++) {
      const inp = input[c];
      const out = output[c];
      for (let i = 0; i < inp.length; i++) {
        this.counter[c]++;
        if (this.counter[c] >= step) {
          this.counter[c] = 0;
          const crushed = Math.round(inp[i] * levels) / levels;
          this.hold[c] = crushed;
        }
        out[i] = inp[i] * dry + this.hold[c] * this.mix;
      }
    }
    return true;
  }
}

const ALGORITHMS = {
  'builtin:drive': DriveAlgorithm,
  'builtin:filter': FilterAlgorithm,
  'builtin:chorus': ChorusAlgorithm,
  'builtin:bitcrush': BitcrushAlgorithm,
};

class TraxPluginProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { pluginId, params = {}, enabled = true } = options.processorOptions ?? {};
    this.pluginId = pluginId;
    this.enabled = enabled;
    this.bypass = !enabled;
    const Algo = ALGORITHMS[pluginId];
    this.algo = Algo ? new Algo(params) : null;

    this.port.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'param' && this.algo) {
        this.algo.setParam(msg.id, msg.value);
      }
      if (msg.type === 'bypass') {
        this.bypass = msg.value;
      }
      if (msg.type === 'enabled') {
        this.bypass = !msg.value;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output || input.length === 0) return true;

    if (this.bypass || !this.algo) {
      const ch = Math.min(input.length, output.length);
      for (let c = 0; c < ch; c++) {
        const inp = input[c];
        const out = output[c];
        if (inp && out) out.set(inp);
      }
      return true;
    }

    return this.algo.process(input, output, sampleRate);
  }
}

registerProcessor('trax-plugin', TraxPluginProcessor);
