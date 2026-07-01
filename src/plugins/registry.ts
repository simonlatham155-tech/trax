import type { PluginManifest } from '@/types/plugins';

export const BUILTIN_PLUGINS: PluginManifest[] = [
  {
    id: 'builtin:drive',
    name: 'Tube Drive',
    vendor: 'TRAX',
    kind: 'effect',
    description: 'Soft saturation and harmonic drive',
    processor: 'trax-plugin',
    parameters: [
      { id: 'drive', name: 'Drive', min: 0, max: 1, default: 0.4, step: 0.01 },
      { id: 'mix', name: 'Mix', min: 0, max: 1, default: 1, step: 0.01, unit: '%' },
    ],
  },
  {
    id: 'builtin:filter',
    name: 'Ladder Filter',
    vendor: 'TRAX',
    kind: 'effect',
    description: 'Resonant low-pass filter',
    processor: 'trax-plugin',
    parameters: [
      { id: 'cutoff', name: 'Cutoff', min: 80, max: 12000, default: 2000, step: 1, unit: 'Hz' },
      { id: 'resonance', name: 'Res', min: 0, max: 1, default: 0.5, step: 0.01 },
    ],
  },
  {
    id: 'builtin:chorus',
    name: 'Chorus',
    vendor: 'TRAX',
    kind: 'effect',
    description: 'Modulated short delay chorus',
    processor: 'trax-plugin',
    parameters: [
      { id: 'rate', name: 'Rate', min: 0.1, max: 5, default: 0.8, step: 0.05, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0, max: 0.02, default: 0.004, step: 0.0001 },
      { id: 'mix', name: 'Mix', min: 0, max: 1, default: 0.5, step: 0.01 },
    ],
  },
  {
    id: 'builtin:bitcrush',
    name: 'Bitcrush',
    vendor: 'TRAX',
    kind: 'effect',
    description: 'Lo-fi bit and sample-rate reduction',
    processor: 'trax-plugin',
    parameters: [
      { id: 'bits', name: 'Bits', min: 2, max: 16, default: 8, step: 1 },
      { id: 'sampleReduce', name: 'Squeeze', min: 0, max: 0.95, default: 0.5, step: 0.01 },
      { id: 'mix', name: 'Mix', min: 0, max: 1, default: 1, step: 0.01 },
    ],
  },
];

const registry = new Map<string, PluginManifest>(
  BUILTIN_PLUGINS.map((p) => [p.id, p])
);

export function getPluginManifest(id: string): PluginManifest | undefined {
  return registry.get(id);
}

export function listPlugins(): PluginManifest[] {
  return [...registry.values()];
}

export function registerPlugin(manifest: PluginManifest): void {
  registry.set(manifest.id, manifest);
}
