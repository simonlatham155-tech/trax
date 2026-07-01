import { useEffect, useState, useSyncExternalStore } from 'react';
import { canUndo, canRedo, subscribeHistory } from '@/store/history';

function subscribe(callback: () => void): () => void {
  return subscribeHistory(callback);
}

function getUndoSnapshot(): boolean {
  return canUndo();
}

function getRedoSnapshot(): boolean {
  return canRedo();
}

export function useHistoryState(): { canUndo: boolean; canRedo: boolean } {
  const undoAvailable = useSyncExternalStore(subscribe, getUndoSnapshot, getUndoSnapshot);
  const redoAvailable = useSyncExternalStore(subscribe, getRedoSnapshot, getRedoSnapshot);
  return { canUndo: undoAvailable, canRedo: redoAvailable };
}

/** Re-render when history stack changes (for components not using useSyncExternalStore). */
export function useHistoryListener(): void {
  const [, setTick] = useState(0);
  useEffect(() => subscribeHistory(() => setTick((n) => n + 1)), []);
}
