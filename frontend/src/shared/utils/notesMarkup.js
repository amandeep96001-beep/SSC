function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBasicEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&rarr;/gi, '→')
    .replace(/&larr;/gi, '←');
}

function inlineMarkdown(text) {
  return escapeHtml(decodeBasicEntities(text))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function isLikelyHtml(content) {
  if (!content) return false;
  return /<(?:p|h[1-6]|ul|ol|li|div|mark|br|strong|em|b|i|code|table|tr|td|th|span|blockquote|hr|pre|figure|section|article)\b/i.test(content);
}

const CALLOUT_RE = /^(definition|tip|note|remember|example|formula|trick|shortcut|important|key|pyq|exam)\s*:/i;

const BOX_CHARS = /[┌┐└┘├┤┬┴┼═║│─━┃┏┓┗┛┣┫┳┻╋╔╗╚╝╠╣╦╩╬]/;
const ARROW_CHARS = /[▼▲►◀→←↓↑⟶⇢➥➜⇒⇓⇑]/;

function looksLikeAsciiDiagram(text) {
  const lines = String(text || '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return false;
  const boxLines = lines.filter((l) => BOX_CHARS.test(l)).length;
  const arrowOnly = lines.filter((l) => /^\s*[↓↑▼▲→←➜⇓]+\s*$/.test(l)).length;
  const connector = lines.filter((l) => /──►|-->|⇒|→|=>/.test(l)).length;
  const plusBox = lines.filter((l) => /^\s*\+[-+]+\+\s*$/.test(l)).length;
  return boxLines >= 2 || plusBox >= 2 || (arrowOnly >= 1 && lines.length >= 3) || (connector >= 1 && boxLines >= 1);
}

function extractBoxLabels(text) {
  const labels = [];
  const lines = String(text || '').split('\n');

  for (const line of lines) {
    if (!/[│|]/.test(line)) continue;
    if (/[└┌┬┴┼╔╗╚╝]/.test(line) && !/│/.test(line)) continue;
    if (/^\s*[+|+][-+|]+[+|]/.test(line)) continue;
    const cells = [];
    const re = /[│|]([^│|└┐]+?)[│|]/g;
    let m;
    while ((m = re.exec(line))) {
      const inner = m[1].trim();
      if (!inner || /^[-─=]+$/.test(inner)) continue;
      if (/^[─\s►→←➜⇐⇒<>\-]+$/.test(inner)) continue; // arrow gutter between boxes
      cells.push(inner);
    }
    if (cells.length >= 2) labels.push({ _rowCells: cells });
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

  let current = null;
  for (const line of lines) {
    if (/[┌╔+]/.test(line) && /[┐╗+]/.test(line)) {
      current = { title: '', subtitle: '' };
      continue;
    }
    if (current && /[│|]/.test(line)) {
      const inner = line.replace(/^[^│|]*/, '').replace(/^[│|]/, '').replace(/[│|][\s\S]*$/, '').trim();
      if (!inner || /^[-─=]+$/.test(inner)) continue;
      if (!current.title) current.title = inner;
      else if (!current.subtitle) current.subtitle = inner;
      continue;
    }
    if (current && /[└╚+]/.test(line) && /[┘╝+]/.test(line)) {
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
    if (/^[↓↑▼▲→←➜─│|=\s⇓]+$/.test(line)) continue;
    if (BOX_CHARS.test(line) || /^\s*\+[-+]+\+/.test(line)) continue;
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
  const hasHorizontalArrows = /──►|-->|⇒|=>/.test(text) || (text.includes('►') && text.split('\n').some((l) => /[│|]/.test(l) && /──►|►/.test(l)));
  const hasVerticalFlow = /▼|↓|⇓/.test(text);

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

/** Turn consecutive ascii-looking <p> lines into a diagram */
function convertLooseAsciiParagraphs(html) {
  return html.replace(/(?:<p\b[^>]*>[\s\S]*?<\/p>\s*){2,}/gi, (block) => {
    const texts = [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
      decodeBasicEntities(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trimEnd()
    );
    const joined = texts.join('\n');
    if (!looksLikeAsciiDiagram(joined)) return block;
    return asciiDiagramToHtml(joined) || block;
  });
}

function renderMarkdownTable(rows) {
  if (!rows.length) return '';
  const parts = ['<div class="notes-table-wrapper"><table class="notes-table">'];
  rows.forEach((row, rowIndex) => {
    const cols = row;
    if (cols.length > 0 && cols.every((c) => /^:?-{3,}:?$/.test(c))) return;
    parts.push('<tr>');
    cols.forEach((col) => {
      const tag = rowIndex === 0 ? 'th' : 'td';
      parts.push(`<${tag}>${inlineMarkdown(col)}</${tag}>`);
    });
    parts.push('</tr>');
  });
  parts.push('</table></div>');
  return parts.join('');
}

function parsePipeRow(line) {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return null;
  // markdown table row or loose pipe row
  if (!/\|/.test(trimmed)) return null;
  let cols = trimmed.split('|').map((c) => c.trim());
  if (cols[0] === '') cols.shift();
  if (cols[cols.length - 1] === '') cols.pop();
  if (cols.length < 2) return null;
  return cols;
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
    if (!inTable) return;
    parts.push(renderMarkdownTable(tableRows));
    tableRows = [];
    inTable = false;
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

    const isDiagramLine =
      BOX_CHARS.test(line) ||
      ARROW_CHARS.test(line) ||
      /──►|-->|=>/.test(line) ||
      /^\s*\+[-+]+\+\s*$/.test(line) ||
      /^\s*\+[-+]+\+.*\+[-+]+\+\s*$/.test(line);

    if (isDiagramLine || (asciiBuf.length && (!trimmed || isDiagramLine))) {
      if (!trimmed && asciiBuf.length) {
        asciiBuf.push(line);
        continue;
      }
      if (isDiagramLine) {
        closeList();
        closeTable();
        asciiBuf.push(line);
        continue;
      }
    }

    if (asciiBuf.length) {
      while (asciiBuf.length && !asciiBuf[asciiBuf.length - 1].trim()) asciiBuf.pop();
      flushAscii();
      if (!trimmed) {
        closeList();
        closeTable();
        continue;
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

    // Tab-separated pseudo-table row
    if (trimmed.includes('\t') && trimmed.split('\t').length >= 2 && !trimmed.startsWith('#')) {
      closeList();
      const cols = trimmed.split('\t').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2) {
        if (!inTable) inTable = true;
        tableRows.push(cols);
        continue;
      }
    }

    const pipeCols = parsePipeRow(trimmed);
    if (pipeCols && (trimmed.startsWith('|') || trimmed.endsWith('|') || (pipeCols.length >= 3 && inTable))) {
      closeList();
      if (!inTable) inTable = true;
      tableRows.push(pipeCols);
      continue;
    }
    // also accept "A | B | C" without edge pipes when already in table or looks tabular
    if (pipeCols && pipeCols.length >= 3 && !trimmed.startsWith('#') && !/^[*-]/.test(trimmed)) {
      closeList();
      if (!inTable) inTable = true;
      tableRows.push(pipeCols);
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
      trimmed.length <= 90 &&
      trimmed === trimmed.toUpperCase() &&
      /[A-Z]/.test(trimmed) &&
      !/^[\d|=\-*_#~\s]+$/.test(trimmed)
    ) {
      closeList();
      parts.push(`<h2 class="notes-section-title">${inlineMarkdown(trimmed)}</h2>`);
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      closeList();
      parts.push(`<h3>${inlineMarkdown(trimmed.slice(5))}</h3>`);
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
    .replace(/\$\\Leftrightarrow\$/gi, '⇔')
    .replace(/\$\\to\$/gi, '→')
    .replace(/\$\\times\$/gi, '×')
    .replace(/\$\\div\$/gi, '÷')
    .replace(/\$\\pm\$/gi, '±')
    .replace(/\$\\approx\$/gi, '≈')
    .replace(/\$\\neq\$/gi, '≠')
    .replace(/\$\\leq\$/gi, '≤')
    .replace(/\$\\geq\$/gi, '≥')
    .replace(/\$\\%/g, '%')
    .replace(/\$([^$]{1,40})\$/g, (_, expr) => {
      const cleaned = String(expr).replace(/\\/g, '').trim();
      return escapeHtml(cleaned);
    });
}

function cleanTableHtml(table) {
  let cleaned = table
    .replace(/\s+(?:style|class|data-[a-z0-9_-]+|id|_ngcontent[^=]*|_nghost[^=]*)\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/<\/?span\b[^>]*>/gi, '')
    .replace(/<b\b[^>]*>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>');

  if (!/\bnotes-table\b/.test(cleaned)) {
    cleaned = cleaned.replace(/<table\b/i, '<table class="notes-table"');
  } else {
    cleaned = cleaned.replace(/<table\b[^>]*>/i, '<table class="notes-table">');
  }

  cleaned = cleaned.replace(
    /<(thead|tr)\b[^>]*>\s*(?:<td\b[^>]*>\s*(?:<strong\b[^>]*>[\s\S]*?<\/strong>|<b\b[^>]*>[\s\S]*?<\/b>)\s*<\/td>\s*){2,}<\/(?:thead|tr)>/i,
    (row) => row.replace(/<\/?td\b/gi, (t) => t.replace('td', 'th'))
  );
  cleaned = cleaned.replace(/<td\b([^>]*)>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>\s*<\/td>/gi, '<th$1>$2</th>');
  return cleaned;
}

function wrapTables(html) {
  const tables = [];
  // Pull existing wrapped tables
  let out = html.replace(/<div class="notes-table-wrapper">\s*(<table\b[\s\S]*?<\/table>)\s*<\/div>/gi, (_, table) => {
    const token = `__NOTES_WRAPTABLE_${tables.length}__`;
    tables.push(cleanTableHtml(table));
    return token;
  });
  // Remaining bare tables
  out = out.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    const token = `__NOTES_WRAPTABLE_${tables.length}__`;
    tables.push(cleanTableHtml(table));
    return token;
  });
  return out.replace(/__NOTES_WRAPTABLE_(\d+)__/g, (_, i) => (
    `<div class="notes-table-wrapper">${tables[Number(i)] || ''}</div>`
  ));
}

function stripJunkAttributes(html) {
  return html
    .replace(/\s+(?:style|data-[a-z0-9_-]+|_ngcontent[^=]*|_nghost[^=]*|jslog|jsname|jsaction|dir|role|aria-level|translate|contenteditable)\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s+class\s*=\s*(["'])(?:(?!\1).)*?\1/gi, (match, q) => {
      if (/notes-/.test(match)) {
        const kept = [...match.matchAll(/notes-[\w-]+/g)].map((m) => m[0]);
        return kept.length ? ` class=${q}${kept.join(' ')}${q}` : '';
      }
      return '';
    });
}

function stripChromeNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<!---->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?font\b[^>]*>/gi, '')
    .replace(/<\/?o:p\b[^>]*>/gi, '')
    .replace(/<\/?(?:xml|w:|m:)[^>]*>/gi, '')
    .replace(/<\/?(?:section|article|header|footer|main|aside|nav)\b[^>]*>/gi, '');
}

function tidyStructure(html) {
  return html
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/<(strong|em|b|i)>\s*<\/\1>/gi, '')
    .replace(/<\/?p>(\s*)(?=<h[2-6]\b)/gi, '$1')
    .replace(/(<\/h[2-6]>)(\s*)<p>/gi, '$1$2')
    .replace(/<\/?p>(\s*)(?=<(?:ul|ol|table|figure|pre)\b)/gi, '$1')
    .replace(/(<\/(?:ul|ol|table|figure|pre)>)(\s*)<p>/gi, '$1$2')
    .replace(/<\/?p>(\s*)(?=<div class="notes-)/gi, '$1')
    .replace(/(<\/div>)(\s*)<p>/gi, '$1$2')
    .replace(/<p>\s*(<(?:ul|ol|table|figure|div|h[2-6]|pre)\b)/gi, '$1')
    .replace(/(<\/(?:ul|ol|table|figure|div|h[2-6]|pre)>)\s*<\/p>/gi, '$1')
    .replace(/(?:<\/p>\s*){2,}/gi, '</p>')
    .replace(/(?:<p>\s*){2,}/gi, '<p>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Promote lone bold paragraphs that look like section titles */
function promoteBoldHeadings(html) {
  return html.replace(/<p\b[^>]*>\s*<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>/gi, (full, inner) => {
    const text = decodeBasicEntities(String(inner).replace(/<[^>]+>/g, '')).trim();
    if (text.length < 3 || text.length > 90) return full;
    if (/[.!?]$/.test(text) && text.length > 40) return full;
    if (/^(tip|note|remember|definition|important|example)\b/i.test(text)) {
      return `<div class="notes-callout"><strong>${escapeHtml(text.split(':')[0])}</strong>${text.includes(':') ? ` ${inlineMarkdown(text.slice(text.indexOf(':') + 1).trim())}` : ''}</div>`;
    }
    return `<h3>${escapeHtml(text)}</h3>`;
  });
}

/** If HTML still contains markdown tables / headings as plain text, convert those islands */
function convertEmbeddedMarkdownIslands(html) {
  // Paragraph that is purely a markdown heading
  html = html.replace(/<p\b[^>]*>\s*(#{1,4})\s+([\s\S]*?)<\/p>/gi, (_, hashes, body) => {
    const text = decodeBasicEntities(String(body).replace(/<[^>]+>/g, '')).trim();
    const level = Math.min(hashes.length + 1, 3);
    return `<h${level}>${inlineMarkdown(text)}</h${level}>`;
  });

  // Block of pipe-table lines stuck in consecutive paragraphs
  html = html.replace(/(?:<p\b[^>]*>\s*\|[\s\S]*?\|\s*<\/p>\s*){2,}/gi, (block) => {
    const rows = [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => parsePipeRow(decodeBasicEntities(m[1].replace(/<[^>]+>/g, '').trim())))
      .filter(Boolean);
    if (rows.length < 2) return block;
    return renderMarkdownTable(rows);
  });

  return html;
}

/** Clean pasted Word/Docs/Gemini/Notion HTML into readable study notes */
export function normalizeImportedHtml(raw) {
  let html = String(raw || '');

  html = stripChromeNoise(html);
  html = convertAsciiPreBlocks(html);

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
  html = convertLooseAsciiParagraphs(html);
  html = convertEmbeddedMarkdownIslands(html);
  html = promoteBoldHeadings(html);
  html = tidyStructure(html);

  if (!/<(?:p|h[2-6]|ul|ol|li|table|blockquote|figure)\b/i.test(html)) {
    return markdownToHtml(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
  }

  if (!html.includes('notes-lead') && html.startsWith('<p>')) {
    html = html.replace('<p>', '<p class="notes-lead">');
  }

  return html;
}

function stripThemeBreakingStyles(html) {
  return html
    .replace(/\s*style\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*color\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*face\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*size\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '');
}

function alreadyCleanNotes(html) {
  if (!html) return false;
  if (/style\s*=|_ngcontent|Google Sans|mso-|\$\\rightarrow\$/i.test(html)) return false;
  // Clean enough if it already uses our diagram/table classes and has no junk attrs
  return /class="notes-(?:diagram|table)/.test(html) && !/data-path-to-node|_ngcontent/i.test(html);
}

/**
 * Universal notes normalizer — call on upload, paste, and load.
 * Accepts Markdown, HTML (Gemini/Docs/Word), or mixed paste.
 */
export function prepareNotesHtml(content) {
  if (!content) return '';
  const raw = String(content).trim();
  if (!raw) return '';

  // Already app-clean: light pass only (still strip rogue styles)
  if (alreadyCleanNotes(raw)) {
    return stripThemeBreakingStyles(tidyStructure(raw));
  }

  let html = isLikelyHtml(raw) ? normalizeImportedHtml(raw) : markdownToHtml(raw);
  html = stripThemeBreakingStyles(html);
  html = convertAsciiPreBlocks(html);
  html = convertLooseAsciiParagraphs(html);
  html = wrapTables(html);
  html = tidyStructure(html);
  return html;
}

/** Prefer clipboard HTML when present; always normalize. */
export function prepareNotesFromClipboard(html, plainText) {
  const source = (html && html.trim()) || (plainText && plainText.trim()) || '';
  return prepareNotesHtml(source);
}
