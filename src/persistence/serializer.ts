/**
 * Serializes the DAW store state to a JSON-safe object and back.
 *
 * AudioBuffer objects cannot be stored in JSON or IndexedDB directly.
 * Strategy:
 *   serialize: strip audioBuffer from each clip; record the clipId → audioFileId map
 *   deserialize: re-decode stored ArrayBuffers via AudioContext and re-attach
 */

import type { Track, Clip, ProjectSettings, Marker } from '@/types';
import { audioEngine } from '@/engine/audio-engine';

export const TRAX_FILE_VERSION = 1;

/** The JSON-safe shape of one clip (no AudioBuffer) */
export interface SerializedClip extends Omit<Clip, 'audioBuffer'> {
  audioFileId?: string;
}

export interface SerializedTrack extends Omit<Track, 'clips'> {
  clips: SerializedClip[];
}

export interface SerializedProject {
  version: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  project: ProjectSettings;
  tracks: SerializedTrack[];
  markers: Marker[];
  transport: {
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    metronomeEnabled: boolean;
  };
  masterVolume: number;
  masterLimiterEnabled: boolean;
  /** present only in exported .trax bundle files (base64-encoded ArrayBuffers) */
  audioFiles?: Record<string, string>;
  /** list of all audio file IDs referenced by this project (for IDB cleanup) */
  audioFileIds: string[];
}

// ─── Serialize ───────────────────────────────────────────────────────────────

export function serializeProject(
  state: {
    project: ProjectSettings;
    tracks: Track[];
    markers: Marker[];
    transport: {
      loopEnabled: boolean;
      loopStart: number;
      loopEnd: number;
      metronomeEnabled: boolean;
      countInEnabled: boolean;
    };
    masterVolume: number;
    masterLimiterEnabled: boolean;
  },
  name: string,
  createdAt?: string
): SerializedProject {
  const now = new Date().toISOString();
  const audioFileIds: string[] = [];

  const tracks: SerializedTrack[] = state.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) => {
      const { audioBuffer, ...rest } = clip;
      const serializedClip: SerializedClip = { ...rest };
      if (audioBuffer) {
        const fileId = clip.id;
        serializedClip.audioFileId = fileId;
        audioFileIds.push(fileId);
      }
      return serializedClip;
    }),
  }));

  return {
    version: TRAX_FILE_VERSION,
    name,
    createdAt: createdAt ?? now,
    updatedAt: now,
    project: state.project,
    tracks,
    markers: state.markers,
    transport: {
      loopEnabled: state.transport.loopEnabled,
      loopStart: state.transport.loopStart,
      loopEnd: state.transport.loopEnd,
      metronomeEnabled: state.transport.metronomeEnabled,
    },
    masterVolume: state.masterVolume,
    masterLimiterEnabled: state.masterLimiterEnabled,
    audioFileIds,
  };
}

// ─── Deserialize ─────────────────────────────────────────────────────────────

export interface DeserializedProject {
  project: ProjectSettings;
  tracks: Track[];
  markers: Marker[];
  transport: {
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    metronomeEnabled: boolean;
  };
  masterVolume: number;
  masterLimiterEnabled: boolean;
  name: string;
  createdAt: string;
}

export async function deserializeProject(
  data: SerializedProject,
  getAudioBuffer: (id: string) => Promise<ArrayBuffer | undefined>
): Promise<DeserializedProject> {
  await audioEngine.init();

  const tracks: Track[] = await Promise.all(
    data.tracks.map(async (track) => {
      const clips: Clip[] = await Promise.all(
        track.clips.map(async (clip) => {
          const { audioFileId, ...rest } = clip;
          let audioBuffer: AudioBuffer | undefined;

          if (audioFileId) {
            const ab = await getAudioBuffer(audioFileId);
            if (ab) {
              try {
                audioBuffer = await audioEngine.audioContext!.decodeAudioData(ab.slice(0));
              } catch {
                // corrupt or missing — skip
              }
            }
          }

          return { ...rest, audioBuffer };
        })
      );
      return { ...track, clips };
    })
  );

  return {
    project: data.project,
    tracks,
    markers: data.markers,
    transport: data.transport,
    masterVolume: data.masterVolume,
    masterLimiterEnabled: data.masterLimiterEnabled,
    name: data.name,
    createdAt: data.createdAt,
  };
}

// ─── .trax file bundle (export/import) ───────────────────────────────────────

function ab2b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function b642ab(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Builds a standalone .trax JSON bundle by embedding audio files as base64.
 * getAudioArrayBuffer returns the original ArrayBuffer for a clip ID.
 */
export async function buildTraxBundle(
  serialized: SerializedProject,
  getAudioArrayBuffer: (id: string) => Promise<ArrayBuffer | undefined>
): Promise<string> {
  const audioFiles: Record<string, string> = {};

  for (const id of serialized.audioFileIds) {
    const ab = await getAudioArrayBuffer(id);
    if (ab) audioFiles[id] = ab2b64(ab);
  }

  return JSON.stringify({ ...serialized, audioFiles }, null, 2);
}

/**
 * Parses a .trax bundle, extracting embedded audio files back to ArrayBuffers.
 */
export function parseTraxBundle(json: string): {
  serialized: SerializedProject;
  audioFiles: Record<string, ArrayBuffer>;
} {
  const parsed = JSON.parse(json) as SerializedProject & { audioFiles?: Record<string, string> };
  const audioFiles: Record<string, ArrayBuffer> = {};
  for (const [id, b64] of Object.entries(parsed.audioFiles ?? {})) {
    audioFiles[id] = b642ab(b64);
  }
  const { audioFiles: _stripped, ...serialized } = parsed;
  return { serialized: serialized as SerializedProject, audioFiles };
}
