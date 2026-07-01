import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'
import { vstBridge, type BridgeStatus } from '@/services/vstBridge'
import { cn } from '@/utils/cn'
import { promptBridgeDownload } from '@/utils/bridge-download'

export function BridgeStatusIndicator() {
  const [status, setStatus] = useState<BridgeStatus>(vstBridge.currentStatus)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => vstBridge.onStatusChange(setStatus), [])

  const icon = {
    connected:    <Wifi size={11} />,
    connecting:   <Loader2 size={11} className="animate-spin" />,
    disconnected: <WifiOff size={11} />,
    error:        <AlertCircle size={11} />,
  }[status]

  const colour = {
    connected:    'text-[#22c55e]',
    connecting:   'text-[#f59e0b]',
    disconnected: 'text-[#55557a]',
    error:        'text-[#ef4444]',
  }[status]

  const label = {
    connected:    'Bridge connected',
    connecting:   'Connecting to bridge…',
    disconnected: 'Bridge offline',
    error:        'Bridge error',
  }[status]

  return (
    <div className="relative">
      <button
        className={cn('flex items-center gap-1 transition-colors', colour)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          if (status === 'connected') return
          if (status === 'disconnected' || status === 'error') promptBridgeDownload()
          else vstBridge.connect()
        }}
        title={label}
      >
        {icon}
        <span className="text-[9px] font-semibold hidden sm:inline">{
          status === 'connected' ? 'VST' : status === 'connecting' ? '…' : 'VST'
        }</span>
      </button>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 pointer-events-none">
          <div className="bg-[#1a1a24] border border-[#2a2a38] rounded px-2.5 py-1.5 text-[10px] text-[#e8e8f0] whitespace-nowrap shadow-lg">
            {label}
            {status !== 'connected' && (
              <div className="text-[9px] text-[#55557a] mt-0.5">
                Help → Download &amp; Run TRAX Bridge
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
