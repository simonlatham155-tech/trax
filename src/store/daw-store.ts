import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Track,
  Clip,
  TrackColor,
  TransportState,
  ProjectSettings,
  Marker,
  TrackEffects,
  EditTool,
  MidiNote,
} from '@/types';
import { generateId } from '@/utils/id';
import { DEFAULT_EFFECTS, TRACK_COLORS } from '@/types';

const TRACK_COLOR_CYCLE: TrackColor[] = [
  'purple', 'cyan', 'green', 'amber', 'red', 'pink', 'blue',
];

function makeDefaultTrack(index: number, type: Track['type'] = 'audio'): Track {
  const color = TRACK_COLOR_CYCLE[index % TRACK_COLOR_CYCLE.length];
  return {
    id: generateId(),
    name: `Track ${index + 1}`,
    type,
    color,
    volume: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    height: 90,
    clips: [],
    effects: structuredClone(DEFAULT_EFFECTS),
    sends: [],
  };
}

interface UIState {
  selectedTrackId: string | null;
  selectedClipId: string | null;
  openEffectsTrackId: string | null;
  pianoRollClipId: string | null;    // which clip is open in piano roll
  showMixer: boolean;
  showPianoRoll: boolean;
  tool: EditTool;
  zoom: number;
  scrollX: number;
  scrollY: number;
  snapEnabled: boolean;
  snapGrid: number;
  gridSize: number;
}

interface DAWState {
  project: ProjectSettings;
  tracks: Track[];
  markers: Marker[];
  transport: {
    state: TransportState;
    position: number;
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    metronomeEnabled: boolean;
    countInEnabled: boolean;
  };
  ui: UIState;
  masterVolume: number;
  masterLimiterEnabled: boolean;

  // Transport actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  record: () => void;
  setPosition: (beat: number) => void;
  toggleLoop: () => void;
  setLoopRange: (start: number, end: number) => void;
  toggleMetronome: () => void;
  setBpm: (bpm: number) => void;

  // Track actions
  addTrack: (type?: Track['type']) => void;
  removeTrack: (id: string) => void;
  duplicateTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackPan: (id: string, pan: number) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  toggleArm: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Clip actions
  addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => string;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, patch: Partial<Clip>) => void;
  moveClip: (clipId: string, fromTrackId: string, toTrackId: string, startBeat: number) => void;

  // Effects actions
  updateEffects: (trackId: string, effects: Partial<TrackEffects>) => void;

  // Instrument / VST assignment
  setTrackInstrument: (trackId: string, instrument: string | undefined) => void;

  // MIDI note actions
  addMidiNote: (trackId: string, clipId: string, note: Omit<MidiNote, 'id'>) => string;
  updateMidiNote: (trackId: string, clipId: string, noteId: string, patch: Partial<MidiNote>) => void;
  removeMidiNote: (trackId: string, clipId: string, noteId: string) => void;
  setMidiNotes: (trackId: string, clipId: string, notes: MidiNote[]) => void;

  // Tool
  setTool: (tool: EditTool) => void;

  // Piano roll
  openPianoRoll: (clipId: string | null) => void;

  // UI actions
  selectTrack: (id: string | null) => void;
  selectClip: (id: string | null) => void;
  openEffects: (trackId: string | null) => void;
  toggleMixer: () => void;
  setZoom: (zoom: number) => void;
  setScroll: (x: number, y: number) => void;
  toggleSnap: () => void;
  setSnapGrid: (grid: number) => void;
  setMasterVolume: (v: number) => void;
}

export const useDAWStore = create<DAWState>()(
  immer((set) => ({
    project: {
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      sampleRate: 44100,
      bufferSize: 256,
    },
    tracks: [
      makeDefaultTrack(0),
      makeDefaultTrack(1, 'audio'),
      makeDefaultTrack(2, 'audio'),
    ],
    markers: [],
    transport: {
      state: 'stopped',
      position: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 16,
      metronomeEnabled: false,
      countInEnabled: false,
    },
    ui: {
      selectedTrackId: null,
      selectedClipId: null,
      openEffectsTrackId: null,
      pianoRollClipId: null,
      showMixer: false,
      showPianoRoll: false,
      tool: 'pointer',
      zoom: 60,
      scrollX: 0,
      scrollY: 0,
      snapEnabled: true,
      snapGrid: 0.25,
      gridSize: 1,
    },
    masterVolume: 1.0,
    masterLimiterEnabled: true,

    play: () =>
      set((s) => {
        s.transport.state = 'playing';
      }),
    pause: () =>
      set((s) => {
        if (s.transport.state === 'playing') s.transport.state = 'paused';
      }),
    stop: () =>
      set((s) => {
        s.transport.state = 'stopped';
        s.transport.position = 0;
      }),
    record: () =>
      set((s) => {
        s.transport.state = 'recording';
      }),
    setPosition: (beat) =>
      set((s) => {
        s.transport.position = Math.max(0, beat);
      }),
    toggleLoop: () =>
      set((s) => {
        s.transport.loopEnabled = !s.transport.loopEnabled;
      }),
    setLoopRange: (start, end) =>
      set((s) => {
        s.transport.loopStart = start;
        s.transport.loopEnd = end;
      }),
    toggleMetronome: () =>
      set((s) => {
        s.transport.metronomeEnabled = !s.transport.metronomeEnabled;
      }),
    setBpm: (bpm) =>
      set((s) => {
        s.project.bpm = Math.max(20, Math.min(300, bpm));
      }),

    addTrack: (type = 'audio') =>
      set((s) => {
        s.tracks.push(makeDefaultTrack(s.tracks.length, type));
      }),
    removeTrack: (id) =>
      set((s) => {
        s.tracks = s.tracks.filter((t) => t.id !== id);
      }),
    duplicateTrack: (id) =>
      set((s) => {
        const src = s.tracks.find((t) => t.id === id);
        if (!src) return;
        const clone = structuredClone(src);
        clone.id = generateId();
        clone.name = `${src.name} copy`;
        clone.clips = clone.clips.map((c) => ({ ...c, id: generateId() }));
        const idx = s.tracks.findIndex((t) => t.id === id);
        s.tracks.splice(idx + 1, 0, clone);
      }),
    updateTrack: (id, patch) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) Object.assign(t, patch);
      }),
    setTrackVolume: (id, volume) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) t.volume = Math.max(0, Math.min(1.5, volume));
      }),
    setTrackPan: (id, pan) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) t.pan = Math.max(-1, Math.min(1, pan));
      }),
    toggleMute: (id) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) t.muted = !t.muted;
      }),
    toggleSolo: (id) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) t.soloed = !t.soloed;
      }),
    toggleArm: (id) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === id);
        if (t) t.armed = !t.armed;
      }),
    reorderTracks: (fromIndex, toIndex) =>
      set((s) => {
        const [removed] = s.tracks.splice(fromIndex, 1);
        s.tracks.splice(toIndex, 0, removed);
      }),

    addClip: (trackId, clipData) => {
      const id = generateId();
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        if (t) t.clips.push({ ...clipData, id, trackId });
      });
      return id;
    },
    removeClip: (trackId, clipId) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        if (t) t.clips = t.clips.filter((c) => c.id !== clipId);
      }),
    updateClip: (trackId, clipId, patch) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        const c = t?.clips.find((c) => c.id === clipId);
        if (c) Object.assign(c, patch);
      }),
    moveClip: (clipId, fromTrackId, toTrackId, startBeat) =>
      set((s) => {
        const fromTrack = s.tracks.find((t) => t.id === fromTrackId);
        const toTrack = s.tracks.find((t) => t.id === toTrackId);
        if (!fromTrack || !toTrack) return;
        const clipIdx = fromTrack.clips.findIndex((c) => c.id === clipId);
        if (clipIdx === -1) return;
        const [clip] = fromTrack.clips.splice(clipIdx, 1);
        clip.trackId = toTrackId;
        clip.startBeat = startBeat;
        toTrack.clips.push(clip);
      }),

    updateEffects: (trackId, effects) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        if (t) Object.assign(t.effects, effects);
      }),

    setTrackInstrument: (trackId, instrument) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        if (t) t.instrument = instrument;
      }),

    addMidiNote: (trackId, clipId, noteData) => {
      const id = generateId();
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        const c = t?.clips.find((c) => c.id === clipId);
        if (c) {
          if (!c.notes) c.notes = [];
          c.notes.push({ ...noteData, id });
        }
      });
      return id;
    },
    updateMidiNote: (trackId, clipId, noteId, patch) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        const c = t?.clips.find((c) => c.id === clipId);
        const n = c?.notes?.find((n) => n.id === noteId);
        if (n) Object.assign(n, patch);
      }),
    removeMidiNote: (trackId, clipId, noteId) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        const c = t?.clips.find((c) => c.id === clipId);
        if (c?.notes) c.notes = c.notes.filter((n) => n.id !== noteId);
      }),
    setMidiNotes: (trackId, clipId, notes) =>
      set((s) => {
        const t = s.tracks.find((t) => t.id === trackId);
        const c = t?.clips.find((c) => c.id === clipId);
        if (c) c.notes = notes;
      }),

    setTool: (tool) =>
      set((s) => { s.ui.tool = tool; }),

    openPianoRoll: (clipId) =>
      set((s) => {
        s.ui.pianoRollClipId = clipId;
        s.ui.showPianoRoll = clipId !== null;
      }),

    selectTrack: (id) =>
      set((s) => {
        s.ui.selectedTrackId = id;
      }),
    selectClip: (id) =>
      set((s) => {
        s.ui.selectedClipId = id;
      }),
    openEffects: (trackId) =>
      set((s) => {
        s.ui.openEffectsTrackId = trackId;
      }),
    toggleMixer: () =>
      set((s) => {
        s.ui.showMixer = !s.ui.showMixer;
      }),
    setZoom: (zoom) =>
      set((s) => {
        s.ui.zoom = Math.max(20, Math.min(300, zoom));
      }),
    setScroll: (x, y) =>
      set((s) => {
        s.ui.scrollX = Math.max(0, x);
        s.ui.scrollY = Math.max(0, y);
      }),
    toggleSnap: () =>
      set((s) => {
        s.ui.snapEnabled = !s.ui.snapEnabled;
      }),
    setSnapGrid: (grid) =>
      set((s) => {
        s.ui.snapGrid = grid;
      }),

    setMasterVolume: (v) =>
      set((s) => {
        s.masterVolume = Math.max(0, Math.min(1.5, v));
      }),
  }))
);
