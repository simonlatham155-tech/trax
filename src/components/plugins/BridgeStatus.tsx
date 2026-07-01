import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { vstBridge, type BridgeStatus } from '@/services/vstBridge'
import { cn } from '@/utils/cn'
import { promptBridgeDownload } from '@/utils/bridge-download'
import { BridgeAppIcon } from '@/components/shell/BridgeAppIcon'

export function BridgeStatusIndicator() {
  const [status, setStatus] = useState<BridgeStatus>(vstBridge.currentStatus)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => vstBridge.onStatusChange(setStatus), [])

  const connected = status === 'connected'

  const label = {
    connected:    'TRAX Bridge connected',
    connecting:   'Connecting to TRAX Bridge…',
    disconnected: 'TRAX Bridge not running',
    error:        'TRAX Bridge not found',
  }[status]

  return (
    <div className="relative">
      <button
        className={cn(
          'flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors',
          connected
            ? 'text-[#22c55e]'
            : status === 'connecting'
              ? 'text-[#f59e0b]'
              : 'text-[#8888aa] hover:text-[#e8e8f0] hover:bg-[#1a1a24]'
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          if (connected) return
          if (status === 'disconnected' || status === 'error') promptBridgeDownload()
          else vstBridge.connect()
        }}
        title={label}
      >
        {status === 'connecting' ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <BridgeAppIcon size={18} connected={connected} />
        )}
        <span className="text-[9px] font-semibold hidden sm:inline">
          {connected ? 'VST' : status === 'connecting' ? '…' : 'Get App'}
        </span>
        {status === 'error' && <AlertCircle size={10} className="text-[#ef4444]" />}
      </button>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 pointer-events-none">
          <div className="bg-[#1a1a24] border border-[#2a2a38] rounded px-2.5 py-1.5 text-[10px] text-[#e8e8f0] whitespace-nowrap shadow-lg">
            {label}
            {!connected && (
              <div className="text-[9px] text-[#55557a] mt-0.5">
                Click to get the TRAX Bridge app
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
