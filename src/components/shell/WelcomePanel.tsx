import { useState } from 'react';
import { Upload, Play, MousePointerClick, X } from 'lucide-react';

const DISMISS_KEY = 'webdaw-welcome-dismissed';

export function WelcomePanel() {
  const [open, setOpen] = useState(() => !localStorage.getItem(DISMISS_KEY));

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-[#2a2a38] rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-[#55557a] hover:text-[#e8e8f0]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-bold text-[#e8e8f0] mb-1">Welcome to WebDAW</h2>
        <p className="text-sm text-[#8888aa] mb-5">
          This isn&apos;t Cubase — it&apos;s a browser sketch pad. Three steps to hear something:
        </p>

        <ol className="space-y-4 mb-6">
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6c63ff]/20 flex items-center justify-center shrink-0">
              <Upload size={16} className="text-[#6c63ff]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">1. Drop an audio file</p>
              <p className="text-xs text-[#55557a] mt-0.5">
                Drag a .wav or .mp3 anywhere on the page. A new track appears with your clip.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/20 flex items-center justify-center shrink-0">
              <Play size={16} className="text-[#22c55e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">2. Press Space to play</p>
              <p className="text-xs text-[#55557a] mt-0.5">
                Same as Cubase transport. Click the timeline ruler to move the playhead.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
              <MousePointerClick size={16} className="text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">3. Click a track name</p>
              <p className="text-xs text-[#55557a] mt-0.5">
                Use <strong className="text-[#8888aa]">M</strong> mute, <strong className="text-[#8888aa]">S</strong> solo,
                fader for volume. Sliders icon (top right) opens the mixer.
              </p>
            </div>
          </li>
        </ol>

        <div className="text-[10px] text-[#55557a] bg-[#0a0a0f] rounded-lg p-3 mb-4 border border-[#1e1e2a]">
          <strong className="text-[#8888aa]">Cubase users:</strong> The demo MIDI tracks need the desktop VST bridge to make sound.
          For a quick test, ignore them and drop your own audio file instead.
        </div>

        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-lg bg-[#6c63ff] text-white text-sm font-semibold hover:bg-[#7a72ff] transition-colors"
        >
          Got it — let me try
        </button>
      </div>
    </div>
  );
}
