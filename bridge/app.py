#!/usr/bin/env python3
"""
TRAX Bridge — system tray application

Runs the VST WebSocket bridge server in the background and provides
a system tray icon (Mac menu bar / Windows notification area) with:
  • Connection status indicator
  • Count of connected TRAX browser tabs
  • Quick-copy of the bridge URL
  • Quit

Entry point for both development (python3 bridge/app.py) and the
packaged Mac/Windows app produced by PyInstaller.
"""

import sys
import os
import threading
import asyncio
import logging
import webbrowser
from pathlib import Path

# ── Resolve bridge package when running as frozen executable ──────────────────
if getattr(sys, "frozen", False):
    _bridge_dir = Path(sys._MEIPASS)          # type: ignore[attr-defined]
else:
    _bridge_dir = Path(__file__).parent

if str(_bridge_dir) not in sys.path:
    sys.path.insert(0, str(_bridge_dir))

from icon import make_icon                     # noqa: E402 (after path fixup)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("trax-bridge-app")

PORT = 7899
HOST = "127.0.0.1"
BRIDGE_URL = f"ws://{HOST}:{PORT}"
WEB_URL = "http://localhost:5173"    # TRAX dev server

# ── Global state ─────────────────────────────────────────────────────────────
_client_count = 0
_server_running = False
_loop: asyncio.AbstractEventLoop | None = None


def _client_connected():
    global _client_count
    _client_count += 1
    logger.info("Client connected (%d total)", _client_count)
    _refresh_tray()


def _client_disconnected():
    global _client_count
    _client_count = max(0, _client_count - 1)
    logger.info("Client disconnected (%d remaining)", _client_count)
    _refresh_tray()


# ── Tray reference (set after creation) ───────────────────────────────────────
_tray_icon = None


def _refresh_tray():
    if _tray_icon is None:
        return
    connected = _client_count > 0
    _tray_icon.icon = make_icon(64, connected=connected)
    _tray_icon.title = _tray_title()


def _tray_title() -> str:
    if _client_count == 0:
        return "TRAX Bridge — waiting for browser"
    return f"TRAX Bridge — {_client_count} tab{'s' if _client_count != 1 else ''} connected"


# ── Server thread ─────────────────────────────────────────────────────────────

def _run_server():
    global _loop, _server_running

    import websockets
    from vst_scanner import scan_plugins
    from vst_host import VSTHost
    import json

    host = VSTHost()
    VERSION = "1.0.0"

    async def connection_handler(ws):
        global _client_count
        _client_count += 1
        logger.info("Client connected (%d total)", _client_count)
        _refresh_tray()

        await ws.send(json.dumps({
            "type": "connected",
            "version": VERSION,
            "ready": True,
        }))

        try:
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    await ws.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
                    continue

                msg_type = msg.get("type", "")
                response = await _dispatch(msg_type, msg, host, VERSION)
                await ws.send(json.dumps(response))

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            _client_count = max(0, _client_count - 1)
            logger.info("Client disconnected (%d remaining)", _client_count)
            _refresh_tray()

    async def _dispatch(msg_type, msg, host, version):
        loop = asyncio.get_event_loop()
        track_id = msg.get("track_id", "")

        if msg_type == "ping":
            return {"type": "pong", "version": version, "ready": True}

        if msg_type == "scan":
            extra = msg.get("extra_paths", [])
            plugins = await loop.run_in_executor(None, lambda: scan_plugins(extra_paths=extra))
            return {"type": "scan_result", "plugins": plugins}

        if msg_type == "load":
            path = msg.get("path", "")
            result = await loop.run_in_executor(None, lambda: host.load(track_id, path))
            return {"type": "loaded", "track_id": track_id, **result}

        if msg_type == "unload":
            host.unload(track_id)
            return {"type": "unloaded", "track_id": track_id}

        if msg_type == "render":
            notes = msg.get("notes", [])
            bpm = float(msg.get("bpm", 120))
            dur = float(msg.get("duration_beats", 4))
            vol = float(msg.get("volume", 1.0))
            result = await loop.run_in_executor(
                None, lambda: host.render_midi(track_id, notes, bpm, dur, vol)
            )
            if "error" in result:
                return {"type": "error", "track_id": track_id, "message": result["error"]}
            return {"type": "rendered", "track_id": track_id, **result}

        if msg_type == "get_params":
            params = host.get_parameters(track_id)
            return {"type": "params", "track_id": track_id, "params": params}

        if msg_type == "set_param":
            name = msg.get("name", "")
            value = float(msg.get("value", 0))
            ok = host.set_parameter(track_id, name, value)
            return {"type": "param_set", "track_id": track_id, "name": name, "success": ok}

        return {"type": "error", "message": f"Unknown type: {msg_type!r}"}

    async def serve():
        global _server_running
        async with websockets.serve(
            connection_handler,
            HOST,
            PORT,
            origins=None,
            max_size=64 * 1024 * 1024,
        ):
            _server_running = True
            logger.info("Bridge listening on %s", BRIDGE_URL)
            _refresh_tray()
            await asyncio.Future()  # run forever

    _loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_loop)
    try:
        _loop.run_until_complete(serve())
    except Exception as exc:
        logger.error("Server error: %s", exc)


# ── System tray ───────────────────────────────────────────────────────────────

def _build_menu():
    import pystray

    def open_trax(icon, item):
        webbrowser.open(WEB_URL)

    def copy_url(icon, item):
        try:
            import subprocess
            if sys.platform == "darwin":
                subprocess.run(["pbcopy"], input=BRIDGE_URL.encode(), check=True)
            elif sys.platform == "win32":
                subprocess.run(["clip"], input=BRIDGE_URL.encode(), check=True)
            else:
                subprocess.run(["xclip", "-selection", "clipboard"],
                               input=BRIDGE_URL.encode(), check=True)
        except Exception:
            pass

    def quit_app(icon, item):
        logger.info("Quitting TRAX Bridge")
        icon.stop()
        if _loop:
            _loop.call_soon_threadsafe(_loop.stop)
        sys.exit(0)

    return pystray.Menu(
        pystray.MenuItem("TRAX Bridge v1.0.0", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(
            lambda item: (
                f"● {_client_count} tab{'s' if _client_count != 1 else ''} connected"
                if _client_count > 0
                else "○ Waiting for browser…"
            ),
            None,
            enabled=False,
        ),
        pystray.MenuItem(f"Port: {PORT}", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Open TRAX in Browser", open_trax),
        pystray.MenuItem("Copy Bridge URL", copy_url),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", quit_app),
    )


def main():
    global _tray_icon

    try:
        import pystray
    except ImportError:
        # No display / headless — fall back to plain server
        logger.warning("pystray not available, running headless")
        _run_server()
        return

    # Start the WebSocket server in a background thread
    server_thread = threading.Thread(target=_run_server, daemon=True, name="bridge-server")
    server_thread.start()

    # Build the tray icon
    icon_image = make_icon(64, connected=False)

    _tray_icon = pystray.Icon(
        name="TRAX Bridge",
        icon=icon_image,
        title=_tray_title(),
        menu=_build_menu(),
    )

    logger.info("Starting TRAX Bridge tray app")
    _tray_icon.run()   # blocks on the main thread (required by most OS tray APIs)


if __name__ == "__main__":
    main()
