import { BookOpen, Clock, Search, PlusCircle, Home, Tag } from 'lucide-react';
import { useKBStore, selectAllTags } from '@/store/kb-store';
import { CATEGORIES, type Category } from '@/types';
import { CATEGORY_DOT } from '@/types';

export function Sidebar() {
  const view = useKBStore((s) => s.view);
  const setView = useKBStore((s) => s.setView);
  const startNew = useKBStore((s) => s.startNew);
  const filterCategory = useKBStore((s) => s.filterCategory);
  const filterTag = useKBStore((s) => s.filterTag);
  const setFilterCategory = useKBStore((s) => s.setFilterCategory);
  const setFilterTag = useKBStore((s) => s.setFilterTag);
  const articles = useKBStore((s) => s.articles);
  const tags = useKBStore(selectAllTags);

  const countFor = (cat: Category) => articles.filter((a) => a.category === cat).length;

  const navItem = (
    icon: React.ReactNode,
    label: string,
    active: boolean,
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-violet-600/20 text-violet-300'
          : 'text-[#6666a0] hover:text-[#c8c8e8] hover:bg-[#1e1e32]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1 border-r border-[#1e1e32] bg-[#0e0e1a] pt-4 pb-4 overflow-y-auto">
      <div className="px-3 mb-3">
        <button
          onClick={startNew}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle size={15} />
          New Article
        </button>
      </div>

      <div className="px-3 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5c] mb-1">Navigate</p>
      </div>

      {navItem(<Home size={14} />, 'Home', view === 'home' && !filterCategory && !filterTag, () => {
        setView('home');
        setFilterCategory(null);
        setFilterTag(null);
      })}
      {navItem(<Clock size={14} />, 'Timeline', view === 'timeline', () => {
        setView('timeline');
        setFilterCategory(null);
        setFilterTag(null);
      })}
      {navItem(<Search size={14} />, 'Search', view === 'home' && !!useKBStore.getState().searchQuery, () => {
        setView('home');
        setFilterCategory(null);
        setFilterTag(null);
      })}

      <div className="px-3 mt-4 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5c] mb-1">Categories</p>
      </div>

      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => {
            setFilterCategory(filterCategory === cat ? null : cat);
            setView('home');
          }}
          className={`flex items-center justify-between gap-2 w-full px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filterCategory === cat
              ? 'bg-violet-600/20 text-violet-300'
              : 'text-[#6666a0] hover:text-[#c8c8e8] hover:bg-[#1e1e32]'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[cat]}`} />
            <span className="text-xs">{cat}</span>
          </span>
          <span className="text-[10px] text-[#3a3a5c]">{countFor(cat)}</span>
        </button>
      ))}

      {tags.length > 0 && (
        <>
          <div className="px-3 mt-4 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5c] mb-1 flex items-center gap-1">
              <Tag size={9} /> Tags
            </p>
          </div>
          <div className="px-3 flex flex-wrap gap-1">
            {tags.slice(0, 20).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilterTag(filterTag === t ? null : t);
                  setView('home');
                }}
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono transition-colors ${
                  filterTag === t
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#1e1e32] text-[#6666a0] hover:bg-[#2a2a45] hover:text-[#a0a0d0]'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1" />

      <div className="px-3 pt-3 border-t border-[#1e1e32]">
        <div className="flex items-center gap-2 text-[#3a3a5c]">
          <BookOpen size={12} />
          <span className="text-[10px]">{articles.length} articles</span>
        </div>
      </div>
    </aside>
  );
}
