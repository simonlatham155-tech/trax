import { useState, useRef, useEffect } from 'react';
import { useDAWStore } from '@/store/daw-store';
import { useProjectStore } from '@/store/project-store';
import { cn } from '@/utils/cn';
import { detectBridgePlatform, openBridgeDownload, openBridgeReleases } from '@/utils/bridge-download';

interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

function MenuDropdown({
  menu,
  open,
  onToggle,
  onClose,
}: {
  menu: MenuDef;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'px-2.5 py-1 text-[11px] rounded transition-colors',
          open ? 'bg-[#1a1a24] text-[#e8e8f0]' : 'text-[#8888aa] hover:bg-[#1a1a24] hover:text-[#e8e8f0]'
        )}
      >
        {menu.label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-0.5 z-50 min-w-[180px] bg-[#1a1a24] border border-[#2a2a38] rounded shadow-xl py-1">
          {menu.items.map((item, i) =>
            item.divider ? (
              <div key={`d-${i}`} className="my-1 border-t border-[#2a2a38]" />
            ) : (
              <button
                key={item.label}
                disabled={item.disabled}
                onClick={() => {
                  item.action?.();
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-4 px-3 py-1.5 text-left text-[11px] text-[#c8c8d8] hover:bg-[#6c63ff]/20 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[9px] text-[#55557a] font-mono">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMixer = useDAWStore((s) => s.toggleMixer);
  const showMixer = useDAWStore((s) => s.ui.showMixer);
  const showPianoRoll = useDAWStore((s) => s.ui.showPianoRoll);
  const pianoRollClipId = useDAWStore((s) => s.ui.pianoRollClipId);
  const openPianoRoll = useDAWStore((s) => s.openPianoRoll);
  const loadDemoProject = useDAWStore((s) => s.loadDemoProject);
  const addTrack = useDAWStore((s) => s.addTrack);

  const save = useProjectStore((s) => s.save);
  const newProject = useProjectStore((s) => s.newProject);
  const exportTraxFile = useProjectStore((s) => s.exportTraxFile);

  const bridgePlatform = detectBridgePlatform();
  const bridgeDownloadLabel =
    bridgePlatform === 'mac'
      ? 'Download TRAX Bridge (macOS)'
      : bridgePlatform === 'windows'
        ? 'Download TRAX Bridge (Windows)'
        : 'Download TRAX Bridge…';

  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        { label: 'New Project', action: () => newProject(), shortcut: '⌘N' },
        { label: 'Save Project', action: () => save(), shortcut: '⌘S' },
        { label: 'Export .trax', action: () => exportTraxFile() },
        { divider: true, label: '' },
        { label: 'Start Empty Project', action: () => useDAWStore.getState().startEmptyProject() },
        { divider: true, label: '' },
        { label: 'Load Demo Project', action: () => loadDemoProject() },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: '⌘Z', disabled: true },
        { label: 'Redo', shortcut: '⇧⌘Z', disabled: true },
      ],
    },
    {
      label: 'View',
      items: [
        { label: showMixer ? 'Hide Mixer' : 'Show Mixer', action: () => toggleMixer() },
        {
          label: showPianoRoll ? 'Hide Piano Roll' : 'Show Piano Roll',
          action: () => openPianoRoll(showPianoRoll ? null : pianoRollClipId),
          disabled: !pianoRollClipId && !showPianoRoll,
        },
      ],
    },
    {
      label: 'MIDI',
      items: [
        { label: 'Add MIDI Track', action: () => addTrack('midi') },
        { label: 'Open Piano Roll', action: () => pianoRollClipId && openPianoRoll(pianoRollClipId), disabled: !pianoRollClipId },
        { divider: true, label: '' },
        { label: bridgeDownloadLabel, action: () => openBridgeDownload() },
        { label: 'Bridge Releases…', action: () => openBridgeReleases() },
      ],
    },
    {
      label: 'Project',
      items: [
        { label: 'Project Settings…', disabled: true },
        { label: 'Load Demo', action: () => loadDemoProject() },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: bridgeDownloadLabel, action: () => openBridgeDownload() },
        { label: 'Download for macOS', action: () => openBridgeDownload('mac') },
        { label: 'Download for Windows', action: () => openBridgeDownload('windows') },
        { label: 'All Bridge Releases…', action: () => openBridgeReleases() },
        { divider: true, label: '' },
        { label: 'Keyboard Shortcuts', disabled: true },
        {
          label: 'About WebDAW',
          action: () => window.alert('WebDAW — browser DAW by LathamAudio\nhttps://simonlatham155-tech.github.io/trax/'),
        },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 bg-[#0a0a0f] border-b border-[#1e1e2a] shrink-0 h-7">
      <span className="text-[10px] font-bold text-[#6c63ff] tracking-widest mr-3">WebDAW</span>
      {menus.map((menu) => (
        <MenuDropdown
          key={menu.label}
          menu={menu}
          open={openMenu === menu.label}
          onToggle={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
          onClose={() => setOpenMenu(null)}
        />
      ))}
    </div>
  );
}
