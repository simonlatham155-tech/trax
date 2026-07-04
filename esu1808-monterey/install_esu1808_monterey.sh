#!/bin/bash
# ESU1808 USB Audio Interface – macOS Monterey (and Big Sur) installer
# Extracts drivers from the original .pkg and installs them manually,
# bypassing Gatekeeper and the pkg installer's OS checks.
#
# Usage (run from the same directory as the script):
#   sudo bash install_esu1808_monterey.sh [path/to/ESU1808_v3.4.10_2652.pkg]
#
# Requirements:
#   - Intel (x86_64) Mac only – NOT compatible with Apple Silicon (M1/M2)
#   - macOS 11 Big Sur or 12 Monterey
#   - Run with sudo

set -euo pipefail

# ── Auto-locate the original pkg if no argument was given ────────────────────
find_pkg() {
    for dir in "$HOME/Downloads" "$HOME/Desktop" "$HOME" /tmp; do
        for f in "$dir"/ESU1808*.pkg "$dir"/esu1808*.pkg; do
            if [[ -f "$f" ]]; then
                echo "$f"
                return 0
            fi
        done
    done
    return 1
}

if [[ -n "${1:-}" && "$1" != "/path/to/"* && "$1" != "path/to/"* ]]; then
    PKG_PATH="$1"
else
    echo "No package path given – searching Downloads, Desktop, Home…"
    if ! PKG_PATH="$(find_pkg)"; then
        echo ""
        echo "ERROR: Could not find ESU1808*.pkg automatically."
        echo ""
        echo "Please drag the original ESU1808_v3.4.10_2652.pkg onto this Terminal"
        echo "window and re-run:"
        echo "  sudo bash $0 <drag-pkg-here>"
        exit 1
    fi
    echo "Found: $PKG_PATH"
fi

WORK_DIR="$(mktemp -d /tmp/esu1808_install.XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

# ── Checks ───────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    echo ""
    echo "ERROR: Run this with sudo:"
    echo "  sudo bash $0"
    exit 1
fi

if [[ ! -f "$PKG_PATH" ]]; then
    echo "ERROR: Package not found at: $PKG_PATH"
    exit 1
fi

echo "Installing from: $PKG_PATH"

ARCH="$(uname -m)"
if [[ "$ARCH" != "x86_64" ]]; then
    echo "Error: this driver is Intel (x86_64) only."
    echo "Your Mac is running on $ARCH (Apple Silicon), which is not supported."
    exit 1
fi

OS_MAJOR="$(sw_vers -productVersion | cut -d. -f1)"
echo "Detected macOS ${OS_MAJOR} on ${ARCH}"

# ── Extract pkg ─────────────────────────────────────────────────────────────
echo "Extracting package contents…"

# Use Python to extract the XAR/cpio payload (avoids needing xar binary)
python3 - "$PKG_PATH" "$WORK_DIR" << 'PYEOF'
import sys, struct, zlib, gzip, os, hashlib, stat

pkg_path = sys.argv[1]
work_dir = sys.argv[2]

with open(pkg_path, 'rb') as f:
    data = f.read()

# Parse XAR header
assert data[:4] == b'xar!', "Not a XAR file"
header_size = struct.unpack('>H', data[4:6])[0]
toc_comp = struct.unpack('>Q', data[8:16])[0]
toc_raw = zlib.decompress(data[header_size:header_size+toc_comp])
heap_start = header_size + toc_comp

from xml.etree import ElementTree as ET
toc = ET.fromstring(toc_raw)

def read_file(file_el, src_data, heap_start):
    d = file_el.find('data')
    if d is None:
        return b''
    offset = int(d.findtext('offset'))
    length = int(d.findtext('length'))
    enc = d.find('encoding').get('style')
    raw = src_data[heap_start + offset : heap_start + offset + length]
    if enc == 'application/x-gzip':
        return zlib.decompress(raw)
    return raw

# Locate Payload (may be wrapped in a distribution pkg)
payload_data = None
for file_el in toc.findall('.//file'):
    name = file_el.findtext('name')
    if name == 'Payload':
        payload_data = read_file(file_el, data, heap_start)
        break
    # Distribution pkg: inner component pkg
    if name and name.endswith('.pkg'):
        inner = read_file(file_el, data, heap_start)
        hsize2 = struct.unpack('>H', inner[4:6])[0]
        tc2 = struct.unpack('>Q', inner[8:16])[0]
        toc2_raw = zlib.decompress(inner[hsize2:hsize2+tc2])
        toc2 = ET.fromstring(toc2_raw)
        heap2 = hsize2 + tc2
        for file_el2 in toc2.findall('.//file'):
            if file_el2.findtext('name') == 'Payload':
                payload_data = read_file(file_el2, inner, heap2)
                break
        if payload_data:
            break

if payload_data is None:
    print("Error: could not find Payload in the package", file=sys.stderr)
    sys.exit(1)

# The Payload is a raw gzip-compressed cpio archive
if payload_data[:2] == b'\x1f\x8b':
    cpio_data = gzip.decompress(payload_data)
else:
    cpio_data = payload_data

# Extract odc-format cpio
pos = 0
extracted_count = 0
while pos < len(cpio_data) - 6:
    if cpio_data[pos:pos+6] != b'070707':
        pos += 1
        continue
    header = cpio_data[pos:pos+76]
    if len(header) < 76:
        break
    mode = int(header[18:24], 8)
    namesize = int(header[59:65], 8)
    filesize = int(header[65:76], 8)
    name_start = pos + 76
    name = cpio_data[name_start:name_start+namesize-1].decode('ascii', errors='replace')
    file_start = name_start + namesize
    file_data = cpio_data[file_start:file_start+filesize]
    pos = file_start + filesize
    if name == 'TRAILER!!!':
        break
    if name.startswith('./'):
        name = name[2:]
    if not name or name == '.':
        continue
    dest = os.path.join(work_dir, name)
    if stat.S_ISDIR(mode):
        os.makedirs(dest, exist_ok=True)
    elif stat.S_ISREG(mode):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'wb') as f:
            f.write(file_data)
        os.chmod(dest, mode & 0o7777)
        extracted_count += 1

print(f"Extracted {extracted_count} files to {work_dir}")
PYEOF

# ── Remove old installations ─────────────────────────────────────────────────
echo "Removing old driver versions…"
for path in \
    "/Library/Extensions/ESU1808.kext" \
    "/System/Library/Extensions/ESU1808.kext" \
    "/Library/Audio/Plug-Ins/HAL/Esu1808Hal.plugin" \
    "/Library/Audio/Plug-Ins/HAL/Esu1808.driver" \
    "/Library/Audio/MIDI Drivers/Esu1808MidiDriver.plugin" \
    "/Applications/Esu1808 Panel.app"
do
    if [[ -e "$path" ]]; then
        echo "  Removing: $path"
        rm -rf "$path"
    fi
done

# ── Copy drivers into place ───────────────────────────────────────────────────
echo "Installing drivers…"
install_item() {
    local src="$WORK_DIR/$1"
    local dst="$2"
    if [[ -e "$src" ]]; then
        echo "  Installing $1 → $dst"
        cp -R "$src" "$dst"
        chown -R root:wheel "$dst"
    else
        echo "  WARNING: $1 not found in package, skipping"
    fi
}

install_item "Library/Extensions/ESU1808.kext"                          "/Library/Extensions/ESU1808.kext"
install_item "Library/Audio/Plug-Ins/HAL/Esu1808Hal.plugin"             "/Library/Audio/Plug-Ins/HAL/Esu1808Hal.plugin"
install_item "Library/Audio/Plug-Ins/HAL/Esu1808.driver"                "/Library/Audio/Plug-Ins/HAL/Esu1808.driver"
install_item "Library/Audio/MIDI Drivers/Esu1808MidiDriver.plugin"      "/Library/Audio/MIDI Drivers/Esu1808MidiDriver.plugin"
install_item "Applications/Esu1808 Panel.app"                           "/Applications/Esu1808 Panel.app"

# ── Kext permissions (required by macOS) ────────────────────────────────────
chmod -R 755 "/Library/Extensions/ESU1808.kext"
chown -R root:wheel "/Library/Extensions/ESU1808.kext"

# ── Touch the Extensions directory to flush kextd cache ──────────────────────
touch "/Library/Extensions"

# ── OS-specific kext loading ──────────────────────────────────────────────────
if [[ "$OS_MAJOR" -ge 11 ]]; then
    echo ""
    echo "macOS ${OS_MAJOR} detected – using kmutil to stage the kext…"
    if /usr/bin/kmutil load -p "/Library/Extensions/ESU1808.kext" 2>/dev/null; then
        echo "Kext loaded successfully via kmutil."
    else
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo " ACTION REQUIRED – macOS Monterey / Big Sur Security Step"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo " The ESU1808 kernel extension was blocked by macOS security."
        echo " You must manually allow it:"
        echo ""
        echo "   1. Open System Preferences"
        echo "   2. Go to Security & Privacy → General tab"
        echo "   3. Click the lock (🔒) and authenticate"
        echo "   4. Click 'Allow' next to the message about ESU1808"
        echo "   5. Restart your Mac"
        echo ""
        echo " After restarting, the ESU 1808 should appear in Audio MIDI Setup."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
else
    /usr/sbin/kextload "/Library/Extensions/ESU1808.kext" 2>/dev/null || true
fi

echo ""
echo "Installation complete. Please restart your Mac."
