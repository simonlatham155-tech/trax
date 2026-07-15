import type { Article } from '@/types';

function articleToMarkdown(article: Article): string {
  const yearStr = article.year
    ? article.yearEnd && article.yearEnd !== article.year
      ? ` (${article.year}–${article.yearEnd})`
      : ` (${article.year})`
    : '';

  const lines: string[] = [
    `### ${article.title}${yearStr}`,
    ...(article.subtitle ? [`*${article.subtitle}*`] : []),
    `**Category:** ${article.category}`,
    ...(article.tags.length > 0 ? [`**Tags:** ${article.tags.join(', ')}`] : []),
    '',
    article.content,
  ];

  return lines.join('\n');
}

export function buildFullContextMarkdown(articles: Article[]): string {
  const ORDER = ['Era', 'Concept', 'Artist', 'Label', 'Track', 'Venue / Event', 'Personal Memory'];

  const sorted = [...articles].sort(
    (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title)
  );

  const byCategory = new Map<string, Article[]>();
  for (const a of sorted) {
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }

  const lines: string[] = [
    `# Progressive House & the Birth of Trance — Personal Knowledge Base`,
    '',
    `This document contains ${articles.length} articles — a personal knowledge base about the origins of progressive house music and how it evolved into modern trance.`,
    '',
    '---',
    '',
  ];

  for (const cat of ORDER) {
    const items = byCategory.get(cat);
    if (!items || items.length === 0) continue;
    lines.push(`## ${cat}s`);
    lines.push('');
    for (const a of items) {
      lines.push(articleToMarkdown(a));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function downloadText(content: string, filename: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
