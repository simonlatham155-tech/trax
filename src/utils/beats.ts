export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats / bpm) * 60;
}

export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds / 60) * bpm;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function formatBeatPosition(beat: number, numerator: number): string {
  const bar = Math.floor(beat / numerator) + 1;
  const beatInBar = Math.floor(beat % numerator) + 1;
  const subdivision = Math.floor((beat % 1) * 4) + 1;
  return `${bar}.${beatInBar}.${subdivision}`;
}

export function snapToGrid(beat: number, gridSize: number): number {
  return Math.round(beat / gridSize) * gridSize;
}
