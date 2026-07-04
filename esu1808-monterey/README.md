# ESU 1808 USB Audio Driver – macOS Monterey Compatibility

This folder contains tools to install the **ESU 1808 v3.4.10** driver on
**macOS Monterey (12)** and **Big Sur (11)**.

---

## Why the original package doesn't work on Monterey

| Issue | Detail |
|---|---|
| **Not notarized** | The original `.pkg` (dated 2020-03-03) was not submitted to Apple's notarisation service. macOS 12 Gatekeeper blocks it at launch. |
| **Empty postinstall** | The original package has a blank `postinstall` script, so the kernel extension (`ESU1808.kext`) is never registered after install. |
| **New kext policy** | macOS 11+ requires explicit user approval for every third-party kernel extension in *System Preferences → Security & Privacy → General*. |
| **Intel (x86_64) only** | All binaries are Intel-only. **Apple Silicon (M1/M2) Macs are not supported.** |

---

## Requirements

- **Intel Mac** (x86_64) – not compatible with M1/M2 Apple Silicon
- macOS 12 Monterey or macOS 11 Big Sur
- Administrator password

---

## Installation – Method A: Modified `.pkg` (easiest)

`ESU1808_v3.4.10_monterey.pkg` is a re-packaged distribution installer with:
- A `Distribution` XML that explicitly allows macOS 10.9 – any version
- A Monterey-aware `postinstall` script that uses `kmutil` instead of the
  deprecated `kextload`
- All original driver binaries preserved unchanged (signed by ESI)

Because the package was re-packaged without ESI's signing certificate it is
**unsigned**. macOS will refuse to open it by double-clicking.  
Install it from **Terminal**:

```bash
sudo installer -pkg /path/to/ESU1808_v3.4.10_monterey.pkg -target /
```

Then follow the **"After installation"** steps below.

---

## Installation – Method B: Shell script (alternative)

`install_esu1808_monterey.sh` extracts and installs the drivers without using
the macOS Package Installer at all.

```bash
# Place the original pkg and this script in the same folder, then:
sudo bash install_esu1808_monterey.sh /path/to/ESU1808_v3.4.10_2652.pkg
```

Or rebuild the Monterey `.pkg` from the original yourself:

```bash
python3 build_monterey_pkg.py ESU1808_v3.4.10_2652.pkg ESU1808_v3.4.10_monterey.pkg
sudo installer -pkg ESU1808_v3.4.10_monterey.pkg -target /
```

---

## After installation (REQUIRED on macOS 11 / 12)

macOS Monterey blocks third-party kernel extensions until you approve them:

1. **Restart** your Mac when prompted (or manually restart)
2. Open **System Preferences → Security & Privacy → General**
3. If you see a message like *"System software from developer ESI
   Audiotechnik GmbH was blocked"*, click **Allow**
4. **Restart again**
5. Connect the ESU 1808 via USB and open **Audio MIDI Setup** to verify

> If no "Allow" button appears after the first restart, wait 30 seconds on
> the login screen before logging in – macOS needs time to process the kext.

---

## Files in this folder

| File | Purpose |
|---|---|
| `ESU1808_v3.4.10_monterey.pkg` | Modified distribution package (unsigned, install via Terminal) |
| `install_esu1808_monterey.sh` | Standalone bash installer (extracts & installs without pkg) |
| `build_monterey_pkg.py` | Python script that produced the modified `.pkg` from the original |
| `README.md` | This file |

---

## What was changed vs the original package

- **Added** `Distribution` XML with `<allowed-os-versions min="10.9"/>` and
  `hostArchitectures="x86_64"` – removes any implicit OS ceiling
- **Replaced** the empty `postinstall` script with one that:
  - Detects macOS version at install time
  - On macOS 11+: calls `/usr/bin/kmutil load` (the correct tool)
  - On macOS 10.x: falls back to the legacy `/usr/sbin/kextload`
  - Prints clear instructions if the kext needs manual approval
- **All driver binaries are byte-for-byte identical** to the originals
  (ESI's code signatures are preserved)

---

## Troubleshooting

**"Installer failed" / nothing appears in Security & Privacy**  
Run the installer from Terminal and read the output:
```bash
sudo installer -pkg ESU1808_v3.4.10_monterey.pkg -target / -verbose
```

**Device not recognised after two restarts**  
Open Terminal and check:
```bash
sudo kmutil showloaded | grep -i esu
# or
kextstat | grep egosys
```
If the kext appears as loaded, macOS sees the driver. Unplug and re-plug the USB cable.

**Apple Silicon Mac**  
This driver has no arm64 binary. You cannot use it on an M1/M2/M3 Mac.
Contact ESI Audiotechnik for an updated driver:  
https://www.esi-audio.com/support/downloads/

---

*Packaged for Monterey compatibility – driver code © ESI Audiotechnik GmbH*
