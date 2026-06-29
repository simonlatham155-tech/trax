// Electron is no longer used — VST access goes through the bridge server.
// This file is kept so imports in TrackHeader don't break during cleanup.
export const useElectron = () => null
export const isElectron = () => false
