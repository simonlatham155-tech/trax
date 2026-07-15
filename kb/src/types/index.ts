export type Category =
  | 'Era'
  | 'Artist'
  | 'Label'
  | 'Track'
  | 'Venue / Event'
  | 'Concept'
  | 'Personal Memory';

export const CATEGORIES: Category[] = [
  'Era',
  'Artist',
  'Label',
  'Track',
  'Venue / Event',
  'Concept',
  'Personal Memory',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Era': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  'Artist': 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  'Label': 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  'Track': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Venue / Event': 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  'Concept': 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  'Personal Memory': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
};

export const CATEGORY_DOT: Record<Category, string> = {
  'Era': 'bg-amber-400',
  'Artist': 'bg-violet-400',
  'Label': 'bg-teal-400',
  'Track': 'bg-emerald-400',
  'Venue / Event': 'bg-rose-400',
  'Concept': 'bg-sky-400',
  'Personal Memory': 'bg-orange-400',
};

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: Category;
  tags: string[];
  year?: number;
  yearEnd?: number;
  /** ISO string */
  createdAt: string;
  updatedAt: string;
  /** User-set sort order within the timeline */
  sortKey?: number;
}

export type View = 'home' | 'timeline' | 'article' | 'editor';
