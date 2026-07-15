import { useKBStore, selectFiltered } from '@/store/kb-store';
import { ArticleCard } from './ArticleCard';
import { CATEGORIES, type Category } from '@/types';
import { CategoryBadge } from '@/components/common/CategoryBadge';

export function ArticleList() {
  const articles = useKBStore(selectFiltered);
  const filterCategory = useKBStore((s) => s.filterCategory);
  const searchQuery = useKBStore((s) => s.searchQuery);
  const filterTag = useKBStore((s) => s.filterTag);

  const isFiltered = filterCategory || searchQuery || filterTag;

  if (isFiltered) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-xs text-[#6666a0] mb-4">
          {articles.length} result{articles.length !== 1 ? 's' : ''}
          {filterCategory && <> in <strong className="text-[#c8c8e8]">{filterCategory}</strong></>}
          {filterTag && <> tagged <strong className="text-[#c8c8e8]">#{filterTag}</strong></>}
          {searchQuery && <> matching <strong className="text-[#c8c8e8]">"{searchQuery}"</strong></>}
        </p>
        {articles.length === 0 ? (
          <div className="text-center py-16 text-[#3a3a5c]">
            <p className="text-sm">No articles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    cat,
    items: articles.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
      {grouped.map(({ cat, items }) => (
        <section key={cat}>
          <div className="flex items-center gap-3 mb-3">
            <CategoryBadge category={cat as Category} dot size="md" />
            <span className="text-[11px] text-[#3a3a5c]">{items.length} articles</span>
            <div className="flex-1 h-px bg-[#1e1e32]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
