import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useKBStore } from '@/store/kb-store';
import { CATEGORIES, type Article, type Category } from '@/types';
import { renderMarkdown } from '@/utils/markdown';

const EMPTY: Partial<Article> = {
  title: '',
  subtitle: '',
  content: '',
  category: 'Concept',
  tags: [],
  year: undefined,
  yearEnd: undefined,
};

export function ArticleEditor() {
  const editingArticleId = useKBStore((s) => s.editingArticleId);
  const articles = useKBStore((s) => s.articles);
  const cancelEdit = useKBStore((s) => s.cancelEdit);
  const saveArticle = useKBStore((s) => s.saveArticle);

  const existing = editingArticleId ? articles.find((a) => a.id === editingArticleId) : null;

  const [form, setForm] = useState<Partial<Article>>(existing ?? EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(existing ?? EMPTY);
    setTagInput('');
    setPreview(false);
  }, [editingArticleId]);

  const set = <K extends keyof Article>(key: K, val: Article[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t) return;
    const tags = form.tags ?? [];
    if (!tags.includes(t)) setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }));
    setTagInput('');
  };

  const removeTag = (t: string) =>
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((x) => x !== t) }));

  const handleSave = async () => {
    if (!form.title?.trim()) { alert('Title is required'); return; }
    setSaving(true);
    await saveArticle({
      id: existing?.id,
      createdAt: existing?.createdAt,
      title: form.title!,
      subtitle: form.subtitle || undefined,
      content: form.content ?? '',
      category: (form.category ?? 'Concept') as Category,
      tags: form.tags ?? [],
      year: form.year,
      yearEnd: form.yearEnd,
      sortKey: form.sortKey,
    });
    setSaving(false);
  };

  const label = 'text-[10px] font-semibold uppercase tracking-widest text-[#6666a0] mb-1.5 block';
  const input = 'w-full bg-[#12121e] border border-[#1e1e32] rounded-lg px-3 py-2 text-sm text-[#c8c8e8] placeholder:text-[#3a3a5c] outline-none focus:border-violet-600/50 transition-colors';

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1e1e32] shrink-0">
        <button
          onClick={cancelEdit}
          className="flex items-center gap-1.5 text-xs text-[#6666a0] hover:text-[#c8c8e8] transition-colors"
        >
          <ArrowLeft size={13} />
          Cancel
        </button>
        <h2 className="text-sm font-semibold text-[#c8c8e8] ml-2">
          {existing ? 'Edit Article' : 'New Article'}
        </h2>
        <div className="flex-1" />
        <button
          onClick={() => setPreview(!preview)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            preview
              ? 'bg-violet-600/20 text-violet-300'
              : 'bg-[#1e1e32] text-[#c8c8e8] hover:bg-[#2a2a45]'
          }`}
        >
          <Eye size={12} />
          Preview
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
        >
          <Save size={12} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Form */}
        <div className={`flex flex-col gap-5 p-6 overflow-y-auto ${preview ? 'w-1/2 border-r border-[#1e1e32]' : 'w-full max-w-3xl mx-auto'}`}>
          {/* Title */}
          <div>
            <label className={label}>Title *</label>
            <input
              className={input}
              placeholder="Article title"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className={label}>Subtitle / Date Range</label>
            <input
              className={input}
              placeholder="e.g. 1990 – 1994, or artist's real name"
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value)}
            />
          </div>

          {/* Category + Years */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={label}>Category</label>
              <select
                className={input}
                value={form.category ?? 'Concept'}
                onChange={(e) => set('category', e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Year (start)</label>
              <input
                className={input}
                type="number"
                placeholder="1990"
                value={form.year ?? ''}
                onChange={(e) => set('year', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <label className={label}>Year (end)</label>
              <input
                className={input}
                type="number"
                placeholder="1996"
                value={form.yearEnd ?? ''}
                onChange={(e) => set('yearEnd', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={label}>Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                className={`${input} flex-1`}
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                }}
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-lg bg-[#1e1e32] text-xs text-[#c8c8e8] hover:bg-[#2a2a45] transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.tags ?? []).map((t) => (
                <button
                  key={t}
                  onClick={() => removeTag(t)}
                  className="inline-flex items-center gap-1 bg-violet-600/20 text-violet-300 text-[11px] font-mono rounded px-2 py-0.5 hover:bg-rose-900/30 hover:text-rose-400 transition-colors"
                >
                  #{t} ×
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <label className={label}>Content (Markdown)</label>
            <textarea
              className={`${input} flex-1 min-h-[400px] font-mono text-xs leading-relaxed resize-none`}
              placeholder={`## Overview\n\nWrite your article content here. Markdown is supported.\n\n## Key Points\n\n- Point one\n- Point two`}
              value={form.content ?? ''}
              onChange={(e) => set('content', e.target.value)}
            />
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="w-1/2 overflow-y-auto px-8 py-6">
            <h1 className="text-2xl font-bold text-[#e8e8f8] mb-1">{form.title || 'Untitled'}</h1>
            {form.subtitle && <p className="text-base text-[#6666a0] mb-6">{form.subtitle}</p>}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content ?? '') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
