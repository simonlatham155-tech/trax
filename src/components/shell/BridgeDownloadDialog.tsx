import { useEffect } from 'react';
import { X } from 'lucide-react';
import { BridgeAppIcon } from '@/components/shell/BridgeAppIcon';
import {
  downloadBridgeApp,
  getBridgePlatformLabel,
  getBridgeRunHint,
} from '@/utils/bridge-download';
import { vstBridge } from '@/services/vstBridge';

interface BridgeDownloadDialogProps {
  onClose: () => void;
}

export function BridgeDownloadDialog({ onClose }: BridgeDownloadDialogProps) {
  const platform = getBridgePlatformLabel();

  useEffect(() => {
    downloadBridgeApp();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111118] border border-[#2a2a38] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#6c63ff] via-[#8b83ff] to-[#6c63ff]" />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#55557a] hover:text-[#e8e8f0]"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4 mb-5">
            <BridgeAppIcon size={56} connected={false} />
            <div className="pt-1">
              <h2 className="text-lg font-bold text-[#e8e8f0]">TRAX Bridge</h2>
              <p className="text-sm text-[#8888aa] mt-0.5">
                A small desktop app that connects your VST plugins to WebDAW.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#0a0a0f] border border-[#1e1e2a] p-4 mb-5 space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6c63ff]/20 text-[#6c63ff] text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="text-sm font-medium text-[#e8e8f0]">Install the app</p>
                <p className="text-xs text-[#55557a] mt-0.5">
                  Download for {platform} should start automatically.{' '}
                  <button onClick={() => downloadBridgeApp()} className="text-[#6c63ff] hover:underline">
                    Download again
                  </button>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6c63ff]/20 text-[#6c63ff] text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="text-sm font-medium text-[#e8e8f0]">Open TRAX Bridge</p>
                <p className="text-xs text-[#55557a] mt-0.5">{getBridgeRunHint()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6c63ff]/20 text-[#6c63ff] text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="text-sm font-medium text-[#e8e8f0]">Use WebDAW as normal</p>
                <p className="text-xs text-[#55557a] mt-0.5">
                  The app sits in your menu bar or system tray. WebDAW connects on its own.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => downloadBridgeApp()}
              className="flex-1 py-2.5 rounded-lg bg-[#6c63ff] text-white text-sm font-semibold hover:bg-[#7a72ff] transition-colors"
            >
              Download for {platform}
            </button>
            <button
              onClick={() => {
                vstBridge.connect();
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg border border-[#2a2a38] text-sm text-[#8888aa] hover:text-[#e8e8f0] hover:border-[#3a3a4a] transition-colors"
            >
              Already installed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
