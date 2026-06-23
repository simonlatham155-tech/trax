export type TrackType = 'audio' | 'midi' | 'bus';
export type TrackColor = 'purple' | 'cyan' | 'green' | 'amber' | 'red' | 'pink' | 'blue';

export interface MidiNote {
  id: string;
  pitch: number;       // MIDI note number 0-127
  startBeat: number;   // relative to clip start
  durationBeats: number;
  velocity: number;    // 0-127
}

export interface Clip {
  id: string;
  trackId: string;
  startBeat: number;
  durationBeats: number;
  name: string;
  color: string;
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
  gain: number;
  fadeIn: number;
  fadeOut: number;
  notes?: MidiNote[];  // MIDI clips carry notes
}

export interface EQBand {
  id: string;
  type: BiquadFilterType;
  freq: number;
  gain: number;
  q: number;
  enabled: boolean;
}

export interface TrackEffects {
  eq: {
    enabled: boolean;
    bands: EQBand[];
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
    makeupGain: number;
  };
  reverb: {
    enabled: boolean;
    wet: number;
    decay: number;
    preDelay: number;
  };
  delay: {
    enabled: boolean;
    wet: number;
    time: number;
    feedback: number;
  };
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: TrackColor;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  height: number;
  clips: Clip[];
  effects: TrackEffects;
  sends: { busId: string; level: number }[];
  instrument?: string;  // instrument preset ID for midi tracks
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface ProjectSettings {
  bpm: number;
  timeSignature: TimeSignature;
  sampleRate: number;
  bufferSize: number;
}

export type TransportState = 'stopped' | 'playing' | 'recording' | 'paused';

export interface Marker {
  id: string;
  beat: number;
  label: string;
  color: string;
}

export const TRACK_COLORS: Record<TrackColor, string> = {
  purple: '#6c63ff',
  cyan: '#06b6d4',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  blue: '#3b82f6',
};

export const DEFAULT_EFFECTS: TrackEffects = {
  eq: {
    enabled: false,
    bands: [
      { id: 'lf', type: 'highshelf', freq: 80, gain: 0, q: 0.7, enabled: true },
      { id: 'lmf', type: 'peaking', freq: 250, gain: 0, q: 1.0, enabled: true },
      { id: 'hmf', type: 'peaking', freq: 2500, gain: 0, q: 1.0, enabled: true },
      { id: 'hf', type: 'highshelf', freq: 10000, gain: 0, q: 0.7, enabled: true },
    ],
  },
  compressor: {
    enabled: false,
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    knee: 30,
    makeupGain: 0,
  },
  reverb: {
    enabled: false,
    wet: 0.3,
    decay: 2.0,
    preDelay: 0.02,
  },
  delay: {
    enabled: false,
    wet: 0.25,
    time: 0.25,
    feedback: 0.4,
  },
};
