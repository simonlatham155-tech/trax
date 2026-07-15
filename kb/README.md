# Progressive House & Trance — Personal Knowledge Base

A standalone browser-based knowledge base for documenting personal experiences and knowledge about the origins of progressive house and its evolution into modern trance.

## Features

- **Articles** — write freeform entries in Markdown with title, subtitle, category, year range, and tags
- **Categories** — Era, Artist, Label, Track, Venue / Event, Concept, Personal Memory
- **Timeline** — chronological view of all dated articles with genre era markers
- **Search** — full-text search across titles, subtitles, content, and tags
- **Tag filtering** — click any tag to filter the article list
- **Markdown editor** — with live preview split-pane
- **Persistent storage** — all articles stored in IndexedDB; survives browser restarts
- **Seed content** — ships with ~20 foundational articles covering the genre history

## Quick Start

```bash
cd kb
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Production Build

```bash
npm run build
npm run preview
```

## Adding Your Own Articles

Click **New Article** in the sidebar. Fill in:

- **Title** — the subject
- **Subtitle** — optional secondary label (e.g. real name of an artist, date range)
- **Category** — pick the category that fits best
- **Year / Year end** — used for the timeline view
- **Tags** — lowercase keywords for cross-referencing
- **Content** — Markdown text; the editor has a live preview pane

## Stack

| Layer | Library |
|-------|---------|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Persistence | IndexedDB (native) |
| Icons | Lucide React |

## Structure

```
kb/
└── src/
    ├── types/        # Article type, Category enum, colour maps
    ├── persistence/  # IndexedDB CRUD via db.ts
    ├── store/        # Zustand store (kb-store.ts)
    ├── data/         # Seed articles (seed.ts)
    ├── utils/        # id generator, markdown renderer
    └── components/
        ├── layout/   # Header, Sidebar
        ├── articles/ # ArticleList, ArticleCard, ArticleView
        ├── editor/   # ArticleEditor (markdown + preview)
        ├── timeline/ # TimelineView
        └── common/   # CategoryBadge, Tag
```
