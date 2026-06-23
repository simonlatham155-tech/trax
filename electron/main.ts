import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { homedir, platform } from 'os'

// ─── VST Scanner ──────────────────────────────────────────────────────────────

export interface VSTPlugin {
  name: string
  vendor: string
  path: string
  format: 'VST3' | 'VST2' | 'AU'
  category: string
}

function vstSearchPaths(): { path: string; format: VSTPlugin['format'] }[] {
  const home = homedir()
  const p = platform()

  if (p === 'darwin') {
    return [
      { path: '/Library/Audio/Plug-Ins/VST3', format: 'VST3' },
      { path: join(home, 'Library/Audio/Plug-Ins/VST3'), format: 'VST3' },
      { path: '/Library/Audio/Plug-Ins/VST', format: 'VST2' },
      { path: join(home, 'Library/Audio/Plug-Ins/VST'), format: 'VST2' },
      { path: '/Library/Audio/Plug-Ins/Components', format: 'AU' },
      { path: join(home, 'Library/Audio/Plug-Ins/Components'), format: 'AU' },
    ]
  }

  if (p === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files'
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    const local = process.env['LOCALAPPDATA'] || join(home, 'AppData', 'Local')
    return [
      { path: join(pf, 'Common Files', 'VST3'), format: 'VST3' },
      { path: join(pf86, 'Common Files', 'VST3'), format: 'VST3' },
      { path: join(local, 'Programs', 'Common', 'VST3'), format: 'VST3' },
      { path: join(pf, 'VSTPlugins'), format: 'VST2' },
      { path: join(pf86, 'VSTPlugins'), format: 'VST2' },
      { path: join(pf, 'Steinberg', 'VSTPlugins'), format: 'VST2' },
    ]
  }

  // Linux
  return [
    { path: join(home, '.vst3'), format: 'VST3' },
    { path: '/usr/lib/vst3', format: 'VST3' },
    { path: '/usr/local/lib/vst3', format: 'VST3' },
    { path: join(home, '.vst'), format: 'VST2' },
    { path: '/usr/lib/vst', format: 'VST2' },
    { path: '/usr/local/lib/vst', format: 'VST2' },
  ]
}

function readVst3Meta(bundlePath: string): { name: string; vendor: string; category: string } {
  const fallback = {
    name: bundlePath.split(/[\\/]/).pop()?.replace(/\.vst3$/i, '') ?? 'Unknown',
    vendor: 'Unknown',
    category: 'Instrument',
  }

  try {
    const infoPath = join(bundlePath, 'Contents', 'moduleinfo.json')
    if (existsSync(infoPath)) {
      const info = JSON.parse(readFileSync(infoPath, 'utf-8'))
      const first = info.Classes?.[0] ?? {}
      return {
        name: first.Name ?? info.Name ?? fallback.name,
        vendor: first.Vendor ?? info.Vendor ?? fallback.vendor,
        category: first.SubCategories?.[0] ?? first.Category ?? fallback.category,
      }
    }
  } catch { /* ignore */ }

  return fallback
}

function scanDirectory(dir: string, format: VSTPlugin['format']): VSTPlugin[] {
  if (!existsSync(dir)) return []
  const results: VSTPlugin[] = []

  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const lower = entry.toLowerCase()

      if (format === 'VST3' && lower.endsWith('.vst3')) {
        const meta = readVst3Meta(fullPath)
        results.push({ ...meta, path: fullPath, format })
        continue
      }

      if (format === 'VST2' && (lower.endsWith('.dll') || lower.endsWith('.vst'))) {
        results.push({
          name: entry.replace(/\.(dll|vst)$/i, ''),
          vendor: 'Unknown',
          path: fullPath,
          format,
          category: 'Instrument',
        })
        continue
      }

      if (format === 'AU' && lower.endsWith('.component')) {
        results.push({
          name: entry.replace(/\.component$/i, ''),
          vendor: 'Unknown',
          path: fullPath,
          format,
          category: 'Instrument',
        })
        continue
      }

      // Recurse one level into subdirs
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory() && !lower.endsWith('.vst3') && !lower.endsWith('.component')) {
          results.push(...scanDirectory(fullPath, format))
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  return results
}

async function scanVSTs(): Promise<VSTPlugin[]> {
  const all: VSTPlugin[] = []
  for (const { path, format } of vstSearchPaths()) {
    all.push(...scanDirectory(path, format))
  }
  // Deduplicate by path
  return all.filter((p, i, arr) => arr.findIndex(x => x.path === p.path) === i)
}

// ─── Main window ──────────────────────────────────────────────────────────────

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Scan VST plugins
  ipcMain.handle('scan-vsts', () => scanVSTs())

  // Open audio file dialog
  ipcMain.handle('open-audio-file', async (_, options?: { title?: string }) => {
    const result = await dialog.showOpenDialog({
      title: options?.title ?? 'Open Audio File',
      properties: ['openFile'],
      filters: [
        { name: 'Audio', extensions: ['wav', 'mp3', 'ogg', 'flac', 'aiff', 'aif', 'm4a', 'opus'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Open directory dialog for custom VST scan path
  ipcMain.handle('open-vst-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select VST Plugin Folder',
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Scan a specific directory for VSTs
  ipcMain.handle('scan-vst-dir', (_event, dir: string) => {
    const vst3 = scanDirectory(dir, 'VST3')
    const vst2 = scanDirectory(dir, 'VST2')
    const au = scanDirectory(dir, 'AU')
    return [...vst3, ...vst2, ...au]
  })

  // Read a file as Buffer (for loading audio from disk)
  ipcMain.handle('read-file', (_event, filePath: string) => {
    try {
      return readFileSync(filePath)
    } catch (err) {
      throw new Error(`Failed to read file: ${filePath}: ${err}`)
    }
  })

  // Reveal file in Explorer / Finder
  ipcMain.handle('show-item-in-folder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Remove default menu in production
  if (!process.env['ELECTRON_RENDERER_URL']) {
    Menu.setApplicationMenu(null)
  }

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
