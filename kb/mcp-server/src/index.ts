#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  listArticles,
  getArticle,
  searchArticles,
  buildFullContext,
} from './articles.js';

const server = new McpServer({
  name: 'progressive-house-kb',
  version: '1.0.0',
});

// ── Tool: list_articles ────────────────────────────────────────────────────────
server.tool(
  'list_articles',
  'List all articles in the Progressive House & Trance knowledge base with their metadata (id, title, category, year, tags). Use this to discover what is available before fetching specific articles.',
  {
    category: z
      .string()
      .optional()
      .describe(
        'Filter by category: Era, Artist, Label, Track, Venue / Event, Concept, Personal Memory'
      ),
  },
  async ({ category }) => {
    const articles = listArticles();
    const filtered = category
      ? articles.filter((a) =>
          a.category.toLowerCase().includes(category.toLowerCase())
        )
      : articles;

    const lines = filtered.map((a) => {
      const year = a.year
        ? a.yearEnd && a.yearEnd !== a.year
          ? ` [${a.year}–${a.yearEnd}]`
          : ` [${a.year}]`
        : '';
      const tags = a.tags.length > 0 ? ` | tags: ${a.tags.join(', ')}` : '';
      return `• [${a.category}] ${a.title}${year}${tags}  (id: ${a.id})`;
    });

    return {
      content: [
        {
          type: 'text',
          text:
            `Found ${filtered.length} article(s):\n\n` + lines.join('\n'),
        },
      ],
    };
  }
);

// ── Tool: get_article ──────────────────────────────────────────────────────────
server.tool(
  'get_article',
  'Get the full content of a specific article from the Progressive House & Trance knowledge base by its id or title.',
  {
    id_or_title: z
      .string()
      .describe(
        'The article id (e.g. "seed-010") or a title keyword (e.g. "Sasha", "birth of progressive house")'
      ),
  },
  async ({ id_or_title }) => {
    const article = getArticle(id_or_title);

    if (!article) {
      return {
        content: [
          {
            type: 'text',
            text: `No article found matching "${id_or_title}". Use list_articles to see available articles.`,
          },
        ],
      };
    }

    const yearStr = article.year
      ? article.yearEnd && article.yearEnd !== article.year
        ? ` (${article.year}–${article.yearEnd})`
        : ` (${article.year})`
      : '';

    const header = [
      `# ${article.title}${yearStr}`,
      article.subtitle ? `*${article.subtitle}*` : '',
      `**Category:** ${article.category}`,
      article.tags.length > 0 ? `**Tags:** ${article.tags.join(', ')}` : '',
      '',
      '---',
      '',
    ]
      .filter((l) => l !== null)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: header + article.content,
        },
      ],
    };
  }
);

// ── Tool: search_articles ──────────────────────────────────────────────────────
server.tool(
  'search_articles',
  'Search the Progressive House & Trance knowledge base by keyword, category, or tag. Returns matching articles with their full content.',
  {
    query: z
      .string()
      .optional()
      .describe('Free-text keyword to search across titles, content, and tags'),
    category: z
      .string()
      .optional()
      .describe('Filter by category: Era, Artist, Label, Track, Venue / Event, Concept'),
    tag: z
      .string()
      .optional()
      .describe('Filter by tag (e.g. "UK", "trance", "Sasha", "1990s")'),
  },
  async ({ query, category, tag }) => {
    if (!query && !category && !tag) {
      return {
        content: [
          {
            type: 'text',
            text: 'Please provide at least one of: query, category, or tag.',
          },
        ],
      };
    }

    const results = searchArticles({ query, category, tag });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No articles matched your search. Try broader terms or use list_articles to see all available articles.',
          },
        ],
      };
    }

    const parts = results.map((a) => {
      const yearStr = a.year
        ? a.yearEnd && a.yearEnd !== a.year
          ? ` (${a.year}–${a.yearEnd})`
          : ` (${a.year})`
        : '';
      return `## ${a.title}${yearStr}\n*${a.category}*${a.tags.length > 0 ? ' · ' + a.tags.join(', ') : ''}\n\n${a.content}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} result(s):\n\n---\n\n` + parts.join('\n\n---\n\n'),
        },
      ],
    };
  }
);

// ── Tool: get_full_context ─────────────────────────────────────────────────────
server.tool(
  'get_full_context',
  'Get the entire Progressive House & Trance knowledge base as a single formatted document. Use this when you need comprehensive context about the topic — the full history from progressive house origins through to modern trance, including all artists, labels, tracks, venues, and conceptual articles.',
  {},
  async () => {
    const doc = buildFullContext();
    return {
      content: [
        {
          type: 'text',
          text: doc,
        },
      ],
    };
  }
);

// ── Start ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[phkb-mcp] Progressive House KB MCP server running on stdio');
}

main().catch((err) => {
  console.error('[phkb-mcp] Fatal error:', err);
  process.exit(1);
});
