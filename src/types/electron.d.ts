export interface VSTPlugin {
  name: string
  vendor: string
  path: string
  format: 'VST3' | 'VST2' | 'AU'
  category: string
}

export interface ElectronAPI {
  isElectron: true
  scanVSTs: () => Promise<VSTPlugin[]>
  openAudioFile: (options?: { title?: string }) => Promise<string | null>
  openVSTDir: () => Promise<string | null>
  scanVSTDir: (dir: string) => Promise<VSTPlugin[]>
  readFile: (filePath: string) => Promise<Uint8Array>
  showInFolder: (filePath: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
