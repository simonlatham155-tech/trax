@echo off
REM Build TRAX Bridge as a Windows .exe
REM Run from the project root: bridge\build_win.bat

setlocal enabledelayedexpansion

set BRIDGE_DIR=%~dp0
set ROOT_DIR=%BRIDGE_DIR%..
set DIST_DIR=%ROOT_DIR%\bridge-dist\win
set APP_NAME=TRAX Bridge

echo === Installing Python deps ===
pip install --quiet pedalboard websockets numpy pystray Pillow pyinstaller

echo === Generating icon ===
python "%BRIDGE_DIR%icon.py"

echo === Converting PNG to .ico ===
python -c "from PIL import Image; img = Image.open(r'%BRIDGE_DIR%icon.png'); img.save(r'%BRIDGE_DIR%icon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])"

echo === Building .exe with PyInstaller ===
pyinstaller ^
    --noconfirm ^
    --windowed ^
    --onefile ^
    --name "%APP_NAME%" ^
    --distpath "%DIST_DIR%" ^
    --workpath "%ROOT_DIR%\.build-cache\win" ^
    --specpath "%ROOT_DIR%\.build-cache" ^
    --icon "%BRIDGE_DIR%icon.ico" ^
    --add-data "%BRIDGE_DIR%icon.png;." ^
    --hidden-import pedalboard ^
    --hidden-import pystray ^
    --hidden-import PIL ^
    --hidden-import websockets ^
    --hidden-import numpy ^
    --collect-all pedalboard ^
    "%BRIDGE_DIR%app.py"

echo.
echo ===============================
echo   Build complete!
echo   EXE: %DIST_DIR%\%APP_NAME%.exe
echo ===============================

endlocal
