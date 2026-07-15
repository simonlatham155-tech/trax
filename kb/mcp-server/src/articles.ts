import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve to kb/articles/ relative to mcp-server/src/
const ARTICLES_DIR = join(__dirname, '../../articles');

export interface ArticleMeta {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  year?: number;
  yearEnd?: number;
  tags: string[];
  filename: string;
}

export interface Article extends ArticleMeta {
  content: string;
}

function parseFile(filename: string): Article {
  const filepath = join(ARTICLES_DIR, filename);
  const raw = readFileSync(filepath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    id: data.id ?? filename.replace('.md', ''),
    title: data.title ?? '',
    subtitle: data.subtitle,
    category: data.category ?? 'Concept',
    year: data.year,
    yearEnd: data.yearEnd,
    tags: Array.isArray(data.tags) ? data.tags : [],
    filename,
    content: content.trim(),
  };
}

export function listArticles(): ArticleMeta[] {
  try {
    const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
    return files.map((f) => {
      const a = parseFile(f);
      const { content: _content, ...meta } = a;
      void _content;
      return meta;
    });
  } catch {
    return [];
  }
}

export function getAllArticles(): Article[] {
  try {
    const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
    return files.map(parseFile);
  } catch {
    return [];
  }
}

export function getArticle(idOrTitle: string): Article | undefined {
  const articles = getAllArticles();
  const q = idOrTitle.toLowerCase();
  return articles.find(
    (a) =>
      a.id.toLowerCase() === q ||
      a.title.toLowerCase() === q ||
      a.filename.replace('.md', '').toLowerCase() === q ||
      a.title.toLowerCase().includes(q)
  );
}

export function searchArticles(opts: {
  query?: string;
  category?: string;
  tag?: string;
}): Article[] {
  let results = getAllArticles();

  if (opts.category) {
    const cat = opts.category.toLowerCase();
    results = results.filter((a) => a.category.toLowerCase().includes(cat));
  }

  if (opts.tag) {
    const tag = opts.tag.toLowerCase();
    results = results.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes(tag))
    );
  }

  if (opts.query) {
    const q = opts.query.toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => String(t).toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    );
  }

  return results;
}

export function buildFullContext(): string {
  const articles = getAllArticles();

  // Sort by sortKey / year / title
  articles.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title));

  const sections: string[] = [
    `# Progressive House & the Birth of Trance — Personal Knowledge Base`,
    ``,
    `This document contains ${articles.length} articles organised as a personal knowledge base about the origins of progressive house music and how it evolved into modern trance. The content reflects personal experiences and deep familiarity with the scene.`,
    ``,
    `---`,
    ``,
  ];

  const byCategory = new Map<string, Article[]>();
  for (const a of articles) {
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }

  const ORDER = ['Era', 'Concept', 'Artist', 'Label', 'Track', 'Venue / Event', 'Personal Memory'];

  for (const cat of ORDER) {
    const items = byCategory.get(cat);
    if (!items || items.length === 0) continue;

    sections.push(`## ${cat}s`);
    sections.push('');

    for (const a of items) {
      const yearStr = a.year
        ? a.yearEnd && a.yearEnd !== a.year
          ? ` (${a.year}–${a.yearEnd})`
          : ` (${a.year})`
        : '';
      sections.push(`### ${a.title}${yearStr}`);
      if (a.subtitle) sections.push(`*${a.subtitle}*`);
      if (a.tags.length > 0) sections.push(`Tags: ${a.tags.join(', ')}`);
      sections.push('');
      sections.push(a.content);
      sections.push('');
      sections.push('---');
      sections.push('');
    }
  }

  return sections.join('\n');
}
