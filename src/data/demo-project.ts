import type { Track, Clip, MidiNote } from '@/types';
import { DEFAULT_EFFECTS } from '@/types';
import { generateId } from '@/utils/id';

function midiBarNotes(pitch: number, bars: number, pattern: number[]): MidiNote[] {
  const notes: MidiNote[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < pattern.length; i++) {
      if (!pattern[i]) continue;
      notes.push({
        id: generateId(),
        pitch: pitch + (i % 3) * 2,
        startBeat: bar * 4 + i * 0.5,
        durationBeats: 0.45,
        velocity: 80 + (i % 4) * 10,
      });
    }
  }
  return notes;
}

function makeMidiClip(
  trackId: string,
  name: string,
  startBeat: number,
  durationBeats: number,
  color: string,
  notes: MidiNote[]
): Clip {
  return {
    id: generateId(),
    trackId,
    name,
    startBeat,
    durationBeats,
    color,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    notes,
  };
}

export function createDemoTracks(): Track[] {
  const kickId = generateId();
  const bassId = generateId();
  const leadId = generateId();
  const padId = generateId();
  const guitarId = generateId();
  const voxId = generateId();
  const busId = generateId();

  const kickClip = makeMidiClip(
    kickId,
    'Drums 01',
    0,
    16,
    '#6c63ff',
    midiBarNotes(36, 4, [1, 0, 1, 0, 1, 0, 1, 0])
  );
  const bassClip = makeMidiClip(
    bassId,
    'Bass Loop A',
    0,
    16,
    '#06b6d4',
    midiBarNotes(40, 4, [1, 0, 0, 1, 0, 0, 1, 0])
  );
  const leadClip = makeMidiClip(
    leadId,
    'Lead Hook',
    4,
    12,
    '#22c55e',
    midiBarNotes(72, 3, [1, 1, 0, 1, 0, 1, 1, 0])
  );
  const padClip = makeMidiClip(
    padId,
    'Pad Wash',
    0,
    32,
    '#f59e0b',
    midiBarNotes(60, 8, [1, 0, 0, 0, 1, 0, 0, 0])
  );

  return [
    {
      id: kickId,
      name: 'Kick & Snare',
      type: 'midi',
      color: 'purple',
      volume: 0.85,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      height: 72,
      clips: [kickClip],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Battery 5',
    },
    {
      id: bassId,
      name: 'Bass Synth',
      type: 'midi',
      color: 'cyan',
      volume: 0.8,
      pan: -0.1,
      muted: false,
      soloed: false,
      armed: false,
      height: 72,
      clips: [bassClip],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Serum 2',
    },
    {
      id: leadId,
      name: 'Synth Lead',
      type: 'midi',
      color: 'green',
      volume: 0.75,
      pan: 0.15,
      muted: false,
      soloed: false,
      armed: false,
      height: 72,
      clips: [leadClip],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Massive X',
    },
    {
      id: padId,
      name: 'Pads',
      type: 'midi',
      color: 'amber',
      volume: 0.6,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      height: 72,
      clips: [padClip],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Omnisphere 3',
    },
    {
      id: guitarId,
      name: 'Guitar DI',
      type: 'audio',
      color: 'red',
      volume: 0.7,
      pan: -0.3,
      muted: false,
      soloed: false,
      armed: false,
      height: 72,
      clips: [],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Guitar Rig 7',
    },
    {
      id: voxId,
      name: 'Lead Vocals',
      type: 'audio',
      color: 'pink',
      volume: 0.9,
      pan: 0,
      muted: false,
      soloed: false,
      armed: true,
      height: 72,
      clips: [],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
    },
    {
      id: busId,
      name: 'FX Return',
      type: 'bus',
      color: 'blue',
      volume: 0.65,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      height: 56,
      clips: [],
      effects: structuredClone(DEFAULT_EFFECTS),
      sends: [],
      instrument: 'Valhalla Reverb',
    },
  ];
}

export const DEMO_LEAD_CLIP_ID = (): string => {
  const tracks = createDemoTracks();
  const lead = tracks.find((t) => t.name === 'Synth Lead');
  return lead?.clips[0]?.id ?? '';
};
