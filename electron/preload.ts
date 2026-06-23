import { contextBridge, ipcRenderer } from 'electron'
import type { VSTPlugin } from './main'

export interface ElectronAPI {
  /** Scan standard VST directories on this machine */
  scanVSTs: () => Promise<VSTPlugin[]>

  /** Open a file dialog and pick an audio file; returns the path or null */
  openAudioFile: (options?: { title?: string }) => Promise<string | null>

  /** Open a directory picker to add a custom VST search path */
  openVSTDir: () => Promise<string | null>

  /** Scan a specific directory for VST plugins */
  scanVSTDir: (dir: string) => Promise<VSTPlugin[]>

  /** Read a file from disk and return its bytes as a Uint8Array */
  readFile: (filePath: string) => Promise<Uint8Array>

  /** Reveal a file in Explorer / Finder */
  showInFolder: (filePath: string) => Promise<void>

  /** Whether we are running inside Electron */
  isElectron: true
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  scanVSTs: () => ipcRenderer.invoke('scan-vsts'),

  openAudioFile: (options?: { title?: string }) =>
    ipcRenderer.invoke('open-audio-file', options),

  openVSTDir: () => ipcRenderer.invoke('open-vst-dir'),

  scanVSTDir: (dir: string) => ipcRenderer.invoke('scan-vst-dir', dir),

  readFile: async (filePath: string): Promise<Uint8Array> => {
    const buf: Buffer = await ipcRenderer.invoke('read-file', filePath)
    return new Uint8Array(buf)
  },

  showInFolder: (filePath: string) =>
    ipcRenderer.invoke('show-item-in-folder', filePath),
} satisfies ElectronAPI)
