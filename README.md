# TRAX — Online DAW

A professional-grade Digital Audio Workstation that runs entirely in the browser. No plugins, no installation, no server costs.

## Features

- **Multi-track arrangement** — unlimited audio tracks with drag-to-place clips
- **Transport** — play, pause, stop, record-arm; keyboard shortcut (`Space`)
- **BPM & time signature** — click BPM display to edit; full beat/bar position readout
- **Loop region** — toggle loop, set loop in/out points on the timeline
- **Metronome** — click-track generated with WebAudio, synced to playhead
- **Per-track mixing** — volume fader, stereo pan knob, mute, solo
- **Effects chain** per track
  - 4-band parametric EQ
  - Dynamics compressor (threshold, ratio, attack, release, makeup gain)
  - Convolution reverb (wet, decay, pre-delay)
  - Feedback delay (wet, time, feedback)
- **Mixer panel** — vertical channel strips with pan knobs and faders
- **Timeline** — zoomable arrangement view, bar/beat grid, waveform clips, playhead scrubbing
- **Drag & drop audio** — drop `.wav`, `.mp3`, `.ogg`, `.flac` etc. onto the window to create tracks
- **Import audio** — per-track import button for loading audio files
- **Dark theme** — fully dark VST-inspired UI

## Stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand (immer middleware) |
| Audio | Web Audio API (native, zero dependencies) |
| Icons | Lucide React |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Architecture

```
src/
├── engine/
│   └── audio-engine.ts       # WebAudio playback engine + metronome scheduler
├── store/
│   └── daw-store.ts          # Zustand store — all project state
├── types/
│   └── index.ts              # Track, Clip, Effects, etc.
├── components/
│   ├── transport/
│   │   └── Transport.tsx     # Top bar: play/stop/record/BPM/loop
│   ├── track/
│   │   ├── TrackList.tsx     # Left panel: list of track headers
│   │   └── TrackHeader.tsx   # Per-track controls: vol, pan, mute, solo, arm
│   ├── timeline/
│   │   └── Timeline.tsx      # Arrangement view with ruler, clips, playhead
│   ├── mixer/
│   │   └── Mixer.tsx         # Bottom mixer panel with channel strips
│   ├── effects/
│   │   └── EffectsPanel.tsx  # Right panel: EQ, compressor, reverb, delay
│   └── common/
│       ├── Knob.tsx          # Rotary knob component (drag to control)
│       └── VuMeter.tsx       # Canvas-based level meter
└── utils/
    ├── beats.ts              # Beat ↔ seconds conversion, time formatting
    ├── id.ts                 # ID generation
    └── cn.ts                 # Tailwind class merge utility
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Home` | Stop + Return to start |

## Roadmap

- [ ] MIDI sequencer / piano roll
- [ ] Sample browser
- [ ] Waveform rendering in clips
- [ ] Tempo automation
- [ ] Undo / redo
- [ ] Project save / load (IndexedDB)
- [ ] Audio recording from microphone
- [ ] Export mix to WAV / MP3
- [ ] Plugin host (WebAssembly / AudioWorklet)

## License

Proprietary — © LathamAudio
