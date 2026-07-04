#!/bin/bash
# ESU1808 CoreAudio fix for macOS Monterey (Big Sur+)
#
# ROOT CAUSE:
# On Catalina, coreaudiod loaded ALL plugins from /Library/Audio/Plug-Ins/HAL/
# On Monterey, coreaudiod uses IOKit notifications: it only loads a plugin when
# an IOService appears in the registry advertising IOUserClientClass = <name from
# AudioServerPlugIn_IOKitUserClients in the plugin's Info.plist>.
#
# The ESU1808 kext (PGKernelDeviceDrvESU1808) never declares IOUserClientClass
# in its personality dict, so the IOKit notification never fires, so coreaudiod
# never loads Esu1808.driver, so no audio device appears.
#
# FIX: patch the kext's Info.plist to add IOUserClientClass=ASClientDrvESU1808,
# remove the (now-invalid) code signature, and reload. SIP must be disabled.
#
# Run with: sudo bash fix_coreaudio_monterey.sh

set -euo pipefail

KEXT="/Library/Extensions/ESU1808.kext"
KEXT_ID="kr.co.egosys.esu1808.usbdriver"
PLIST="$KEXT/Contents/Info.plist"
UC_CLASS="ASClientDrvESU1808"

# ── Checks ───────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    echo "Run with sudo: sudo bash $0"
    exit 1
fi

SIP=$(csrutil status 2>/dev/null || echo "unknown")
if echo "$SIP" | grep -q "enabled"; then
    echo "ERROR: System Integrity Protection is enabled."
    echo "Boot into Recovery (hold Cmd+R), open Terminal, run: csrutil disable"
    echo "Then restart and run this script again."
    exit 1
fi

if [[ ! -f "$PLIST" ]]; then
    echo "ERROR: $PLIST not found. Run the installer first."
    exit 1
fi

echo "=== ESU1808 CoreAudio Monterey Fix ==="
echo ""

# ── Step 1: Unload kext ───────────────────────────────────────────────────────
echo "[1/6] Unloading kext (unplug ESU1808 USB cable now if connected)..."
sleep 2
kextunload -b "$KEXT_ID" 2>/dev/null || \
  kmutil unload -b "$KEXT_ID" 2>/dev/null || \
  echo "  (kext may not have been loaded — continuing)"

# ── Step 2: Patch Info.plist ──────────────────────────────────────────────────
echo "[2/6] Patching kext Info.plist to declare IOUserClientClass..."
python3 - "$PLIST" "$UC_CLASS" << 'PYEOF'
import sys, plistlib

plist_path = sys.argv[1]
uc_class   = sys.argv[2]

with open(plist_path, 'rb') as f:
    d = plistlib.load(f)

personalities = d.get('IOKitPersonalities', {})
if not personalities:
    print("  ERROR: no IOKitPersonalities found", file=sys.stderr)
    sys.exit(1)

changed = False
for name, p in personalities.items():
    if p.get('IOUserClientClass') != uc_class:
        p['IOUserClientClass'] = uc_class
        print(f"  Set IOUserClientClass={uc_class} in personality '{name}'")
        changed = True
    else:
        print(f"  Personality '{name}' already has IOUserClientClass={uc_class}")

if changed:
    with open(plist_path, 'wb') as f:
        plistlib.dump(d, f)
    print("  Info.plist saved.")
PYEOF

# ── Step 3: Remove (now-invalid) code signature ───────────────────────────────
echo "[3/6] Removing invalidated code signature..."
codesign --remove-signature "$KEXT" 2>/dev/null && \
  echo "  Signature removed." || \
  echo "  (could not remove signature — continuing anyway)"

# ── Step 4: Fix permissions ───────────────────────────────────────────────────
echo "[4/6] Setting kext permissions..."
chmod -R 755 "$KEXT"
chown -R root:wheel "$KEXT"
touch /Library/Extensions

# ── Step 5: Reload kext ───────────────────────────────────────────────────────
echo "[5/6] Loading patched kext (SIP disabled — signature check skipped)..."
if kextutil -z "$KEXT" 2>/dev/null; then
    echo "  Loaded via kextutil."
elif kmutil load -p "$KEXT" 2>/dev/null; then
    echo "  Loaded via kmutil."
else
    echo "  WARNING: kext load returned error. Trying kextload..."
    kextload "$KEXT" 2>/dev/null || echo "  (may already be loaded)"
fi

echo ""
echo "[6/6] Plug the ESU1808 USB cable back in, then press Enter..."
read -r

sleep 3

# Verify kext matched the device
if kmutil showloaded 2>/dev/null | grep -q egosys; then
    echo "  Kext loaded and matched ✓"
else
    echo "  WARNING: kext not showing as loaded. Try restarting and re-running."
fi

# ── Step 6: Restart coreaudiod ────────────────────────────────────────────────
echo "Restarting coreaudiod..."
launchctl kickstart -kp system/com.apple.audio.coreaudiod
sleep 8

# Check result
echo ""
echo "=== Result ==="
ASC=$(ioreg -l -w0 2>/dev/null | grep -o '"ASClientDrvESU1808"=[0-9]*' | head -1)
echo "IOKit: $ASC"

if echo "$ASC" | grep -q "=1"; then
    echo ""
    echo "SUCCESS! coreaudiod connected to the ESU1808 audio driver."
    echo "Open Ableton → Preferences → Audio → Audio Device and select ESU1808."
else
    echo ""
    echo "ASClientDrvESU1808 still 0. Check: does ESU1808 appear in Audio MIDI Setup (audio section)?"
    echo "If not, run: log show --predicate 'process==\"coreaudiod\"' --info --last 15s | grep -i esu"
fi
