import type { Track, Marker, ProjectSettings } from '@/types';
import { useDAWStore } from './daw-store';

const MAX_HISTORY = 50;

export interface DAWHistorySnapshot {
  project: ProjectSettings;
  tracks: Track[];
  markers: Marker[];
  masterVolume: number;
  masterLimiterEnabled: boolean;
  transport: {
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    metronomeEnabled: boolean;
  };
}

function cloneTracks(tracks: Track[]): Track[] {
  return tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => ({ ...c })),
    effects: structuredClone(t.effects),
    sends: [...t.sends],
  }));
}

export function captureSnapshot(): DAWHistorySnapshot {
  const s = useDAWStore.getState();
  return {
    project: { ...s.project, timeSignature: { ...s.project.timeSignature } },
    tracks: cloneTracks(s.tracks),
    markers: structuredClone(s.markers),
    masterVolume: s.masterVolume,
    masterLimiterEnabled: s.masterLimiterEnabled,
    transport: {
      loopEnabled: s.transport.loopEnabled,
      loopStart: s.transport.loopStart,
      loopEnd: s.transport.loopEnd,
      metronomeEnabled: s.transport.metronomeEnabled,
    },
  };
}

export function applySnapshot(snapshot: DAWHistorySnapshot): void {
  useDAWStore.setState((s) => {
    s.project = { ...snapshot.project, timeSignature: { ...snapshot.project.timeSignature } };
    s.tracks = cloneTracks(snapshot.tracks);
    s.markers = structuredClone(snapshot.markers);
    s.masterVolume = snapshot.masterVolume;
    s.masterLimiterEnabled = snapshot.masterLimiterEnabled;
    s.transport.loopEnabled = snapshot.transport.loopEnabled;
    s.transport.loopStart = snapshot.transport.loopStart;
    s.transport.loopEnd = snapshot.transport.loopEnd;
    s.transport.metronomeEnabled = snapshot.transport.metronomeEnabled;
  });
}

let past: DAWHistorySnapshot[] = [];
let future: DAWHistorySnapshot[] = [];
let listeners = new Set<() => void>();
let applyingHistory = false;
let gestureSnapshot: DAWHistorySnapshot | null = null;

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canUndo(): boolean {
  return past.length > 0;
}

export function canRedo(): boolean {
  return future.length > 0;
}

export function pushHistory(): void {
  past.push(captureSnapshot());
  if (past.length > MAX_HISTORY) past.shift();
  future = [];
  notify();
}

export function undo(): boolean {
  if (past.length === 0) return false;
  future.push(captureSnapshot());
  const prev = past.pop()!;
  runWithoutHistory(() => applySnapshot(prev));
  notify();
  return true;
}

export function redo(): boolean {
  if (future.length === 0) return false;
  past.push(captureSnapshot());
  const next = future.pop()!;
  runWithoutHistory(() => applySnapshot(next));
  notify();
  return true;
}

export function clearHistory(): void {
  past = [];
  future = [];
  notify();
}

/** Call before a mutating DAW action. Skips if we're applying undo/redo or mid-gesture. */
export function withHistory(mutate: () => void): void {
  if (applyingHistory || gestureSnapshot) {
    mutate();
    return;
  }
  pushHistory();
  mutate();
}

export function runWithoutHistory(mutate: () => void): void {
  applyingHistory = true;
  try {
    mutate();
  } finally {
    applyingHistory = false;
  }
}

export function beginGesture(): void {
  if (gestureSnapshot) return;
  gestureSnapshot = captureSnapshot();
}

export function endGesture(): void {
  if (!gestureSnapshot) return;
  past.push(gestureSnapshot);
  if (past.length > MAX_HISTORY) past.shift();
  future = [];
  gestureSnapshot = null;
  notify();
}

export function mutateWithoutHistory(mutate: () => void): void {
  runWithoutHistory(mutate);
}
