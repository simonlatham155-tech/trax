#!/usr/bin/env bash
# Build TRAX Bridge as a macOS .app + .dmg
# Run from the project root: bash bridge/build_mac.sh
set -euo pipefail

BRIDGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$BRIDGE_DIR")"
DIST_DIR="$ROOT_DIR/bridge-dist/mac"
APP_NAME="TRAX Bridge"

echo "━━━ Installing Python deps ━━━"
pip3 install --quiet pedalboard websockets numpy pystray Pillow pyinstaller

echo "━━━ Generating icon ━━━"
python3 "$BRIDGE_DIR/icon.py"

# Convert PNG → .icns for macOS
if command -v sips &>/dev/null && command -v iconutil &>/dev/null; then
    ICONSET="$BRIDGE_DIR/AppIcon.iconset"
    mkdir -p "$ICONSET"
    for size in 16 32 64 128 256 512; do
        sips -z $size $size "$BRIDGE_DIR/icon.png" \
            --out "$ICONSET/icon_${size}x${size}.png" &>/dev/null
        double=$((size * 2))
        sips -z $double $double "$BRIDGE_DIR/icon.png" \
            --out "$ICONSET/icon_${size}x${size}@2x.png" &>/dev/null
    done
    iconutil -c icns "$ICONSET" -o "$BRIDGE_DIR/AppIcon.icns"
    rm -rf "$ICONSET"
    ICON_ARG="--icon $BRIDGE_DIR/AppIcon.icns"
else
    ICON_ARG="--icon $BRIDGE_DIR/icon.png"
fi

echo "━━━ Building .app with PyInstaller ━━━"
cd "$BRIDGE_DIR"
~/.local/bin/pyinstaller \
    --noconfirm \
    --windowed \
    --onedir \
    --name "$APP_NAME" \
    --distpath "$DIST_DIR" \
    --workpath "$ROOT_DIR/.build-cache/mac" \
    --specpath "$ROOT_DIR/.build-cache" \
    $ICON_ARG \
    --add-data "icon.png:." \
    --hidden-import pedalboard \
    --hidden-import pystray \
    --hidden-import PIL \
    --hidden-import websockets \
    --hidden-import numpy \
    --collect-all pedalboard \
    app.py

echo "━━━ Creating .dmg ━━━"
if command -v create-dmg &>/dev/null; then
    create-dmg \
        --volname "$APP_NAME" \
        --volicon "$BRIDGE_DIR/AppIcon.icns" \
        --window-pos 200 120 \
        --window-size 600 400 \
        --icon-size 128 \
        --icon "$APP_NAME.app" 150 180 \
        --hide-extension "$APP_NAME.app" \
        --app-drop-link 450 180 \
        "$DIST_DIR/$APP_NAME.dmg" \
        "$DIST_DIR/$APP_NAME.app"
    echo "✓  DMG: $DIST_DIR/$APP_NAME.dmg"
else
    # Fallback: plain hdiutil dmg
    hdiutil create -volname "$APP_NAME" \
        -srcfolder "$DIST_DIR/$APP_NAME.app" \
        -ov -format UDZO \
        "$DIST_DIR/$APP_NAME.dmg"
    echo "✓  DMG (hdiutil): $DIST_DIR/$APP_NAME.dmg"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build complete!"
echo "  App : $DIST_DIR/$APP_NAME.app"
echo "  DMG : $DIST_DIR/$APP_NAME.dmg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
