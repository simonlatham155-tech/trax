import { create } from 'zustand';
import type { Article, Category, View } from '@/types';
import {
  listArticles,
  saveArticle,
  deleteArticle,
  bulkSaveArticles,
} from '@/persistence/db';
import { generateId } from '@/utils/id';
import { SEED_ARTICLES } from '@/data/seed';

interface KBState {
  articles: Article[];
  isLoading: boolean;
  view: View;
  activeArticleId: string | null;
  editingArticleId: string | null;
  searchQuery: string;
  filterCategory: Category | null;
  filterTag: string | null;

  // Actions
  init: () => Promise<void>;
  setView: (view: View) => void;
  openArticle: (id: string) => void;
  closeArticle: () => void;
  startNew: () => void;
  startEdit: (id: string) => void;
  cancelEdit: () => void;
  saveArticle: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string }) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  setSearch: (q: string) => void;
  setFilterCategory: (c: Category | null) => void;
  setFilterTag: (t: string | null) => void;
  resetSeed: () => Promise<void>;
}

export const useKBStore = create<KBState>()((set, get) => ({
  articles: [],
  isLoading: true,
  view: 'home',
  activeArticleId: null,
  editingArticleId: null,
  searchQuery: '',
  filterCategory: null,
  filterTag: null,

  init: async () => {
    set({ isLoading: true });
    let articles = await listArticles();
    if (articles.length === 0) {
      await bulkSaveArticles(SEED_ARTICLES);
      articles = SEED_ARTICLES;
    }
    set({ articles, isLoading: false });
  },

  setView: (view) => set({ view }),

  openArticle: (id) => set({ activeArticleId: id, view: 'article', editingArticleId: null }),

  closeArticle: () => set({ activeArticleId: null, view: 'home', editingArticleId: null }),

  startNew: () => set({ editingArticleId: null, view: 'editor' }),

  startEdit: (id) => set({ editingArticleId: id, view: 'editor' }),

  cancelEdit: () => {
    const { activeArticleId } = get();
    set({
      view: activeArticleId ? 'article' : 'home',
      editingArticleId: null,
    });
  },

  saveArticle: async (data) => {
    const now = new Date().toISOString();
    const existing = data.id ? get().articles.find((a) => a.id === data.id) : null;

    const article: Article = {
      ...data,
      id: data.id ?? generateId(),
      createdAt: data.createdAt ?? existing?.createdAt ?? now,
      updatedAt: now,
    };

    await saveArticle(article);

    set((s) => {
      const idx = s.articles.findIndex((a) => a.id === article.id);
      const updated =
        idx >= 0
          ? s.articles.map((a) => (a.id === article.id ? article : a))
          : [...s.articles, article];
      return {
        articles: updated,
        activeArticleId: article.id,
        editingArticleId: null,
        view: 'article',
      };
    });
  },

  deleteArticle: async (id) => {
    await deleteArticle(id);
    set((s) => ({
      articles: s.articles.filter((a) => a.id !== id),
      activeArticleId: s.activeArticleId === id ? null : s.activeArticleId,
      editingArticleId: s.editingArticleId === id ? null : s.editingArticleId,
      view: 'home',
    }));
  },

  setSearch: (q) => set({ searchQuery: q }),

  setFilterCategory: (c) => set({ filterCategory: c }),

  setFilterTag: (t) => set({ filterTag: t }),

  resetSeed: async () => {
    await bulkSaveArticles(SEED_ARTICLES);
    const articles = await listArticles();
    set({ articles });
  },
}));

// Derived selectors
export function selectFiltered(state: KBState): Article[] {
  const { articles, searchQuery, filterCategory, filterTag } = state;
  let result = articles;

  if (filterCategory) {
    result = result.filter((a) => a.category === filterCategory);
  }
  if (filterTag) {
    result = result.filter((a) => a.tags.includes(filterTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

export function selectAllTags(state: KBState): string[] {
  const tagSet = new Set<string>();
  state.articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
