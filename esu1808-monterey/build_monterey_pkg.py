#!/usr/bin/env python3
"""
Build a macOS Monterey-compatible distribution .pkg for the ESU1808 USB Audio Interface.

The original flat component package (ESU1808_v3.4.10_2652.pkg) has no explicit
OS-version restriction, but it lacks:
  - A Distribution XML  →  no GUI-installer OS check
  - Notarization staple →  Gatekeeper blocks it on macOS 12+
  - A working postinstall script for Monterey kext approval

This script produces:
  ESU1808_v3.4.10_monterey.pkg  – unsigned distribution package that can be
                                   installed with:
                                   sudo installer -pkg ... -target /

Usage:
  python3 build_monterey_pkg.py <original.pkg> <output.pkg>
"""

import gzip
import hashlib
import io
import os
import struct
import sys
import zlib

# ---------------------------------------------------------------------------
# Distribution XML – explicitly allows macOS 10.9 through any future version
# ---------------------------------------------------------------------------
DISTRIBUTION_XML = """\
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>ESU 1808 USB Audio Interface Driver v3.4.10</title>
    <allowed-os-versions>
        <os-version min="10.9"/>
    </allowed-os-versions>
    <options customize="never" require-scripts="false" rootVolumeOnly="true"/>
    <choices-outline>
        <line choice="default">
            <line choice="com.esi-audiotechnik.esu1808.usb.pkg"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="com.esi-audiotechnik.esu1808.usb.pkg" visible="false" title="ESU 1808 Driver">
        <pkg-ref id="com.esi-audiotechnik.esu1808.usb.pkg"/>
    </choice>
    <pkg-ref id="com.esi-audiotechnik.esu1808.usb.pkg"
             version="4.10"
             onConclusion="RequireRestart"
             installKBytes="6306">#ESU1808_component.pkg</pkg-ref>
</installer-gui-script>
"""

# ---------------------------------------------------------------------------
# XAR helpers
# ---------------------------------------------------------------------------

def sha1(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()


def build_xar(files: list[tuple[str, bytes, str]]) -> bytes:
    """
    Build a minimal XAR archive.
    files: list of (name, raw_bytes, hint) where hint is:
      'auto'        – zlib-compress if smaller; encoding=application/x-gzip or octet-stream
      'octet'       – store raw; encoding=application/octet-stream (use for pre-gzipped data)
    Returns the complete XAR bytes.
    Note: XAR uses zlib (not gzip) for application/x-gzip encoding.
    """
    CHECKSUM_ALGORITHM = 1   # SHA1
    CHECKSUM_SIZE = 20

    # ----- decide encoding for each file -----------------------------------
    heap_entries = []   # (name, stored_bytes, encoding_style, original_size, heap_offset)
    heap_offset = CHECKSUM_SIZE  # first file starts after the checksum

    for name, raw, hint in files:
        if hint == 'octet':
            stored = raw
            encoding = "application/octet-stream"
        else:
            # XAR uses plain zlib for its "x-gzip" encoding (despite the name)
            compressed = zlib.compress(raw, level=6)
            if len(compressed) < len(raw):
                stored = compressed
                encoding = "application/x-gzip"
            else:
                stored = raw
                encoding = "application/octet-stream"
        heap_entries.append((name, stored, encoding, len(raw), heap_offset))
        heap_offset += len(stored)

    # ----- build TOC XML ---------------------------------------------------
    file_xml_parts = []
    for idx, (name, stored, encoding, orig_size, offset) in enumerate(heap_entries, start=1):
        orig_raw = files[idx-1][1]  # the uncompressed original bytes
        file_xml_parts.append(f"""\
  <file id="{idx}">
   <name>{name}</name>
   <type>file</type>
   <data>
    <length>{len(stored)}</length>
    <offset>{offset}</offset>
    <size>{orig_size}</size>
    <encoding style="{encoding}"/>
    <extracted-checksum style="sha1">{sha1(orig_raw)}</extracted-checksum>
    <archived-checksum style="sha1">{sha1(stored)}</archived-checksum>
   </data>
  </file>""")

    toc_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<xar>\n'
        ' <toc>\n'
        '  <checksum style="sha1">\n'
        '   <offset>0</offset>\n'
        f'   <size>{CHECKSUM_SIZE}</size>\n'
        '  </checksum>\n'
        + "\n".join(file_xml_parts) + "\n"
        " </toc>\n"
        "</xar>"
    )

    toc_bytes = toc_xml.encode("utf-8")
    toc_compressed = zlib.compress(toc_bytes)

    # ----- build heap ------------------------------------------------------
    all_stored = b"".join(stored for _, stored, _, _, _ in heap_entries)
    heap_checksum = hashlib.sha1(all_stored).digest()
    heap = heap_checksum + all_stored

    # ----- build header (28 bytes) -----------------------------------------
    header = struct.pack(
        ">4sHHQQI",
        b"xar!",
        28,                    # header size
        1,                     # version
        len(toc_compressed),   # TOC compressed length
        len(toc_bytes),        # TOC uncompressed length
        CHECKSUM_ALGORITHM,
    )

    return header + toc_compressed + heap


# ---------------------------------------------------------------------------
# Postinstall script (Monterey-aware)
# ---------------------------------------------------------------------------
POSTINSTALL_SCRIPT = """\
#!/bin/sh
set -e

KEXT_ID="kr.co.egosys.esu1808.usbdriver"
KEXT_PATH="/Library/Extensions/ESU1808.kext"

OS_MAJOR=$(sw_vers -productVersion | cut -d. -f1)

if [ "$OS_MAJOR" -ge 11 ] 2>/dev/null; then
    # macOS Big Sur / Monterey and newer: use kmutil
    # The kext will be staged; user must approve in System Preferences
    if /usr/bin/kmutil load -p "$KEXT_PATH" 2>/dev/null; then
        echo "ESU1808 kext loaded via kmutil."
    else
        echo "ESU1808 kext staged. Please approve in:"
        echo "  System Preferences → Security & Privacy → General"
        echo "then restart your Mac."
    fi
else
    # Legacy (Catalina and earlier)
    /usr/sbin/kextload "$KEXT_PATH" 2>/dev/null || true
fi

exit 0
"""

PREINSTALL_SCRIPT = """\
#!/bin/sh

KEXT="/Library/Extensions/ESU1808.kext"
HAL="/Library/Audio/Plug-Ins/HAL/Esu1808Hal.plugin"
CAUDIO="/Library/Audio/Plug-Ins/HAL/Esu1808.driver"
MIDI="/Library/Audio/MIDI Drivers/Esu1808MidiDriver.plugin"
APP="/Applications/Esu1808 Panel.app"
OLDKEXT="/System/Library/Extensions/ESU1808.kext"

for PATH_TO_REMOVE in "$KEXT" "$HAL" "$CAUDIO" "$MIDI" "$APP" "$OLDKEXT"; do
    if [ -d "$PATH_TO_REMOVE" ]; then
        rm -rf "$PATH_TO_REMOVE"
    fi
done

exit 0
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) not in (2, 3):
        print(f"Usage: {sys.argv[0]} <original.pkg> [output_dir]")
        sys.exit(1)

    original_pkg = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) == 3 else os.path.dirname(original_pkg)

    if not os.path.exists(original_pkg):
        print(f"Error: {original_pkg} not found")
        sys.exit(1)

    output_pkg = os.path.join(output_dir, "ESU1808_v3.4.10_monterey.pkg")
    flat_pkg = os.path.join(output_dir, "ESU1808_v3.4.10_monterey_flat.pkg")

    # -----------------------------------------------------------------------
    # 1. Extract the original flat pkg to get its internals
    # -----------------------------------------------------------------------
    print(f"Reading original package: {original_pkg}")
    with open(original_pkg, "rb") as f:
        orig_data = f.read()

    # Parse XAR header
    magic = orig_data[:4]
    if magic != b"xar!":
        print("Error: not a XAR archive")
        sys.exit(1)

    header_size = struct.unpack(">H", orig_data[4:6])[0]
    toc_len_comp = struct.unpack(">Q", orig_data[8:16])[0]
    toc_len_uncomp = struct.unpack(">Q", orig_data[16:24])[0]

    toc_raw = zlib.decompress(orig_data[header_size : header_size + toc_len_comp])
    heap_start = header_size + toc_len_comp

    # Parse TOC to find file positions
    from xml.etree import ElementTree as ET
    toc = ET.fromstring(toc_raw)

    def extract_file(file_el, heap_start: int, data: bytes) -> bytes:
        d = file_el.find("data")
        if d is None:
            return b""
        offset = int(d.findtext("offset"))
        length = int(d.findtext("length"))
        encoding_el = d.find("encoding")
        encoding = encoding_el.get("style") if encoding_el is not None else "application/octet-stream"
        raw = data[heap_start + offset : heap_start + offset + length]
        if encoding == "application/x-gzip":
            # XAR uses plain zlib despite the "x-gzip" label
            return zlib.decompress(raw)
        return raw

    file_map = {}
    for file_el in toc.findall(".//file"):
        name = file_el.findtext("name")
        if name:
            file_map[name] = extract_file(file_el, heap_start, orig_data)

    print(f"  Found files: {list(file_map.keys())}")

    # -----------------------------------------------------------------------
    # 2. Rebuild Scripts archive with Monterey-aware postinstall
    # -----------------------------------------------------------------------
    print("Rebuilding scripts with Monterey postinstall...")
    raw_cpio = build_scripts_cpio(PREINSTALL_SCRIPT, POSTINSTALL_SCRIPT)
    # Scripts in a pkg are stored as a gzip-compressed cpio archive (the gzip
    # is the actual content; XAR stores this blob as octet-stream)
    scripts_cpio = gzip.compress(raw_cpio, compresslevel=6)

    # -----------------------------------------------------------------------
    # 3. Rebuild the component pkg with updated scripts
    # -----------------------------------------------------------------------
    print("Building updated component package...")
    # The Scripts file in XAR is stored as raw octet-stream (it's a gzip-cpio inside)
    # Payload is also stored raw (already compressed)
    # Bom and PackageInfo use auto (will be zlib-compressed by build_xar)
    component_files = [
        ("Bom",         file_map.get("Bom", b""),    "auto"),
        ("Payload",     file_map.get("Payload", b""), "octet"),  # already gzip inside
        ("Scripts",     scripts_cpio,                 "octet"),  # gzip-cpio, store raw
        ("PackageInfo", file_map.get("PackageInfo", b""), "auto"),
    ]
    component_pkg_bytes = build_xar(component_files)

    # -----------------------------------------------------------------------
    # 4. Build distribution package
    # -----------------------------------------------------------------------
    print("Building distribution package...")
    dist_files = [
        ("Distribution",          DISTRIBUTION_XML.encode("utf-8"), "auto"),
        ("ESU1808_component.pkg", component_pkg_bytes,              "octet"),
    ]
    dist_pkg_bytes = build_xar(dist_files)

    with open(output_pkg, "wb") as f:
        f.write(dist_pkg_bytes)

    # Also write the flat component pkg on its own (simpler, same installer command)
    with open(flat_pkg, "wb") as f:
        f.write(component_pkg_bytes)

    size_kb = len(dist_pkg_bytes) // 1024
    flat_kb = len(component_pkg_bytes) // 1024
    print(f"\nDone!")
    print(f"  Distribution pkg : {output_pkg} ({size_kb} KB)")
    print(f"  Flat component   : {flat_pkg} ({flat_kb} KB)")
    print()
    print("To install on macOS Monterey (Intel Mac only) – try in this order:")
    print(f"  sudo installer -pkg '{flat_pkg}' -target /")
    print(f"  # if that fails, try the distribution version:")
    print(f"  sudo installer -pkg '{output_pkg}' -target /")
    print()
    print("Then open System Preferences → Security & Privacy → General")
    print("and click 'Allow' for the ESU1808 driver, then restart.")


# ---------------------------------------------------------------------------
# CPIO builder (odc format) for the Scripts archive
# ---------------------------------------------------------------------------

def cpio_odc_entry(name: str, data: bytes, mode: int = 0o755) -> bytes:
    """Create a single odc-format CPIO entry."""
    name_bytes = name.encode("ascii") + b"\x00"
    namesize = len(name_bytes)

    def oct6(n: int) -> bytes:
        return f"{n:06o}".encode()

    def oct11(n: int) -> bytes:
        return f"{n:011o}".encode()

    header = (
        b"070707"       # magic
        + oct6(0)       # dev
        + oct6(0)       # ino
        + oct6(mode)    # mode
        + oct6(0)       # uid
        + oct6(0)       # gid
        + oct6(1)       # nlink
        + oct6(0)       # rdev
        + oct11(0)      # mtime
        + oct6(namesize)
        + oct11(len(data))
    )
    return header + name_bytes + data


def build_scripts_cpio(preinstall: str, postinstall: str) -> bytes:
    pre_bytes = preinstall.encode("utf-8")
    post_bytes = postinstall.encode("utf-8")
    parts = [
        cpio_odc_entry(".", b"", mode=0o040755),
        cpio_odc_entry("./preinstall", pre_bytes, mode=0o100755),
        cpio_odc_entry("./postinstall", post_bytes, mode=0o100755),
        cpio_odc_entry("TRAILER!!!", b""),
    ]
    return b"".join(parts)


if __name__ == "__main__":
    main()
