import type { ElectronAPI } from '@/types/electron'

/** Returns the Electron API if running inside Electron, otherwise null */
export function useElectron(): ElectronAPI | null {
  return window.electronAPI ?? null
}

export const isElectron = (): boolean => !!window.electronAPI
