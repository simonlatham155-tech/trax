/**
 * Minimal markdown → HTML renderer.
 * Supports: h1-h3, bold, italic, code, blockquote, ul/ol, hr, paragraphs, links.
 */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  const inline = (s: string): string =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (/^### /.test(line)) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (/^## /.test(line))  { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (/^# /.test(line))   { closeList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }

    // HR
    if (/^---+$/.test(line.trim())) { closeList(); out.push('<hr>'); continue; }

    // Blockquote
    if (/^> /.test(line)) { closeList(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }

    // UL
    if (/^- /.test(line)) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }

    // OL
    if (/^\d+\. /.test(line)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      out.push('');
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();

  // Merge consecutive <p> tags separated by empty strings (double newlines become one gap)
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
