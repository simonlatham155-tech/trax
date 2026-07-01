import { useState, useEffect, useCallback } from 'react'
import { Search, FolderOpen, RefreshCw, X, Music2, Check, Wifi, WifiOff, Download } from 'lucide-react'
import { vstBridge, type BridgePlugin, type BridgeStatus } from '@/services/vstBridge'
import { cn } from '@/utils/cn'
import { promptBridgeDownload } from '@/utils/bridge-download'
import { BridgeAppIcon } from '@/components/shell/BridgeAppIcon'

interface PluginManagerProps {
  selected?: string          // currently assigned plugin path
  onSelect: (plugin: BridgePlugin) => void
  onClose: () => void
}

const FORMAT_COLOR: Record<string, string> = {
  VST3: '#3b82f6',
  VST2: '#8b5cf6',
  AU:   '#f59e0b',
}

export function PluginManager({ selected, onSelect, onClose }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<BridgePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState<string>('ALL')
  const [scanned, setScanned] = useState(false)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(vstBridge.currentStatus)
  const [extraPath, setExtraPath] = useState('')

  useEffect(() => vstBridge.onStatusChange(setBridgeStatus), [])

  const scan = useCallback(async (extra?: string) => {
    if (bridgeStatus !== 'connected') return
    setLoading(true)
    try {
      const extras = extra ? [extra] : []
      const found = await vstBridge.scanPlugins(extras)
      setPlugins(found)
      setScanned(true)
    } catch (err) {
      console.error('Scan failed:', err)
    } finally {
      setLoading(false)
    }
  }, [bridgeStatus])

  // Auto-scan when bridge connects
  useEffect(() => {
    if (bridgeStatus === 'connected' && !scanned) scan()
  }, [bridgeStatus, scanned, scan])

  const handleAddPath = async () => {
    if (!extraPath.trim()) return
    await scan(extraPath.trim())
    setExtraPath('')
  }

  const filtered = plugins.filter((p) => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
    const matchF = formatFilter === 'ALL' || p.format === formatFilter
    return matchQ && matchF
  })

  const formats = Array.from(new Set(plugins.map((p) => p.format)))

  const isBridgeOffline = bridgeStatus !== 'connected'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] flex flex-col bg-[#111118] border border-[#2a2a38] rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a38]">
          <div>
            <h2 className="text-sm font-bold text-[#e8e8f0]">Plugin Browser</h2>
            <p className="text-[11px] text-[#55557a] mt-0.5">
              {isBridgeOffline
                ? 'Bridge offline'
                : scanned
                ? `${plugins.length} plugin${plugins.length !== 1 ? 's' : ''} found`
                : 'Ready to scan'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bridge status pill */}
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold border',
              bridgeStatus === 'connected'
                ? 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10'
                : 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10'
            )}>
              {bridgeStatus === 'connected'
                ? <><Wifi size={10} /> Bridge</>
                : <><WifiOff size={10} /> Offline</>}
            </div>
            <button
              onClick={() => scan()}
              disabled={loading || isBridgeOffline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] border border-[#2a2a38] transition-colors disabled:opacity-40"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Rescan
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Bridge offline message */}
        {isBridgeOffline && (
          <div className="mx-4 mt-3 mb-0 px-4 py-4 rounded-xl bg-[#0a0a0f] border border-[#2a2a38]">
            <div className="flex items-start gap-3">
              <BridgeAppIcon size={44} connected={false} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#e8e8f0]">TRAX Bridge app required</div>
                <p className="text-[11px] text-[#55557a] mt-1 leading-relaxed">
                  Install the free TRAX Bridge desktop app to browse and use your VST plugins in WebDAW.
                </p>
                <button
                  onClick={() => promptBridgeDownload()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6c63ff] text-white text-[11px] font-semibold hover:bg-[#7a72ff] transition-colors"
                >
                  <Download size={12} />
                  Get TRAX Bridge App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search + format filter */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2a]">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#55557a]" />
            <input
              autoFocus
              type="text"
              placeholder="Search by name or vendor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#0a0a12] border border-[#2a2a38] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[#e8e8f0] placeholder-[#55557a] outline-none focus:border-[#6c63ff] transition-colors"
            />
          </div>
          <div className="flex gap-1">
            {(['ALL', ...formats] as string[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-bold rounded transition-colors',
                  formatFilter === f
                    ? 'bg-[#6c63ff] text-white'
                    : 'bg-[#1a1a24] text-[#8888aa] hover:text-[#e8e8f0] border border-[#2a2a38]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Custom path input */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1e1e2a] bg-[#0d0d16]">
          <FolderOpen size={11} className="text-[#55557a] shrink-0" />
          <input
            type="text"
            placeholder="Add custom plugin folder path… (e.g. /Library/Audio/Plug-Ins/VST3)"
            value={extraPath}
            onChange={(e) => setExtraPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPath()}
            className="flex-1 bg-transparent text-[10px] text-[#8888aa] placeholder-[#3a3a4a] outline-none"
          />
          <button
            onClick={handleAddPath}
            disabled={!extraPath.trim() || isBridgeOffline}
            className="text-[10px] text-[#6c63ff] hover:text-[#8888ff] disabled:opacity-30 transition-colors"
          >
            Scan
          </button>
        </div>

        {/* Plugin list */}
        <div className="flex-1 overflow-y-auto">
          {loading && plugins.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={20} className="text-[#6c63ff] animate-spin" />
                <span className="text-xs text-[#55557a]">Scanning for plugins…</span>
              </div>
            </div>
          )}

          {!loading && scanned && plugins.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 px-6 text-center">
              <Music2 size={28} className="text-[#2a2a38]" />
              <p className="text-sm text-[#55557a]">No VST plugins found</p>
              <p className="text-[11px] text-[#3a3a4a]">
                Enter a path above to scan a custom directory.
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="divide-y divide-[#1a1a24]">
              {filtered.map((plugin) => {
                const isSelected = plugin.path === selected
                const fmtColor = FORMAT_COLOR[plugin.format] ?? '#6c63ff'
                return (
                  <button
                    key={plugin.path}
                    onClick={() => { onSelect(plugin); onClose() }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#1a1a24] transition-colors',
                      isSelected && 'bg-[#1e1e2e]'
                    )}
                  >
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: fmtColor + '22',
                        color: fmtColor,
                        border: `1px solid ${fmtColor}44`,
                      }}
                    >
                      {plugin.format}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#e8e8f0] truncate">
                        {plugin.name}
                      </div>
                      <div className="text-[10px] text-[#55557a] truncate">
                        {plugin.vendor} · {plugin.category}
                      </div>
                    </div>

                    {isSelected && <Check size={13} className="text-[#6c63ff] shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && plugins.length > 0 && (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-[#55557a]">No plugins match &quot;{query}&quot;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
