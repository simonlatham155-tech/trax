"""
VST plugin host using Spotify's pedalboard library.

Supports:
  - Loading VST3 / AU plugins
  - Rendering MIDI note sequences through instrument plugins
  - Processing audio through effect plugins
  - Caching loaded plugins per track
"""

import logging
import base64
import struct
import io
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

SAMPLE_RATE = 44100
CHANNELS = 2


class LoadedPlugin:
    def __init__(self, plugin, path: str, name: str):
        self.plugin = plugin
        self.path = path
        self.name = name


class VSTHost:
    def __init__(self):
        self._plugins: dict[str, LoadedPlugin] = {}  # track_id → LoadedPlugin

    # ── Load / unload ─────────────────────────────────────────────────────────

    def load(self, track_id: str, plugin_path: str) -> dict:
        """Load a plugin for a given track. Returns {success, name, error}."""
        try:
            from pedalboard import load_plugin  # type: ignore
            plugin = load_plugin(plugin_path)
            name = getattr(plugin, "name", plugin_path.split("/")[-1])
            self._plugins[track_id] = LoadedPlugin(plugin, plugin_path, name)
            logger.info("Loaded plugin '%s' for track %s", name, track_id)
            return {"success": True, "name": name}
        except Exception as exc:
            logger.error("Failed to load plugin %s: %s", plugin_path, exc)
            return {"success": False, "name": "", "error": str(exc)}

    def unload(self, track_id: str) -> None:
        self._plugins.pop(track_id, None)
        logger.info("Unloaded plugin for track %s", track_id)

    def get_plugin_name(self, track_id: str) -> Optional[str]:
        lp = self._plugins.get(track_id)
        return lp.name if lp else None

    # ── Render a MIDI clip through a plugin ───────────────────────────────────

    def render_midi(
        self,
        track_id: str,
        notes: list[dict],
        bpm: float,
        duration_beats: float,
        volume: float = 1.0,
    ) -> dict:
        """
        Render a list of MIDI notes through the loaded plugin.

        notes: [{pitch, startBeat, durationBeats, velocity}, ...]
        Returns {audio_b64, sample_rate, channels, num_samples} or {error}.
        """
        lp = self._plugins.get(track_id)
        if not lp:
            return {"error": f"No plugin loaded for track '{track_id}'"}

        try:
            duration_sec = (duration_beats / bpm) * 60.0
            num_samples = int(SAMPLE_RATE * duration_sec) + 4096  # small buffer

            midi_messages = _notes_to_pedalboard_midi(notes, bpm)

            silence = np.zeros((CHANNELS, num_samples), dtype=np.float32)

            audio = lp.plugin.process(
                silence,
                sample_rate=SAMPLE_RATE,
                midi_messages=midi_messages,
            )

            # Trim to exact length and apply volume
            audio = audio[:, :int(SAMPLE_RATE * duration_sec)] * volume

            audio_b64 = _pcm_to_wav_b64(audio, SAMPLE_RATE)
            return {
                "audio_b64": audio_b64,
                "sample_rate": SAMPLE_RATE,
                "channels": CHANNELS,
                "num_samples": audio.shape[1],
                "format": "wav",
            }

        except Exception as exc:
            logger.error("Render failed for track %s: %s", track_id, exc)
            return {"error": str(exc)}

    # ── Get plugin parameters ──────────────────────────────────────────────────

    def get_parameters(self, track_id: str) -> list[dict]:
        lp = self._plugins.get(track_id)
        if not lp:
            return []
        try:
            params = []
            for name in dir(lp.plugin):
                if name.startswith("_"):
                    continue
                try:
                    val = getattr(lp.plugin, name)
                    if isinstance(val, (int, float, bool)):
                        params.append({"name": name, "value": float(val)})
                except Exception:
                    pass
            return params
        except Exception:
            return []

    def set_parameter(self, track_id: str, name: str, value: float) -> bool:
        lp = self._plugins.get(track_id)
        if not lp:
            return False
        try:
            setattr(lp.plugin, name, value)
            return True
        except Exception:
            return False


# ── Helpers ────────────────────────────────────────────────────────────────────

def _notes_to_pedalboard_midi(notes: list[dict], bpm: float) -> list:
    """Convert note dicts to pedalboard MidiMessage list."""
    try:
        from pedalboard.midi import MidiMessage  # type: ignore
        beat_to_sec = 60.0 / bpm
        msgs = []
        for note in notes:
            start = note["startBeat"] * beat_to_sec
            end = start + note["durationBeats"] * beat_to_sec
            vel = int(note.get("velocity", 100))
            pitch = int(note["pitch"])
            msgs.append((start, MidiMessage.note_on(0, pitch, vel)))
            msgs.append((end,   MidiMessage.note_off(0, pitch, 0)))
        # Sort by time
        msgs.sort(key=lambda x: x[0])
        return [(t, m) for t, m in msgs]
    except ImportError:
        # Fallback: try alternate pedalboard MIDI API
        return _notes_fallback_midi(notes, bpm)


def _notes_fallback_midi(notes: list[dict], bpm: float) -> list:
    """Try the older pedalboard MIDI interface."""
    beat_to_sec = 60.0 / bpm
    events = []
    for note in notes:
        start_sec = note["startBeat"] * beat_to_sec
        end_sec = start_sec + note["durationBeats"] * beat_to_sec
        vel = int(note.get("velocity", 100))
        pitch = int(note["pitch"])
        # Raw MIDI bytes: [status, pitch, velocity]
        events.append({"time": start_sec, "message": [0x90, pitch, vel]})
        events.append({"time": end_sec,   "message": [0x80, pitch, 0]})
    events.sort(key=lambda e: e["time"])
    return events


def _pcm_to_wav_b64(audio: np.ndarray, sample_rate: int) -> str:
    """Encode a (channels, samples) float32 array to base64 WAV."""
    # Interleave channels
    channels, num_samples = audio.shape
    interleaved = audio.T.flatten()  # (samples * channels,)

    # Clamp to [-1, 1] and convert to int16
    clamped = np.clip(interleaved, -1.0, 1.0)
    pcm16 = (clamped * 32767).astype(np.int16)

    buf = io.BytesIO()
    _write_wav_header(buf, sample_rate, channels, num_samples)
    buf.write(pcm16.tobytes())

    return base64.b64encode(buf.getvalue()).decode("ascii")


def _write_wav_header(buf: io.BytesIO, sample_rate: int, channels: int, num_samples: int):
    bits_per_sample = 16
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    data_size = num_samples * channels * bits_per_sample // 8
    chunk_size = 36 + data_size

    buf.write(b"RIFF")
    buf.write(struct.pack("<I", chunk_size))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))           # PCM subchunk size
    buf.write(struct.pack("<H", 1))            # PCM format
    buf.write(struct.pack("<H", channels))
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", byte_rate))
    buf.write(struct.pack("<H", block_align))
    buf.write(struct.pack("<H", bits_per_sample))
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))
