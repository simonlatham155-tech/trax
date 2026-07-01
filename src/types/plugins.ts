import { generateId } from '@/utils/id';

export type PluginKind = 'effect' | 'instrument';

export interface PluginParameterDef {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  unit?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  vendor: string;
  kind: PluginKind;
  description: string;
  /** Built-in worklet id or URL path to external worklet module */
  processor: string;
  parameters: PluginParameterDef[];
}

export interface PluginSlot {
  id: string;
  pluginId: string;
  enabled: boolean;
  params: Record<string, number>;
}

export function defaultParamsForManifest(manifest: PluginManifest): Record<string, number> {
  const params: Record<string, number> = {};
  for (const p of manifest.parameters) {
    params[p.id] = p.default;
  }
  return params;
}

export function createPluginSlot(pluginId: string, manifest: PluginManifest, id?: string): PluginSlot {
  return {
    id: id ?? generateId(),
    pluginId,
    enabled: true,
    params: defaultParamsForManifest(manifest),
  };
}
