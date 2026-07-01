import { useEffect, useState, type ReactNode } from 'react';
import { BridgeDownloadDialog } from '@/components/shell/BridgeDownloadDialog';
import { subscribeBridgeDownload } from '@/utils/bridge-download';

export function BridgeDownloadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeBridgeDownload(() => setOpen(true)), []);

  return (
    <>
      {children}
      {open && <BridgeDownloadDialog onClose={() => setOpen(false)} />}
    </>
  );
}
