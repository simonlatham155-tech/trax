import { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import {
  downloadBridgeApp,
  getBridgePlatformLabel,
  getBridgeRunHint,
} from '@/utils/bridge-download';

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
      <div className="relative bg-[#111118] border border-[#2a2a38] rounded-xl shadow-2xl max-w-sm w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#55557a] hover:text-[#e8e8f0]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#6c63ff]/20 flex items-center justify-center">
            <Download size={18} className="text-[#6c63ff]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#e8e8f0]">Download &amp; Run TRAX Bridge</h2>
            <p className="text-[11px] text-[#55557a]">For your local VST plugins</p>
          </div>
        </div>

        <ol className="space-y-3 mb-5 text-sm text-[#c8c8d8]">
          <li className="flex gap-2.5">
            <span className="text-[#6c63ff] font-bold shrink-0">1.</span>
            <span>
              Your download should start now ({platform}). If not,{' '}
              <button
                onClick={() => downloadBridgeApp()}
                className="text-[#6c63ff] hover:underline"
              >
                click here
              </button>
              .
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#6c63ff] font-bold shrink-0">2.</span>
            <span>{getBridgeRunHint()}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#6c63ff] font-bold shrink-0">3.</span>
            <span>Leave it running — TRAX connects automatically. The VST icon turns green.</span>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-[#6c63ff] text-white text-sm font-semibold hover:bg-[#7a72ff] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
