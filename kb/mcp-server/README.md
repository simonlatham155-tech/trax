# Progressive House KB — MCP Server

An MCP (Model Context Protocol) server that exposes the Progressive House & Trance knowledge base to AI tools — including Cursor, Claude Desktop, and any other MCP-compatible client.

## What It Provides

Four tools:

| Tool | Description |
|------|-------------|
| `list_articles` | List all articles with metadata (category, year, tags). Supports optional category filter. |
| `get_article` | Get the full content of any article by id or title keyword. |
| `search_articles` | Full-text + category + tag search across all articles. |
| `get_full_context` | Return the entire knowledge base as a single formatted markdown document. |

## Quick Start

```bash
cd kb/mcp-server
npm install    # already done if you ran the parent install
npm run dev    # runs with tsx (no build needed)
```

## Connect to Cursor

Add this to your `.cursor/mcp.json` (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "progressive-house-kb": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/kb/mcp-server/src/index.ts"],
      "description": "Personal knowledge base: Progressive House origins and evolution into Trance"
    }
  }
}
```

Replace `/absolute/path/to/` with the actual path to this repo.

## Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "progressive-house-kb": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/kb/mcp-server/src/index.ts"]
    }
  }
}
```

## How Articles Are Stored

The server reads directly from `kb/articles/*.md` — plain markdown files with YAML frontmatter. There is no database. Add or edit articles by editing those files; the server picks up changes on every request (no restart needed).

## Build (optional)

```bash
npm run build   # compiles to dist/index.js
npm start       # runs compiled version
```
