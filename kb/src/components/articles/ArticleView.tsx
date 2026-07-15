import { ArrowLeft, Pencil, Trash2, Calendar } from 'lucide-react';
import { useKBStore } from '@/store/kb-store';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Tag } from '@/components/common/Tag';
import { renderMarkdown } from '@/utils/markdown';

export function ArticleView() {
  const activeArticleId = useKBStore((s) => s.activeArticleId);
  const articles = useKBStore((s) => s.articles);
  const closeArticle = useKBStore((s) => s.closeArticle);
  const startEdit = useKBStore((s) => s.startEdit);
  const deleteArticle = useKBStore((s) => s.deleteArticle);
  const setFilterTag = useKBStore((s) => s.setFilterTag);

  const article = articles.find((a) => a.id === activeArticleId);
  if (!article) return null;

  const yearLabel =
    article.year != null
      ? article.yearEnd != null
        ? `${article.year} – ${article.yearEnd}`
        : String(article.year)
      : null;

  const handleDelete = () => {
    if (window.confirm(`Delete "${article.title}"? This cannot be undone.`)) {
      deleteArticle(article.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1e1e32] shrink-0">
        <button
          onClick={closeArticle}
          className="flex items-center gap-1.5 text-xs text-[#6666a0] hover:text-[#c8c8e8] transition-colors"
        >
          <ArrowLeft size={13} />
          Back
        </button>
        <div className="flex-1" />
        <button
          onClick={() => startEdit(article.id)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1e1e32] text-[#c8c8e8] hover:bg-[#2a2a45] transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 transition-colors"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl w-full mx-auto px-8 py-8">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <CategoryBadge category={article.category} dot size="md" />
          {yearLabel && (
            <span className="flex items-center gap-1 text-xs text-[#6666a0]">
              <Calendar size={11} />
              {yearLabel}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-[#e8e8f8] leading-tight mb-1">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-base text-[#6666a0] mb-6">{article.subtitle}</p>
        )}

        {/* Body */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-[#1e1e32]">
            {article.tags.map((t) => (
              <Tag
                key={t}
                tag={t}
                onClick={() => setFilterTag(t)}
              />
            ))}
          </div>
        )}

        <p className="text-[10px] text-[#3a3a5c] mt-6">
          Updated {new Date(article.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
