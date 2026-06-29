"""
Scans the local filesystem for VST3, VST2, and AU plugin bundles.
Returns structured metadata for each discovered plugin.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def _default_search_paths() -> list[tuple[str, str]]:
    """Return [(path, format)] for all standard plugin dirs on this OS."""
    home = Path.home()
    plat = sys.platform

    if plat == "darwin":
        return [
            (str(home / "Library/Audio/Plug-Ins/VST3"), "VST3"),
            ("/Library/Audio/Plug-Ins/VST3", "VST3"),
            (str(home / "Library/Audio/Plug-Ins/VST"), "VST2"),
            ("/Library/Audio/Plug-Ins/VST", "VST2"),
            (str(home / "Library/Audio/Plug-Ins/Components"), "AU"),
            ("/Library/Audio/Plug-Ins/Components", "AU"),
        ]

    if plat == "win32":
        pf  = os.environ.get("ProgramFiles", r"C:\Program Files")
        pf86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
        local = os.environ.get("LOCALAPPDATA", str(home / "AppData" / "Local"))
        return [
            (os.path.join(pf,   "Common Files", "VST3"), "VST3"),
            (os.path.join(pf86, "Common Files", "VST3"), "VST3"),
            (os.path.join(local, "Programs", "Common", "VST3"), "VST3"),
            (os.path.join(pf,   "VSTPlugins"), "VST2"),
            (os.path.join(pf86, "VSTPlugins"), "VST2"),
            (os.path.join(pf,   "Steinberg", "VSTPlugins"), "VST2"),
        ]

    # Linux
    return [
        (str(home / ".vst3"), "VST3"),
        ("/usr/lib/vst3", "VST3"),
        ("/usr/local/lib/vst3", "VST3"),
        (str(home / ".vst"), "VST2"),
        ("/usr/lib/vst", "VST2"),
        ("/usr/local/lib/vst", "VST2"),
    ]


def _vst3_metadata(bundle_path: str) -> dict:
    """Try to read moduleinfo.json inside a VST3 bundle."""
    info_path = os.path.join(bundle_path, "Contents", "moduleinfo.json")
    name = Path(bundle_path).stem
    try:
        if os.path.exists(info_path):
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
            classes = info.get("Classes", [{}])
            first = classes[0] if classes else {}
            return {
                "name": first.get("Name") or info.get("Name") or name,
                "vendor": first.get("Vendor") or info.get("Vendor") or "Unknown",
                "category": (first.get("SubCategories") or ["Instrument"])[0],
                "uid": first.get("UID") or "",
            }
    except Exception:
        pass
    return {"name": name, "vendor": "Unknown", "category": "Instrument", "uid": ""}


def _scan_dir(directory: str, fmt: str, seen: set) -> list[dict]:
    results = []
    if not os.path.isdir(directory):
        return results

    try:
        entries = os.listdir(directory)
    except PermissionError:
        return results

    for entry in entries:
        full = os.path.join(directory, entry)
        lower = entry.lower()

        if fmt == "VST3" and lower.endswith(".vst3"):
            if full in seen:
                continue
            seen.add(full)
            meta = _vst3_metadata(full)
            results.append({**meta, "path": full, "format": "VST3"})
            continue

        if fmt == "VST2" and (lower.endswith(".dll") or lower.endswith(".vst")):
            if full in seen:
                continue
            seen.add(full)
            results.append({
                "name": Path(entry).stem,
                "vendor": "Unknown",
                "category": "Instrument",
                "uid": "",
                "path": full,
                "format": "VST2",
            })
            continue

        if fmt == "AU" and lower.endswith(".component"):
            if full in seen:
                continue
            seen.add(full)
            results.append({
                "name": Path(entry).stem,
                "vendor": "Unknown",
                "category": "Instrument",
                "uid": "",
                "path": full,
                "format": "AU",
            })
            continue

        # Recurse one level into plain subdirs
        try:
            if (os.path.isdir(full)
                    and not lower.endswith(".vst3")
                    and not lower.endswith(".component")):
                results.extend(_scan_dir(full, fmt, seen))
        except Exception:
            pass

    return results


def scan_plugins(extra_paths: Optional[list[str]] = None) -> list[dict]:
    """
    Scan all standard VST directories plus any extra_paths supplied by the user.
    Returns a list of plugin dicts: {name, vendor, category, uid, path, format}.
    """
    seen: set[str] = set()
    results: list[dict] = []

    search = _default_search_paths()
    for ep in (extra_paths or []):
        search.append((ep, "VST3"))
        search.append((ep, "VST2"))
        if sys.platform == "darwin":
            search.append((ep, "AU"))

    for path, fmt in search:
        found = _scan_dir(path, fmt, seen)
        results.extend(found)
        if found:
            logger.debug("Scanned %s → %d plugins", path, len(found))

    return results
