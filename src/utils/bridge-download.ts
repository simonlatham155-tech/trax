const REPO = 'simonlatham155-tech/trax';

export const BRIDGE_RELEASES_URL = `https://github.com/${REPO}/releases`;

export const BRIDGE_DOWNLOAD = {
  mac: `https://github.com/${REPO}/releases/latest/download/TRAX-Bridge-mac.dmg`,
  windows: `https://github.com/${REPO}/releases/latest/download/TRAX%20Bridge.exe`,
} as const;

export type BridgePlatform = keyof typeof BRIDGE_DOWNLOAD;

export function detectBridgePlatform(): BridgePlatform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? '';
  if (/Mac|iPhone|iPad|iPod/.test(platform) || /Macintosh/.test(ua)) return 'mac';
  if (/Win/.test(platform) || /Windows/.test(ua)) return 'windows';
  return null;
}

export function openBridgeDownload(platform?: BridgePlatform) {
  const detected = platform ?? detectBridgePlatform();
  const url = detected ? BRIDGE_DOWNLOAD[detected] : BRIDGE_RELEASES_URL;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openBridgeReleases() {
  window.open(BRIDGE_RELEASES_URL, '_blank', 'noopener,noreferrer');
}
