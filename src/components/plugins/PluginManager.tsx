import { useState, useEffect, useCallback } from 'react'
import { Search, FolderOpen, RefreshCw, X, Music2, Mic2, Layers, Check } from 'lucide-react'
import { useElectron } from '@/hooks/useElectron'
import type { VSTPlugin } from '@/types/electron'
import { cn } from '@/utils/cn'

interface PluginManagerProps {
  /** Currently assigned plugin path (or undefined) */
  selected?: string
  onSelect: (plugin: VSTPlugin) => void
  onClose: () => void
}

const FORMAT_COLOR: Record<VSTPlugin['format'], string> = {
  VST3: '#3b82f6',
  VST2: '#8b5cf6',
  AU: '#f59e0b',
}

const CATEGORY_ICON = (cat: string) => {
  const c = cat.toLowerCase()
  if (c.includes('synth') || c.includes('instrument') || c.includes('fx')) return <Music2 size={12} />
  if (c.includes('drum') || c.includes('percuss')) return <Layers size={12} />
  if (c.includes('vocal') || c.includes('mic')) return <Mic2 size={12} />
  return <Music2 size={12} />
}

export function PluginManager({ selected, onSelect, onClose }: PluginManagerProps) {
  const electron = useElectron()
  const [plugins, setPlugins] = useState<VSTPlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState<VSTPlugin['format'] | 'ALL'>('ALL')
  const [scanned, setScanned] = useState(false)

  const scan = useCallback(async () => {
    if (!electron) return
    setLoading(true)
    try {
      const found = await electron.scanVSTs()
      setPlugins(found)
      setScanned(true)
    } finally {
      setLoading(false)
    }
  }, [electron])

  const addCustomDir = useCallback(async () => {
    if (!electron) return
    const dir = await electron.openVSTDir()
    if (!dir) return
    setLoading(true)
    try {
      const found = await electron.scanVSTDir(dir)
      setPlugins((prev) => {
        const merged = [...prev]
        for (const p of found) {
          if (!merged.find((x) => x.path === p.path)) merged.push(p)
        }
        return merged
      })
    } finally {
      setLoading(false)
    }
  }, [electron])

  // Auto-scan on first open
  useEffect(() => {
    if (!scanned && electron) scan()
  }, [scanned, electron, scan])

  const filtered = plugins.filter((p) => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
    const matchF = formatFilter === 'ALL' || p.format === formatFilter
    return matchQ && matchF
  })

  const formats = Array.from(new Set(plugins.map((p) => p.format)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] flex flex-col bg-[#111118] border border-[#2a2a38] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a38]">
          <div>
            <h2 className="text-sm font-bold text-[#e8e8f0]">Plugin Browser</h2>
            <p className="text-[11px] text-[#55557a] mt-0.5">
              {scanned
                ? `${plugins.length} plugin${plugins.length !== 1 ? 's' : ''} found`
                : 'Scanning…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {electron && (
              <>
                <button
                  onClick={addCustomDir}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] transition-colors border border-[#2a2a38]"
                  title="Add custom plugin folder"
                >
                  <FolderOpen size={11} />
                  Add Folder
                </button>
                <button
                  onClick={scan}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] transition-colors border border-[#2a2a38] disabled:opacity-50"
                  title="Rescan"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  Rescan
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search + format filter */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2a]">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#55557a]" />
            <input
              autoFocus
              type="text"
              placeholder="Search plugins…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#0a0a12] border border-[#2a2a38] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[#e8e8f0] placeholder-[#55557a] outline-none focus:border-[#6c63ff] transition-colors"
            />
          </div>
          <div className="flex gap-1">
            {(['ALL', ...formats] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f as typeof formatFilter)}
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

        {/* Plugin list */}
        <div className="flex-1 overflow-y-auto">
          {!electron && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-6">
              <Music2 size={28} className="text-[#2a2a38]" />
              <p className="text-sm text-[#55557a]">
                VST scanning requires the desktop app.
              </p>
              <p className="text-[11px] text-[#3a3a4a]">
                Running in browser mode — local VST plugins are not accessible.
              </p>
            </div>
          )}

          {electron && loading && plugins.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={20} className="text-[#6c63ff] animate-spin" />
                <span className="text-xs text-[#55557a]">Scanning for plugins…</span>
              </div>
            </div>
          )}

          {electron && !loading && plugins.length === 0 && scanned && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-6">
              <Music2 size={28} className="text-[#2a2a38]" />
              <p className="text-sm text-[#55557a]">No VST plugins found</p>
              <p className="text-[11px] text-[#3a3a4a]">
                Click &quot;Add Folder&quot; to point TRAX at your plugin directory.
              </p>
              <button
                onClick={addCustomDir}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[#6c63ff]/20 hover:bg-[#6c63ff]/30 text-[#6c63ff] transition-colors border border-[#6c63ff]/30"
              >
                <FolderOpen size={12} />
                Browse for plugins
              </button>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="divide-y divide-[#1a1a24]">
              {filtered.map((plugin) => {
                const isSelected = plugin.path === selected
                return (
                  <button
                    key={plugin.path}
                    onClick={() => { onSelect(plugin); onClose() }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#1a1a24] transition-colors',
                      isSelected && 'bg-[#1e1e2e]'
                    )}
                  >
                    {/* Format badge */}
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: FORMAT_COLOR[plugin.format] + '22',
                        color: FORMAT_COLOR[plugin.format],
                        border: `1px solid ${FORMAT_COLOR[plugin.format]}44`,
                      }}
                    >
                      {plugin.format}
                    </span>

                    {/* Icon */}
                    <span className="text-[#55557a] shrink-0">
                      {CATEGORY_ICON(plugin.category)}
                    </span>

                    {/* Name + vendor */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#e8e8f0] truncate">
                        {plugin.name}
                      </div>
                      <div className="text-[10px] text-[#55557a] truncate">
                        {plugin.vendor} · {plugin.category}
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <Check size={13} className="text-[#6c63ff] shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {electron && filtered.length === 0 && plugins.length > 0 && (
            <div className="flex items-center justify-center h-24">
              <span className="text-xs text-[#55557a]">No plugins match &quot;{query}&quot;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
