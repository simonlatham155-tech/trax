#!/usr/bin/env python3
"""
TRAX VST Bridge Server
A local WebSocket server that gives the TRAX web app access to native
VST3/VST2/AU plugins installed on this machine.

Usage:
    python3 bridge/server.py [--port 7899] [--host 127.0.0.1]

Protocol (JSON over WebSocket):
    Browser → Bridge
        { "type": "ping" }
        { "type": "scan", "extra_paths": [] }
        { "type": "load",   "track_id": "...", "path": "..." }
        { "type": "unload", "track_id": "..." }
        { "type": "render", "track_id": "...", "notes": [...],
                            "bpm": 120, "duration_beats": 8, "volume": 1.0 }
        { "type": "get_params",  "track_id": "..." }
        { "type": "set_param",   "track_id": "...", "name": "...", "value": 0.5 }

    Bridge → Browser
        { "type": "pong", "version": "1.0.0" }
        { "type": "scan_result", "plugins": [{name,vendor,category,path,format},...] }
        { "type": "loaded",    "track_id": "...", "success": true, "name": "..." }
        { "type": "unloaded",  "track_id": "..." }
        { "type": "rendered",  "track_id": "...", "audio_b64": "...",
                               "sample_rate": 44100, "channels": 2, "num_samples": N }
        { "type": "params",    "track_id": "...", "params": [{name,value},...] }
        { "type": "param_set", "track_id": "...", "name": "...", "success": true }
        { "type": "error",     "track_id": "...", "message": "..." }
"""

import asyncio
import json
import logging
import argparse
import signal
import sys
from pathlib import Path

import websockets

from vst_scanner import scan_plugins
from vst_host import VSTHost

VERSION = "1.0.0"
DEFAULT_PORT = 7899
DEFAULT_HOST = "127.0.0.1"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("trax-bridge")

host_instance = VSTHost()
connected_clients: set = set()


# ── Message handlers ──────────────────────────────────────────────────────────

async def handle_ping(_msg: dict, _ws) -> dict:
    return {"type": "pong", "version": VERSION, "ready": True}


async def handle_scan(msg: dict, _ws) -> dict:
    extra = msg.get("extra_paths", [])
    logger.info("Scanning for plugins (extra_paths=%s)…", extra)
    loop = asyncio.get_event_loop()
    plugins = await loop.run_in_executor(None, lambda: scan_plugins(extra_paths=extra))
    logger.info("Found %d plugins", len(plugins))
    return {"type": "scan_result", "plugins": plugins}


async def handle_load(msg: dict, _ws) -> dict:
    track_id = msg.get("track_id", "")
    path = msg.get("path", "")
    if not path:
        return {"type": "error", "track_id": track_id, "message": "Missing plugin path"}
    logger.info("Loading plugin '%s' for track '%s'", path, track_id)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: host_instance.load(track_id, path))
    return {"type": "loaded", "track_id": track_id, **result}


async def handle_unload(msg: dict, _ws) -> dict:
    track_id = msg.get("track_id", "")
    host_instance.unload(track_id)
    return {"type": "unloaded", "track_id": track_id}


async def handle_render(msg: dict, _ws) -> dict:
    track_id = msg.get("track_id", "")
    notes = msg.get("notes", [])
    bpm = float(msg.get("bpm", 120))
    duration_beats = float(msg.get("duration_beats", 4))
    volume = float(msg.get("volume", 1.0))

    logger.info(
        "Rendering %d notes, %.1f beats @ %.1f BPM for track '%s'",
        len(notes), duration_beats, bpm, track_id,
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: host_instance.render_midi(track_id, notes, bpm, duration_beats, volume),
    )

    if "error" in result:
        return {"type": "error", "track_id": track_id, "message": result["error"]}

    return {"type": "rendered", "track_id": track_id, **result}


async def handle_get_params(msg: dict, _ws) -> dict:
    track_id = msg.get("track_id", "")
    params = host_instance.get_parameters(track_id)
    return {"type": "params", "track_id": track_id, "params": params}


async def handle_set_param(msg: dict, _ws) -> dict:
    track_id = msg.get("track_id", "")
    name = msg.get("name", "")
    value = float(msg.get("value", 0))
    success = host_instance.set_parameter(track_id, name, value)
    return {"type": "param_set", "track_id": track_id, "name": name, "success": success}


HANDLERS = {
    "ping":       handle_ping,
    "scan":       handle_scan,
    "load":       handle_load,
    "unload":     handle_unload,
    "render":     handle_render,
    "get_params": handle_get_params,
    "set_param":  handle_set_param,
}


# ── WebSocket connection handler ──────────────────────────────────────────────

async def connection_handler(ws):
    addr = ws.remote_address
    logger.info("Client connected: %s", addr)
    connected_clients.add(ws)

    # Send a welcome message so the browser knows it's the right server
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
            handler = HANDLERS.get(msg_type)

            if handler is None:
                await ws.send(json.dumps({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type!r}",
                }))
                continue

            try:
                response = await handler(msg, ws)
                await ws.send(json.dumps(response))
            except Exception as exc:
                logger.exception("Handler %s failed: %s", msg_type, exc)
                await ws.send(json.dumps({
                    "type": "error",
                    "track_id": msg.get("track_id", ""),
                    "message": str(exc),
                }))

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as exc:
        logger.warning("Connection closed with error: %s", exc)
    finally:
        connected_clients.discard(ws)
        logger.info("Client disconnected: %s", addr)


# ── Startup ───────────────────────────────────────────────────────────────────

async def run_server(host: str, port: int):
    # CORS: allow all origins since this is a localhost-only service
    async with websockets.serve(
        connection_handler,
        host,
        port,
        origins=None,  # allow all origins (needed for browser → localhost)
        max_size=64 * 1024 * 1024,  # 64 MB max message (for audio payloads)
    ):
        logger.info("=" * 60)
        logger.info(" TRAX VST Bridge v%s", VERSION)
        logger.info(" Listening on  ws://%s:%d", host, port)
        logger.info(" Open TRAX in your browser and it will auto-connect.")
        logger.info("=" * 60)
        await asyncio.Future()  # run forever


def main():
    parser = argparse.ArgumentParser(description="TRAX VST Bridge Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Bind host")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Bind port")
    args = parser.parse_args()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def _shutdown(*_):
        logger.info("Shutting down…")
        loop.stop()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    try:
        loop.run_until_complete(run_server(args.host, args.port))
    except RuntimeError:
        pass
    finally:
        loop.close()


if __name__ == "__main__":
    main()
