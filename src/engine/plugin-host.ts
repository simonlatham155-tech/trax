import type { PluginSlot } from '@/types/plugins';
import { getPluginManifest } from '@/plugins/registry';

const loadedContexts = new WeakSet<BaseAudioContext>();
const WORKLET_URL = `${import.meta.env.BASE_URL}worklets/trax-plugin-processor.js`;

export interface PluginNodeEntry {
  slotId: string;
  node: AudioWorkletNode;
}

export class TrackPluginChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private nodes: PluginNodeEntry[] = [];
  private ctx: BaseAudioContext;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.input.connect(this.output);
  }

  async rebuild(slots: PluginSlot[]): Promise<void> {
    this.disconnectAll();

    if (slots.length === 0) {
      this.input.connect(this.output);
      return;
    }

    await ensureWorkletModule(this.ctx);

    let prev: AudioNode = this.input;

    for (const slot of slots) {
      if (!getPluginManifest(slot.pluginId)) continue;

      const node = new AudioWorkletNode(this.ctx, 'trax-plugin', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        processorOptions: {
          pluginId: slot.pluginId,
          params: slot.params,
          enabled: slot.enabled,
        },
      });

      prev.connect(node);
      this.syncSlot(node, slot);
      this.nodes.push({ slotId: slot.id, node });
      prev = node;
    }

    prev.connect(this.output);
  }

  syncSlots(slots: PluginSlot[]): void {
    for (const entry of this.nodes) {
      const slot = slots.find((s) => s.id === entry.slotId);
      if (!slot) continue;
      this.syncSlot(entry.node, slot);
    }
  }

  private syncSlot(node: AudioWorkletNode, slot: PluginSlot): void {
    node.port.postMessage({ type: 'enabled', value: slot.enabled });
    node.port.postMessage({ type: 'bypass', value: !slot.enabled });
    for (const [id, value] of Object.entries(slot.params)) {
      node.port.postMessage({ type: 'param', id, value });
    }
  }

  private disconnectAll(): void {
    try {
      this.input.disconnect();
    } catch {
      // not connected
    }
    for (const entry of this.nodes) {
      try {
        entry.node.disconnect();
      } catch {
        // already disconnected
      }
    }
    this.nodes = [];
    try {
      this.output.disconnect();
    } catch {
      // not connected
    }
  }

  dispose(): void {
    this.disconnectAll();
  }
}

export async function ensureWorkletModule(ctx: BaseAudioContext): Promise<void> {
  if (loadedContexts.has(ctx)) return;
  await ctx.audioWorklet.addModule(WORKLET_URL);
  loadedContexts.add(ctx);
}

export function wirePluginChain(
  chain: { input: AudioNode; fxInput: AudioNode },
  pluginChain: TrackPluginChain,
  hasPlugins: boolean
): void {
  try {
    chain.input.disconnect(chain.fxInput);
  } catch {
    // not connected
  }
  try {
    pluginChain.input.disconnect();
    pluginChain.output.disconnect();
  } catch {
    // not connected
  }

  if (hasPlugins) {
    chain.input.connect(pluginChain.input);
    pluginChain.output.connect(chain.fxInput);
  } else {
    chain.input.connect(chain.fxInput);
  }
}

/** Create plugin chains for offline rendering. */
export async function createOfflinePluginChain(
  ctx: BaseAudioContext,
  slots: PluginSlot[]
): Promise<TrackPluginChain> {
  const chain = new TrackPluginChain(ctx);
  await chain.rebuild(slots);
  return chain;
}
