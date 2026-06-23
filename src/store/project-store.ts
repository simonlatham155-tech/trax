import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generateId } from '@/utils/id';
import { useDAWStore } from './daw-store';
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  saveAudioFile,
  loadAudioFile,
} from '@/persistence/db';
import {
  serializeProject,
  deserializeProject,
  buildTraxBundle,
  parseTraxBundle,
  type SerializedProject,
} from '@/persistence/serializer';
import type { Track } from '@/types';

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projectId: string;
  projectName: string;
  createdAt: string;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  savedProjects: ProjectMeta[];
  error: string | null;

  // Actions
  setProjectName: (name: string) => void;
  markDirty: () => void;
  save: () => Promise<void>;
  saveAs: (name: string) => Promise<void>;
  load: (id: string) => Promise<void>;
  newProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  refreshProjectList: () => Promise<void>;
  exportTraxFile: () => Promise<void>;
  importTraxFile: (file: File) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projectId: generateId(),
    projectName: 'Untitled Project',
    createdAt: new Date().toISOString(),
    isDirty: false,
    isSaving: false,
    isLoading: false,
    savedProjects: [],
    error: null,

    setProjectName: (name) =>
      set((s) => {
        s.projectName = name;
        s.isDirty = true;
      }),

    markDirty: () =>
      set((s) => {
        s.isDirty = true;
      }),

    save: async () => {
      const { projectId, projectName, createdAt } = get();
      set((s) => { s.isSaving = true; s.error = null; });

      try {
        const dawState = useDAWStore.getState();

        const serialized = serializeProject(dawState, projectName, createdAt);

        // Persist audio ArrayBuffers to IDB
        await persistAudioFiles(dawState.tracks, serialized);

        await saveProject({
          id: projectId,
          name: projectName,
          createdAt: serialized.createdAt,
          updatedAt: serialized.updatedAt,
          data: serialized,
        });

        set((s) => {
          s.isDirty = false;
          s.isSaving = false;
        });

        await get().refreshProjectList();
      } catch (err) {
        set((s) => {
          s.isSaving = false;
          s.error = String(err);
        });
        throw err;
      }
    },

    saveAs: async (name) => {
      set((s) => {
        s.projectId = generateId();
        s.projectName = name;
        s.createdAt = new Date().toISOString();
      });
      await get().save();
    },

    load: async (id) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const record = await loadProject(id);
        if (!record) throw new Error(`Project ${id} not found`);

        const serialized = record.data as SerializedProject;

        const deserialized = await deserializeProject(serialized, (audioId) =>
          loadAudioFile(audioId)
        );

        applyToDAWStore(deserialized);

        set((s) => {
          s.projectId = id;
          s.projectName = record.name;
          s.createdAt = record.createdAt;
          s.isDirty = false;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.isLoading = false;
          s.error = String(err);
        });
        throw err;
      }
    },

    newProject: () => {
      useDAWStore.setState((s) => {
        // Reset everything to defaults
        s.project = { bpm: 120, timeSignature: { numerator: 4, denominator: 4 }, sampleRate: 44100, bufferSize: 256 };
        s.tracks = [];
        s.markers = [];
        s.transport = { state: 'stopped', position: 0, loopEnabled: false, loopStart: 0, loopEnd: 16, metronomeEnabled: false, countInEnabled: false };
        s.masterVolume = 1.0;
        s.masterLimiterEnabled = true;
      });
      set((s) => {
        s.projectId = generateId();
        s.projectName = 'Untitled Project';
        s.createdAt = new Date().toISOString();
        s.isDirty = false;
        s.error = null;
      });
    },

    deleteProject: async (id) => {
      await deleteProject(id);
      if (get().projectId === id) {
        get().newProject();
      }
      await get().refreshProjectList();
    },

    refreshProjectList: async () => {
      const projects = await listProjects();
      const sorted = [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      set((s) => { s.savedProjects = sorted; });
    },

    exportTraxFile: async () => {
      const { projectId, projectName, createdAt } = get();
      const dawState = useDAWStore.getState();

      const serialized = serializeProject(dawState, projectName, createdAt);

      const bundle = await buildTraxBundle(serialized, async (id) => {
        // Try IDB first, then fall back to re-encoding from AudioBuffer
        const stored = await loadAudioFile(id);
        if (stored) return stored;

        // Re-encode the AudioBuffer if not in IDB
        const track = dawState.tracks.find((t) => t.clips.some((c) => c.id === id));
        const clip = track?.clips.find((c) => c.id === id);
        if (!clip?.audioBuffer) return undefined;
        return encodeAudioBuffer(clip.audioBuffer);
      });

      const blob = new Blob([bundle], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilename(projectName)}.trax`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importTraxFile: async (file) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const text = await file.text();
        const { serialized, audioFiles } = parseTraxBundle(text);

        // Store extracted audio files into IDB
        for (const [id, ab] of Object.entries(audioFiles)) {
          await saveAudioFile(id, ab);
        }

        const deserialized = await deserializeProject(serialized, async (id) => {
          return audioFiles[id] ?? loadAudioFile(id);
        });

        applyToDAWStore(deserialized);

        set((s) => {
          s.projectId = generateId();
          s.projectName = serialized.name;
          s.createdAt = serialized.createdAt;
          s.isDirty = true;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.isLoading = false;
          s.error = String(err);
        });
        throw err;
      }
    },
  }))
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function persistAudioFiles(
  tracks: Track[],
  serialized: SerializedProject
): Promise<void> {
  for (const track of tracks) {
    for (const clip of track.clips) {
      if (!clip.audioBuffer || !serialized.audioFileIds.includes(clip.id)) continue;
      const ab = await encodeAudioBuffer(clip.audioBuffer);
      await saveAudioFile(clip.id, ab);
    }
  }
}

/** Encode an AudioBuffer to a WAV ArrayBuffer */
function encodeAudioBuffer(buffer: AudioBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const numChannels = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sr * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const ab = new ArrayBuffer(bufferSize);
    const view = new DataView(ab);

    const write = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };
    write(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    write(8, 'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    write(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let s = 0; s < numSamples; s++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[s]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    resolve(ab);
  });
}

function applyToDAWStore(data: {
  project: import('@/types').ProjectSettings;
  tracks: Track[];
  markers: import('@/types').Marker[];
  transport: { loopEnabled: boolean; loopStart: number; loopEnd: number; metronomeEnabled: boolean };
  masterVolume: number;
  masterLimiterEnabled: boolean;
}): void {
  useDAWStore.setState((s) => {
    s.project = data.project;
    s.tracks = data.tracks;
    s.markers = data.markers;
    s.transport.loopEnabled = data.transport.loopEnabled;
    s.transport.loopStart = data.transport.loopStart;
    s.transport.loopEnd = data.transport.loopEnd;
    s.transport.metronomeEnabled = data.transport.metronomeEnabled;
    s.transport.state = 'stopped';
    s.transport.position = 0;
    s.masterVolume = data.masterVolume;
    s.masterLimiterEnabled = data.masterLimiterEnabled;
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-. ]/gi, '_').slice(0, 80);
}

// ─── Auto-save: mark dirty on any DAW store change ───────────────────────────

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

useDAWStore.subscribe(() => {
  // Don't mark dirty during load
  if (useProjectStore.getState().isLoading) return;

  useProjectStore.getState().markDirty();

  // Debounced auto-save (30 seconds after last change)
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    // Only auto-save if the project has been saved before (has a matching IDB record)
    const { projectId, savedProjects } = useProjectStore.getState();
    const exists = savedProjects.some((p) => p.id === projectId);
    if (exists) {
      await useProjectStore.getState().save();
    }
  }, 30_000);
});
