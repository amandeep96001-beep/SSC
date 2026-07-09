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

  const closeList = () => {
    if (inList) {
      parts.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
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
  return parts.join('');
}

export function prepareNotesHtml(content) {
  if (!content) return '';
  if (isLikelyHtml(content)) return content;
  return markdownToHtml(content);
}
