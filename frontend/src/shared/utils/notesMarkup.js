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
  return /<(?:p|h[1-6]|ul|ol|li|div|mark|br|strong|em|code)\b/i.test(content);
}

export function markdownToHtml(markdown) {
  if (!markdown?.trim()) return '';

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let inList = false;
  let inTable = false;
  let tableRows = [];

  const closeList = () => {
    if (inList) {
      parts.push('</ul>');
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      parts.push('<div class="notes-table-wrapper"><table class="notes-table">');
      tableRows.forEach((row, rowIndex) => {
        const trimmedRow = row.trim();
        const cols = trimmedRow.split('|').map(c => c.trim());
        
        // Remove empty first/last elements from split if they are empty
        if (cols[0] === '') cols.shift();
        if (cols[cols.length - 1] === '') cols.pop();

        // Check if this is a separator row (like |---|---|)
        if (cols.length > 0 && cols.every(c => /^-+$/.test(c))) {
          return; // skip separator row
        }

        parts.push('<tr>');
        cols.forEach(col => {
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

    // Check for plain-text dividers like ========== or ---------- or **********
    if (/^[=\-*_#~]{4,}$/.test(trimmed)) {
      closeList();
      closeTable();
      parts.push('<hr class="notes-divider" />');
      continue;
    }

    // Check for tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      if (!inTable) {
        inTable = true;
      }
      tableRows.push(trimmed);
      continue;
    } else {
      closeTable();
    }

    if (/^definition\s*:/i.test(trimmed)) {
      closeList();
      closeTable();
      parts.push(`<div class="notes-callout"><strong>Definition</strong> ${inlineMarkdown(trimmed.replace(/^definition\s*:/i, '').trim())}</div>`);
      continue;
    }

    // ALL CAPS section titles (common in SSC notes)
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
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      parts.push(`<li>${inlineMarkdown(trimmed.replace(/^[*-]\s+/, ''))}</li>`);
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

export function prepareNotesHtml(content) {
  if (!content) return '';
  let html = isLikelyHtml(content) ? content : markdownToHtml(content);
  // Strip inline color styles so theme CSS controls readability
  html = html
    .replace(/\s*style\s*=\s*(["'])(?:(?!\1).)*?\1/gi, (match) => {
      const cleaned = match
        .replace(/color\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, '')
        .replace(/background(?:-color)?\s*:\s*[^;'"!]+(?:\s*!important)?\s*;?/gi, (bg) => {
          // keep highlight backgrounds on marks only — strip generic dark bg
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
    .replace(/\s*color\s*=\s*(["'])(?:(?!\1).)*?\1/gi, '');
  return html;
}
