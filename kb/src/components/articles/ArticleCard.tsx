import type { Article } from '@/types';
import { useKBStore } from '@/store/kb-store';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Tag } from '@/components/common/Tag';

interface Props {
  article: Article;
}

function excerpt(content: string, maxLen = 140): string {
  const stripped = content
    .replace(/^#+\s.+$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^-\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen).trim() + '…' : stripped;
}

export function ArticleCard({ article }: Props) {
  const openArticle = useKBStore((s) => s.openArticle);
  const setFilterTag = useKBStore((s) => s.setFilterTag);
  const filterTag = useKBStore((s) => s.filterTag);

  const yearLabel =
    article.year != null
      ? article.yearEnd != null
        ? `${article.year} – ${article.yearEnd}`
        : String(article.year)
      : null;

  return (
    <article
      onClick={() => openArticle(article.id)}
      className="group flex flex-col gap-2 p-4 rounded-xl bg-[#12121e] border border-[#1e1e32] hover:border-violet-600/40 hover:bg-[#14142a] cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#e8e8f8] group-hover:text-violet-300 transition-colors leading-snug">
            {article.title}
          </h3>
          {article.subtitle && (
            <p className="text-[11px] text-[#6666a0] mt-0.5">{article.subtitle}</p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <CategoryBadge category={article.category} dot />
          {yearLabel && (
            <span className="text-[10px] font-mono text-[#3a3a5c]">{yearLabel}</span>
          )}
        </div>
      </div>

      <p className="text-[12px] text-[#6666a0] leading-relaxed line-clamp-3">
        {excerpt(article.content)}
      </p>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {article.tags.slice(0, 5).map((t) => (
            <Tag
              key={t}
              tag={t}
              active={filterTag === t}
              onClick={() => setFilterTag(filterTag === t ? null : t)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
