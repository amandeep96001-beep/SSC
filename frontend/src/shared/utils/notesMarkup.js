function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBasicEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function isLikelyHtml(content) {
  if (!content) return false;
  return /<(?:p|h[1-6]|ul|ol|li|div|mark|br|strong|em|code|table|tr|td|th|span|blockquote|hr|pre|figure)\b/i.test(content);
}

const CALLOUT_RE = /^(definition|tip|note|remember|example|formula|trick|shortcut|important)\s*:/i;

const BOX_CHARS = /[┌┐└┘├┤┬┴┼═║│─━┃┏┓┗┛┣┫┳┻╋]/;
const ARROW_CHARS = /[▼▲►◀→←↓↑⟶⇢➥➜]/;

function looksLikeAsciiDiagram(text) {
  const lines = String(text || '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return false;
  const boxLines = lines.filter((l) => BOX_CHARS.test(l)).length;
  const arrowOnly = lines.filter((l) => /^\s*[↓↑▼▲→←➜]+\s*$/.test(l)).length;
  const connector = lines.filter((l) => /──►|-->|⇒|→/.test(l)).length;
  return boxLines >= 2 || (arrowOnly >= 1 && lines.length >= 3) || (connector >= 1 && boxLines >= 1);
}

function extractBoxLabels(text) {
  const labels = [];
  const lines = String(text || '').split('\n');

  // Horizontal multi-box rows: several │ title │ on one line with arrows between
  for (const line of lines) {
    if (!/│/.test(line)) continue;
    if (/└|┌|┬|┴|┼/.test(line)) continue;
    const cells = [];
    const re = /│([^│└┐]+?)│/g;
    let m;
    while ((m = re.exec(line))) {
      const inner = m[1].trim();
      if (inner) cells.push(inner);
    }
    if (cells.length >= 2) {
      // Pair title/subtitle across consecutive content rows handled below
      labels.push({ _rowCells: cells });
    }
  }

  if (labels.some((l) => l._rowCells)) {
    const rows = labels.filter((l) => l._rowCells).map((l) => l._rowCells);
    const width = Math.max(...rows.map((r) => r.length));
    const nodes = [];
    for (let i = 0; i < width; i += 1) {
      const title = rows[0]?.[i] || '';
      const subtitle = rows[1]?.[i] || '';
      if (title || subtitle) nodes.push({ title: title || subtitle, subtitle: title ? subtitle : '' });
    }
    if (nodes.length >= 2) return nodes;
  }

  // Vertical single-box stack
  let current = null;
  for (const line of lines) {
    if (/┌/.test(line) && /┐/.test(line)) {
      current = { title: '', subtitle: '' };
      continue;
    }
    if (current && /│/.test(line)) {
      const inner = line.replace(/^[^│]*│/, '').replace(/│[\s\S]*$/, '').trim();
      if (!inner) continue;
      if (!current.title) current.title = inner;
      else if (!current.subtitle) current.subtitle = inner;
      continue;
    }
    if (current && /└/.test(line) && /┘/.test(line)) {
      labels.push(current);
      current = null;
    }
  }
  return labels.filter((l) => !l._rowCells && (l.title || l.subtitle));
}

function extractArrowChain(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const nodes = [];
  for (const line of lines) {
    if (/^[↓↑▼▲→←➜─│\s]+$/.test(line)) continue;
    if (BOX_CHARS.test(line)) continue;
    nodes.push(line.replace(/\s+/g, ' ').trim());
  }
  return nodes;
}

function renderSequenceDiagram(nodes) {
  if (!nodes.length) return '';
  const parts = ['<figure class="notes-diagram notes-diagram--sequence" role="img" aria-label="Sequence diagram"><div class="notes-diagram__track">'];
  nodes.forEach((node, i) => {
    if (i > 0) parts.push('<span class="notes-diagram__arrow" aria-hidden="true">→</span>');
    const title = escapeHtml(node.title || node);
    const sub = node.subtitle ? `<span class="notes-diagram__sub">${escapeHtml(node.subtitle)}</span>` : '';
    parts.push(`<div class="notes-diagram__node"><span class="notes-diagram__title">${title}</span>${sub}</div>`);
  });
  parts.push('</div></figure>');
  return parts.join('');
}

function renderFlowDiagram(nodes) {
  if (!nodes.length) return '';
  const parts = ['<figure class="notes-diagram notes-diagram--flow" role="img" aria-label="Flowchart"><ol class="notes-diagram__steps">'];
  nodes.forEach((node) => {
    const title = typeof node === 'string' ? node : (node.title || '');
    const sub = typeof node === 'object' && node.subtitle ? `<span class="notes-diagram__sub">${escapeHtml(node.subtitle)}</span>` : '';
    parts.push(`<li class="notes-diagram__step"><span class="notes-diagram__title">${escapeHtml(title)}</span>${sub}</li>`);
  });
  parts.push('</ol></figure>');
  return parts.join('');
}

export function asciiDiagramToHtml(rawText) {
  const text = decodeBasicEntities(rawText).replace(/\r\n/g, '\n').trim();
  if (!looksLikeAsciiDiagram(text)) return null;

  const boxNodes = extractBoxLabels(text);
  const hasHorizontalArrows = /──►|-->|⇒/.test(text) || (text.includes('►') && text.split('\n').some((l) => /│/.test(l) && /──►|►/.test(l)));
  const hasVerticalFlow = /▼|↓/.test(text);

  if (boxNodes.length >= 2 && hasHorizontalArrows && !hasVerticalFlow) {
    return renderSequenceDiagram(boxNodes);
  }
  if (boxNodes.length >= 2 && hasVerticalFlow) {
    return renderFlowDiagram(boxNodes);
  }
  if (boxNodes.length >= 2) {
    return hasHorizontalArrows ? renderSequenceDiagram(boxNodes) : renderFlowDiagram(boxNodes);
  }

  const chain = extractArrowChain(text);
  if (chain.length >= 2) return renderFlowDiagram(chain);

  return `<pre class="notes-diagram notes-diagram--ascii"><code>${escapeHtml(text)}</code></pre>`;
}

function convertAsciiPreBlocks(html) {
  return html.replace(/<pre\b[^>]*>\s*(?:<code\b[^>]*>)?([\s\S]*?)(?:<\/code>)?\s*<\/pre>/gi, (full, inner) => {
    const text = decodeBasicEntities(String(inner).replace(/<[^>]+>/g, ''));
    if (!looksLikeAsciiDiagram(text)) {
      return `<pre class="notes-code"><code>${escapeHtml(text.trim())}</code></pre>`;
    }
    return asciiDiagramToHtml(text) || full;
  });
}

export function markdownToHtml(markdown) {
  if (!markdown?.trim()) return '';

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let inList = false;
  let listTag = 'ul';
  let inTable = false;
  let tableRows = [];
  let asciiBuf = [];

  const closeList = () => {
    if (inList) {
      parts.push(`</${listTag}>`);
      inList = false;
      listTag = 'ul';
    }
  };

  const openList = (tag) => {
    if (inList && listTag !== tag) closeList();
    if (!inList) {
      parts.push(`<${tag}>`);
      inList = true;
      listTag = tag;
    }
  };

  const closeTable = () => {
    if (inTable) {
      parts.push('<div class="notes-table-wrapper"><table class="notes-table">');
      tableRows.forEach((row, rowIndex) => {
        const trimmedRow = row.trim();
        const cols = trimmedRow.split('|').map((c) => c.trim());

        if (cols[0] === '') cols.shift();
        if (cols[cols.length - 1] === '') cols.pop();

        if (cols.length > 0 && cols.every((c) => /^-+$/.test(c))) {
          return;
        }

        parts.push('<tr>');
        cols.forEach((col) => {
          const cellContent = inlineMarkdown(col);
          const tag = rowIndex === 0 ? 'th' : 'td';
          parts.push(`<${tag}>${cellContent}</${tag}>`);
        });
        parts.push('</tr>');
      });
      parts.push('</table></div>');
      tableRows = [];
      inTable = false;
    }
  };

  const flushAscii = () => {
    if (!asciiBuf.length) return;
    const block = asciiBuf.join('\n');
    asciiBuf = [];
    const diagram = asciiDiagramToHtml(block);
    parts.push(diagram || `<pre class="notes-diagram notes-diagram--ascii"><code>${escapeHtml(block)}</code></pre>`);
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (looksLikeAsciiDiagram(line) || (asciiBuf.length && (BOX_CHARS.test(line) || ARROW_CHARS.test(line) || /──►|│/.test(line) || /^\s*$/.test(line)))) {
      if (!trimmed && asciiBuf.length) {
        // keep blank lines inside diagram until block ends on next non-diagram line
        asciiBuf.push(line);
        continue;
      }
      if (BOX_CHARS.test(line) || ARROW_CHARS.test(line) || /──►|│/.test(line)) {
        closeList();
        closeTable();
        asciiBuf.push(line);
        continue;
      }
    }

    if (asciiBuf.length) {
      // end diagram on blank or normal text
      if (!trimmed || !BOX_CHARS.test(line)) {
        // drop trailing blanks
        while (asciiBuf.length && !asciiBuf[asciiBuf.length - 1].trim()) asciiBuf.pop();
        flushAscii();
        if (!trimmed) {
          closeList();
          closeTable();
          continue;
        }
      }
    }

    if (!trimmed) {
      closeList();
      closeTable();
      continue;
    }

    if (/^[=\-*_#~]{4,}$/.test(trimmed)) {
      closeList();
      closeTable();
      parts.push('<hr class="notes-divider" />');
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      if (!inTable) inTable = true;
      tableRows.push(trimmed);
      continue;
    }
    closeTable();

    const calloutMatch = trimmed.match(CALLOUT_RE);
    if (calloutMatch) {
      closeList();
      const label = calloutMatch[1].replace(/^\w/, (c) => c.toUpperCase());
      const body = trimmed.replace(CALLOUT_RE, '').trim();
      parts.push(
        `<div class="notes-callout"><strong>${escapeHtml(label)}</strong> ${inlineMarkdown(body)}</div>`
      );
      continue;
    }

    if (
      trimmed.length >= 4 &&
      trimmed.length <= 80 &&
      trimmed === trimmed.toUpperCase() &&
      /[A-Z]/.test(trimmed) &&
      !/^[\d|=\-*_#~\s]+$/.test(trimmed)
    ) {
      closeList();
      parts.push(`<h2 class="notes-section-title">${inlineMarkdown(trimmed)}</h2>`);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      closeList();
      parts.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      closeList();
      parts.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      closeList();
      parts.push(`<h2>${inlineMarkdown(trimmed.slice(2))}</h2>`);
      continue;
    }

    if (/^[*-]\s+/.test(trimmed)) {
      openList('ul');
      parts.push(`<li>${inlineMarkdown(trimmed.replace(/^[*-]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      openList('ol');
      parts.push(`<li>${inlineMarkdown(trimmed.replace(/^\d+[.)]\s+/, ''))}</li>`);
      continue;
    }

    closeList();
    parts.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  if (asciiBuf.length) {
    while (asciiBuf.length && !asciiBuf[asciiBuf.length - 1].trim()) asciiBuf.pop();
    flushAscii();
  }
  closeList();
  closeTable();
  const html = parts.join('');
  if (!html) return '';
  if (!html.includes('notes-lead') && html.startsWith('<p>')) {
    return html.replace('<p>', '<p class="notes-lead">');
  }
  return html;
}

function protectBlocks(html, pattern, prefix = 'NOTES_BLOCK') {
  const blocks = [];
  const out = html.replace(pattern, (match) => {
    const token = `__${prefix}_${blocks.length}__`;
    blocks.push(match);
    return token;
  });
  return { html: out, blocks, prefix };
}

function restoreBlocks(html, blocks, prefix = 'NOTES_BLOCK') {
  const re = new RegExp(`__${prefix}_(\\d+)__`, 'g');
  return html.replace(re, (_, i) => blocks[Number(i)] || '');
}

function fixLatexFragments(html) {
  return html
    .replace(/\$\\rightarrow\$/gi, '→')
    .replace(/\$\\leftarrow\$/gi, '←')
    .replace(/\$\\Rightarrow\$/gi, '⇒')
    .replace(/\$\\to\$/gi, '→')
    .replace(/\$([^$]{1,24})\$/g, (_, expr) => {
      const cleaned = String(expr).replace(/\\/g, '').trim();
      return escapeHtml(cleaned);
    });
}

function wrapTables(html) {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    if (/notes-table-wrapper/.test(table)) return table;
    const cleaned = table
      .replace(/\s+(?:style|class|data-[a-z0-9_-]+|id|_ngcontent[^=]*|_nghost[^=]*)\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
      .replace(/<table\b/i, '<table class="notes-table"')
      .replace(/<td\b([^>]*)>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>\s*<\/td>/gi, '<th$1>$2</th>');
    return `<div class="notes-table-wrapper">${cleaned}</div>`;
  });
}

function stripJunkAttributes(html) {
  return html
    .replace(/\s+(?:style|data-[a-z0-9_-]+|_ngcontent[^=]*|_nghost[^=]*|jslog|jsname|jsaction|dir|role|aria-level|translate)\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s+class\s*=\s*(["'])(?:(?!\1).)*?\1/gi, (match, q) => {
      if (/notes-/.test(match)) {
        const kept = [...match.matchAll(/notes-[\w-]+/g)].map((m) => m[0]);
        return kept.length ? ` class=${q}${kept.join(' ')}${q}` : '';
      }
      return '';
    });
}

/** Clean pasted Word/Docs/Gemini HTML into readable study notes */
export function normalizeImportedHtml(raw) {
  let html = String(raw || '');

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!---->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?font\b[^>]*>/gi, '')
    .replace(/<\/?o:p\b[^>]*>/gi, '');

  // Convert ASCII <pre> diagrams before other transforms smash whitespace
  html = convertAsciiPreBlocks(html);

  // Protect diagrams, code, and tables from div→p rewrite
  const protectedDiagrams = protectBlocks(html, /<figure class="notes-diagram\b[\s\S]*?<\/figure>/gi, 'NOTES_DIAG');
  html = protectedDiagrams.html;
  const protectedPre = protectBlocks(html, /<pre\b[\s\S]*?<\/pre>/gi, 'NOTES_PRE');
  html = protectedPre.html;
  const protectedTables = protectBlocks(html, /<table\b[\s\S]*?<\/table>/gi, 'NOTES_TABLE');
  html = protectedTables.html;

  html = html.replace(/<h1\b[^>]*>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>');
  html = html.replace(/<\/?span\b[^>]*>/gi, '');
  html = html.replace(/<b\b[^>]*>/gi, '<strong>').replace(/<\/b>/gi, '</strong>');
  html = html.replace(/<i\b[^>]*>/gi, '<em>').replace(/<\/i>/gi, '</em>');

  // Unwrap chrome wrappers; keep semantic blocks
  html = html
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>')
    .replace(/<div\b[^>]*>\s*/gi, '<p>')
    .replace(/\s*<\/div>/gi, '</p>');

  html = restoreBlocks(html, protectedTables.blocks, 'NOTES_TABLE');
  html = restoreBlocks(html, protectedPre.blocks, 'NOTES_PRE');
  html = restoreBlocks(html, protectedDiagrams.blocks, 'NOTES_DIAG');

  html = wrapTables(html);
  html = stripJunkAttributes(html);
  html = fixLatexFragments(html);

  html = html
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/<\/?p>(\s*)(?=<h[2-6]\b)/gi, '$1')
    .replace(/(<\/h[2-6]>)(\s*)<p>/gi, '$1$2')
    .replace(/<\/?p>(\s*)(?=<(?:ul|ol|table|figure|pre)\b)/gi, '$1')
    .replace(/(<\/(?:ul|ol|table|figure|pre)>)(\s*)<p>/gi, '$1$2')
    .replace(/<p>\s*(<(?:ul|ol|table|figure|div|h[2-6]|pre)\b)/gi, '$1')
    .replace(/(<\/(?:ul|ol|table|figure|div|h[2-6]|pre)>)\s*<\/p>/gi, '$1')
    .replace(/(?:<\/p>\s*){2,}/gi, '</p>')
    .replace(/(?:<p>\s*){2,}/gi, '<p>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!/<(?:p|h[2-6]|ul|ol|li|table|blockquote|figure class="notes-)/i.test(html)) {
    return markdownToHtml(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
  }

  if (!html.includes('notes-lead') && html.startsWith('<p>')) {
    html = html.replace('<p>', '<p class="notes-lead">');
  }

  return html;
}

function stripThemeBreakingStyles(html) {
  // Study notes should inherit app theme — drop leftover inline presentation.
  return html
    .replace(/\s*style\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*color\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*face\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*size\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '');
}

export function prepareNotesHtml(content) {
  if (!content) return '';
  // Already converted diagrams — still re-clean styles/junk if re-saved HTML
  if (/class="notes-diagram/.test(content) && !/style\s*=|_ngcontent|Google Sans|\$\\rightarrow\$/i.test(content)) {
    return content;
  }
  let html = isLikelyHtml(content) ? normalizeImportedHtml(content) : markdownToHtml(content);
  html = stripThemeBreakingStyles(html);
  html = convertAsciiPreBlocks(html);
  return html;
}
