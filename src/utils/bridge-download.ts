const REPO = 'simonlatham155-tech/trax';

export const BRIDGE_RELEASES_URL = `https://github.com/${REPO}/releases`;

export const BRIDGE_DOWNLOAD = {
  mac: `https://github.com/${REPO}/releases/latest/download/TRAX-Bridge-mac.dmg`,
  windows: `https://github.com/${REPO}/releases/latest/download/TRAX%20Bridge.exe`,
} as const;

export type BridgePlatform = keyof typeof BRIDGE_DOWNLOAD;

type BridgeDownloadListener = () => void;
const listeners = new Set<BridgeDownloadListener>();

export function subscribeBridgeDownload(listener: BridgeDownloadListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function promptBridgeDownload() {
  listeners.forEach((listener) => listener());
}

export function detectBridgePlatform(): BridgePlatform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? '';
  if (/Mac|iPhone|iPad|iPod/.test(platform) || /Macintosh/.test(ua)) return 'mac';
  if (/Win/.test(platform) || /Windows/.test(ua)) return 'windows';
  return null;
}

export function getBridgePlatformLabel(): string {
  const platform = detectBridgePlatform();
  if (platform === 'mac') return 'macOS';
  if (platform === 'windows') return 'Windows';
  return 'your computer';
}

export function getBridgeRunHint(): string {
  const platform = detectBridgePlatform();
  if (platform === 'mac') return 'Open the installer, drag TRAX Bridge into Applications, then launch it from there.';
  if (platform === 'windows') return 'Run TRAX Bridge from your Downloads folder. Pin it to the taskbar if you like.';
  return 'Open the installer and launch TRAX Bridge like any other desktop app.';
}

export function downloadBridgeApp(platform?: BridgePlatform) {
  const detected = platform ?? detectBridgePlatform();
  const url = detected ? BRIDGE_DOWNLOAD[detected] : BRIDGE_RELEASES_URL;
  window.open(url, '_blank', 'noopener,noreferrer');
}
