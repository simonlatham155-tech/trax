# TRAX VST Bridge

A local WebSocket server that gives the TRAX web app access to your
native VST3, VST2, and AU plugins.

## Requirements

- Python 3.11+
- `pip install -r requirements.txt`

## Start the bridge

```bash
# From the project root:
npm run bridge

# Or directly:
python3 bridge/server.py

# Custom port:
python3 bridge/server.py --port 7899
```

The bridge listens on **ws://127.0.0.1:7899** by default.
Open TRAX in your browser — it will auto-connect and show a green bridge indicator.

## How it works

```
Browser (TRAX)  ──WebSocket──►  Bridge Server  ──pedalboard──►  VST Plugin
                ◄──audio b64──                 ◄──PCM audio──
```

1. On startup, TRAX connects to `ws://127.0.0.1:7899`
2. Click **"Add VST"** on a MIDI track → bridge scans your plugin dirs
3. Select a plugin → bridge loads it
4. On playback, TRAX sends the MIDI notes for each clip → bridge renders audio → TRAX plays it back

## Packaging as a standalone app

```bash
pip install pyinstaller
pyinstaller --onefile --name "TRAX Bridge" bridge/server.py
```

The resulting `dist/TRAX Bridge` (or `.exe` on Windows) runs without Python installed.
