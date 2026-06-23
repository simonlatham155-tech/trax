# TRAX Bridge

A small companion app that gives the TRAX web app access to your local
VST3, VST2, and AU plugins. Runs as a system tray app (Mac menu bar /
Windows notification area) with a WebSocket server on **ws://127.0.0.1:7899**.

---

## Download (pre-built)

Grab the latest release from the **[GitHub Releases](../../releases)** page:

| Platform | File |
|---|---|
| macOS | `TRAX-Bridge-mac.dmg` |
| Windows | `TRAX Bridge.exe` |

No Python required — everything is bundled.

---

## Run from source

```bash
pip install -r bridge/requirements.txt
python3 bridge/app.py          # system tray app
# or headless (no tray):
python3 bridge/server.py
# or via npm:
npm run bridge
```

---

## Build it yourself

### macOS
```bash
bash bridge/build_mac.sh
# → bridge-dist/mac/TRAX Bridge.dmg
```

### Windows
```bat
bridge\build_win.bat
# → bridge-dist\win\TRAX Bridge.exe
```

### Automated (GitHub Actions)
Push a tag matching `bridge-v*` to trigger a build on both platforms
and publish a GitHub Release automatically:

```bash
git tag bridge-v1.0.0
git push origin bridge-v1.0.0
```

---

## How it works

```
Browser (TRAX)  ──WebSocket──►  TRAX Bridge  ──pedalboard──►  VST Plugin
                ◄── WAV b64 ──               ◄── PCM audio ──
```

1. Launch TRAX Bridge — icon appears in menu bar / tray
2. Open TRAX in your browser — it auto-connects (green VST indicator)
3. Click **"Add VST"** on any track → Plugin Browser lists your installed plugins
4. Select a plugin → Bridge loads it in memory
5. On playback, TRAX sends MIDI notes → Bridge renders audio → TRAX plays it back

## Protocol

All messages are JSON over WebSocket.

| Browser → Bridge | Description |
|---|---|
| `{type:"scan", extra_paths:[]}` | Scan standard + custom plugin dirs |
| `{type:"load", track_id, path}` | Load a plugin for a track |
| `{type:"render", track_id, notes, bpm, duration_beats}` | Render MIDI → audio |
| `{type:"get_params", track_id}` | List plugin parameters |
| `{type:"set_param", track_id, name, value}` | Set a parameter |

| Bridge → Browser | Description |
|---|---|
| `{type:"scan_result", plugins:[...]}` | Plugin list |
| `{type:"loaded", success, name}` | Load result |
| `{type:"rendered", audio_b64, sample_rate, channels}` | WAV audio |
