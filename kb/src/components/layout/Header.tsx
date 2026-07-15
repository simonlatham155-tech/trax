import { useState } from 'react';
import { Search, X, Download, Copy, Check, ChevronDown } from 'lucide-react';
import { useKBStore } from '@/store/kb-store';
import { buildFullContextMarkdown, downloadText, copyToClipboard } from '@/utils/export';

function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const articles = useKBStore((s) => s.articles);

  const handleDownloadMd = () => {
    const md = buildFullContextMarkdown(articles);
    downloadText(md, 'progressive-house-kb.md', 'text/markdown');
    setOpen(false);
  };

  const handleDownloadJson = () => {
    const json = JSON.stringify(
      articles.map(({ content, ...meta }) => ({ ...meta, content })),
      null,
      2
    );
    downloadText(json, 'progressive-house-kb.json', 'application/json');
    setOpen(false);
  };

  const handleCopy = async () => {
    const md = buildFullContextMarkdown(articles);
    await copyToClipboard(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1e1e32] text-[#a0a0d0] hover:bg-[#2a2a45] hover:text-[#e8e8f8] transition-colors"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Download size={12} />}
        <span>Export for AI</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-[#18182a] border border-[#2a2a45] shadow-2xl overflow-hidden">
            <div className="px-3 pt-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5c]">
                Export {articles.length} articles
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#c8c8e8] hover:bg-[#2a2a45] transition-colors text-left"
            >
              <Copy size={13} className="text-violet-400 shrink-0" />
              <div>
                <p className="text-xs font-medium">Copy to clipboard</p>
                <p className="text-[10px] text-[#6666a0]">Paste into any AI chat</p>
              </div>
            </button>

            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#c8c8e8] hover:bg-[#2a2a45] transition-colors text-left"
            >
              <Download size={13} className="text-teal-400 shrink-0" />
              <div>
                <p className="text-xs font-medium">Download .md</p>
                <p className="text-[10px] text-[#6666a0]">Upload to Claude, GPT, etc.</p>
              </div>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#c8c8e8] hover:bg-[#2a2a45] transition-colors text-left"
            >
              <Download size={13} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-medium">Download .json</p>
                <p className="text-[10px] text-[#6666a0]">Structured data for tools</p>
              </div>
            </button>

            <div className="px-3 py-2.5 border-t border-[#1e1e32]">
              <p className="text-[10px] text-[#3a3a5c] leading-relaxed">
                Articles also live as <span className="font-mono text-[#6666a0]">kb/articles/*.md</span> — point any AI tool or MCP server at that folder directly.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Header() {
  const searchQuery = useKBStore((s) => s.searchQuery);
  const setSearch = useKBStore((s) => s.setSearch);
  const setView = useKBStore((s) => s.setView);
  const filterCategory = useKBStore((s) => s.filterCategory);
  const filterTag = useKBStore((s) => s.filterTag);
  const setFilterCategory = useKBStore((s) => s.setFilterCategory);
  const setFilterTag = useKBStore((s) => s.setFilterTag);

  const hasFilter = filterCategory || filterTag;

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-[#1e1e32] bg-[#0e0e1a] shrink-0">
      {/* Logo / title */}
      <div className="flex items-center gap-3 mr-2">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">PH</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-[#e8e8f8]">Progressive House</p>
          <p className="text-[10px] text-[#3a3a5c]">& the Birth of Trance — Knowledge Base</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a3a5c]" />
        <input
          type="text"
          placeholder="Search articles, artists, tracks…"
          value={searchQuery}
          onChange={(e) => {
            setSearch(e.target.value);
            setView('home');
          }}
          className="w-full bg-[#12121e] border border-[#1e1e32] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[#c8c8e8] placeholder:text-[#3a3a5c] outline-none focus:border-violet-600/50 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a3a5c] hover:text-[#c8c8e8]">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Active filters */}
      {hasFilter && (
        <div className="flex items-center gap-2">
          {filterCategory && (
            <span className="flex items-center gap-1.5 text-xs bg-violet-600/20 text-violet-300 border border-violet-600/30 rounded-full px-2.5 py-0.5">
              {filterCategory}
              <button onClick={() => setFilterCategory(null)}><X size={10} /></button>
            </span>
          )}
          {filterTag && (
            <span className="flex items-center gap-1.5 text-xs bg-[#1e1e32] text-[#a0a0d0] rounded-full px-2.5 py-0.5">
              #{filterTag}
              <button onClick={() => setFilterTag(null)}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex-1" />

      <ExportMenu />
    </header>
  );
}
