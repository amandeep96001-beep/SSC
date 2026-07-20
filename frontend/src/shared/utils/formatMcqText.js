/**
 * Safe MCQ rich text: underlines (<u> / __word__) + fill-in blanks (____).
 * Output is HTML safe for dangerouslySetInnerHTML.
 *
 * Conventions:
 *   Underline → <u>text</u>  or  __text__
 *   Blank     → ____ (2+ underscores, not used as __wrap__)
 */

const CITE_RE = /\s*\[cite:\s*\d+\]\.?/gi;

export function stripCiteJunk(text) {
  return String(text ?? '').replace(CITE_RE, '').trim();
}

/**
 * Convert __underlined phrase__ → <u>…</u>
 * Lookarounds keep ____ blanks from being eaten as delimiters.
 */
export function markupUnderlines(text) {
  return String(text ?? '').replace(/(?<!_)__([^_\n](?:[\s\S]*?[^_\n])?)__(?!_)/g, '<u>$1</u>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape everything, then restore safe <u>…</u> and turn underscore runs into blanks.
 */
export function formatMcqHtml(raw) {
  if (raw == null || raw === '') return '';

  let text = stripCiteJunk(raw);
  text = markupUnderlines(text);

  // Protect underline tags before escaping
  const slots = [];
  text = text.replace(/<\/?u>/gi, (tag) => {
    const i = slots.length;
    slots.push(tag.toLowerCase() === '</u>' ? '</u>' : '<u>');
    return `\u0000U${i}\u0000`;
  });

  text = escapeHtml(text);
  text = text.replace(/\u0000U(\d+)\u0000/g, (_, i) => slots[Number(i)] || '');

  // Fill-in blanks: 2+ underscores → visual blank
  text = text.replace(/_{2,}/g, '<span class="mcq-blank" aria-label="blank"></span>');

  text = text.replace(/\r\n|\r|\n/g, '<br/>');
  return text;
}

/** Normalize text before save: strip cite junk, convert __x__ → <u>x</u>. */
export function normalizeMcqField(raw) {
  if (raw == null) return '';
  let text = stripCiteJunk(raw);
  text = markupUnderlines(text);
  text = text.replace(/_{2,}/g, '________');
  return text.trim();
}
