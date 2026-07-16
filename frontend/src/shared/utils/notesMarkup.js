function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function isLikelyHtml(content) {
  if (!content) return false;
  return /<(?:p|h[1-6]|ul|ol|li|div|mark|br|strong|em|code|table|tr|td|th|span|blockquote|hr)\b/i.test(content);
}

const CALLOUT_RE = /^(definition|tip|note|remember|example|formula|trick|shortcut|important)\s*:/i;

export function markdownToHtml(markdown) {
  if (!markdown?.trim()) return '';

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let inList = false;
  let listTag = 'ul';
  let inTable = false;
  let tableRows = [];

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

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

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

  closeList();
  closeTable();
  const html = parts.join('');
  if (!html) return '';
  if (!html.includes('notes-lead') && html.startsWith('<p>')) {
    return html.replace('<p>', '<p class="notes-lead">');
  }
  return html;
}

/** Clean pasted Word/Docs/HTML into readable study notes */
export function normalizeImportedHtml(raw) {
  let html = String(raw || '');

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?font\b[^>]*>/gi, '')
    .replace(/<\/?o:p\b[^>]*>/gi, '')
    .replace(/<\/?span\b[^>]*>/gi, '');

  html = html.replace(/<h1\b([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');

  // Double line-breaks → paragraphs; unwrap bare wrapper divs
  html = html
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>')
    .replace(/<div\b[^>]*>\s*/gi, '<p>')
    .replace(/\s*<\/div>/gi, '</p>');

  html = html
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/(?:<\/p>\s*){2,}/gi, '</p>')
    .replace(/(?:<p>\s*){2,}/gi, '<p>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!/<(?:p|h[2-6]|ul|ol|li|table|blockquote)\b/i.test(html)) {
    return markdownToHtml(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
  }

  if (!html.includes('notes-lead') && html.startsWith('<p>')) {
    html = html.replace('<p>', '<p class="notes-lead">');
  }

  return html;
}

function stripThemeBreakingStyles(html) {
  return html
    .replace(/\s*style\s*=\s*(["'])(?:(?!\1).)*?\1/gi, (match) => {
      const cleaned = match
        .replace(/color\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, '')
        .replace(/font-family\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, '')
        .replace(/font-size\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, '')
        .replace(/background(?:-color)?\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, (bg) => {
          if (/rgba?\(\s*0\s*,\s*0\s*,\s*0/i.test(bg) || /#0{3,6}\b/i.test(bg) || /#1[0-9a-f]{2,5}\b/i.test(bg)) {
            return '';
          }
          return bg;
        });
      if (/style\s*=\s*(["'])\s*\1/i.test(cleaned) || /style\s*=\s*(["'])\s*;*\s*\1/i.test(cleaned)) {
        return '';
      }
      return cleaned;
    })
    .replace(/\s*color\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*face\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '')
    .replace(/\s*size\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '');
}

export function prepareNotesHtml(content) {
  if (!content) return '';
  let html = isLikelyHtml(content) ? normalizeImportedHtml(content) : markdownToHtml(content);
  return stripThemeBreakingStyles(html);
}
