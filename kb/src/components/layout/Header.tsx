import { Search, X } from 'lucide-react';
import { useKBStore } from '@/store/kb-store';

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
    </header>
  );
}
