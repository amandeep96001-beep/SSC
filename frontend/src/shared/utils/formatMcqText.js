/**
 * Safe MCQ rich text: underlines (<u> / __word__) + fill-in blanks (____) + KaTeX math.
 * Output is HTML safe for dangerouslySetInnerHTML.
 *
 * Conventions:
 *   Underline → <u>text</u>  or  __text__
 *   Blank     → ____ (2+ underscores, not used as __wrap__)
 *   Math      → $inline$ | $$display$$ | \(inline\) | \[display\]
 */

import katex from 'katex';

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

function convertLatexUnderlines(text) {
  const commands = ['underline', 'overline'];
  let output = String(text ?? '');

  for (const command of commands) {
    const pattern = new RegExp(`\\\\${command}\\s*\\{`, 'g');
    let lastIndex = 0;
    let rewritten = '';

    while (true) {
      const match = pattern.exec(output);
      if (!match) {
        rewritten += output.slice(lastIndex);
        break;
      }

      const startBraceIndex = match.index + match[0].length - 1;
      let depth = 0;
      let endBraceIndex = -1;

      for (let i = startBraceIndex; i < output.length; i++) {
        if (output[i] === '{') depth += 1;
        else if (output[i] === '}') {
          depth -= 1;
          if (depth === 0) {
            endBraceIndex = i;
            break;
          }
        }
      }

      if (endBraceIndex === -1) {
        rewritten += output.slice(lastIndex);
        break;
      }

      rewritten += output.slice(lastIndex, match.index);
      const inner = output.slice(startBraceIndex + 1, endBraceIndex);
      rewritten += `<u>${inner.trim()}</u>`;
      lastIndex = endBraceIndex + 1;
    }

    output = rewritten;
  }

  return output;
}

/**
 * Render a LaTeX expression with KaTeX.
 * Falls back to a styled code span on parse error so raw $ signs never show.
 */
function renderKatex(expr, displayMode) {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'html',
    });
  } catch {
    const safe = expr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="mcq-math-fallback">${safe}</span>`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strategy: tokenise the input into math segments and plain-text segments.
 * Math segments are rendered to KaTeX HTML (trusted, no escaping needed).
 * Plain-text segments are HTML-escaped, then underline/blank markup is applied.
 *
 * Token types:
 *   { type: 'math', src, displayMode }
 *   { type: 'text', src }
 */
function tokenise(raw) {
  const tokens = [];
  // Ordered so that longer/higher-priority delimiters are tried first
  const mathPatterns = [
    { re: /^\\\[([\s\S]*?)\\\]/, display: true },   // \[...\]
    { re: /^\$\$([\s\S]*?)\$\$/, display: true },   // $$...$$
    { re: /^\\\(([\s\S]*?)\\\)/, display: false },  // \(...\)
    { re: /^\$([^$\n]+?)\$/, display: false },       // $...$
  ];

  let i = 0;
  while (i < raw.length) {
    let matched = false;
    for (const { re, display } of mathPatterns) {
      const slice = raw.slice(i);
      const m = slice.match(re);
      if (m) {
        tokens.push({ type: 'math', src: m[1], displayMode: display });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Accumulate plain text
      const last = tokens[tokens.length - 1];
      if (last?.type === 'text') {
        last.src += raw[i];
      } else {
        tokens.push({ type: 'text', src: raw[i] });
      }
      i++;
    }
  }
  return tokens;
}

/**
 * Process a plain-text segment:
 *  1. Convert \underline{} / \overline{} → <u>
 *  2. Convert __text__ → <u>text</u>
 *  3. HTML-escape everything else
 *  4. Replace _____ runs → blank spans
 *  5. Newlines → <br/>
 */
function processPlainText(src) {
  let text = convertLatexUnderlines(src);
  text = markupUnderlines(text);

  // Protect <u> tags before escaping
  const uSlots = [];
  text = text.replace(/<\/?u>/gi, (tag) => {
    const i = uSlots.length;
    uSlots.push(tag.toLowerCase() === '</u>' ? '</u>' : '<u>');
    return `\u0000U${i}\u0000`;
  });

  text = escapeHtml(text);
  text = text.replace(/\u0000U(\d+)\u0000/g, (_, i) => uSlots[Number(i)] || '');

  // Blanks: 2+ underscores not adjacent to word chars
  text = text.replace(/(?<![A-Za-z0-9])_{2,}(?![A-Za-z0-9])/g,
    '<span class="mcq-blank" aria-label="blank"></span>');

  text = text.replace(/\r\n|\r|\n/g, '<br/>');
  return text;
}

function sanitizeImgTag(tag) {
  const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
  const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
  const clsMatch = tag.match(/\bclass=["']([^"']+)["']/i);
  if (!srcMatch) return '';
  const src = srcMatch[1];
  if (!/^(\/uploads\/|https?:\/\/|data:image\/)/i.test(src)) return '';
  const alt = altMatch ? altMatch[1].replace(/"/g, '&quot;') : 'Question image';
  const cls = clsMatch ? clsMatch[1] : 'mcq-pdf-img';
  return `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy" />`;
}

function renderTextSegment(src) {
  const tokens = tokenise(src);
  return tokens.map((tok) => {
    if (tok.type === 'math') {
      return renderKatex(tok.src, tok.displayMode);
    }
    return processPlainText(tok.src);
  }).join('');
}

/**
 * Full pipeline:
 * 1. Strip cite junk
 * 2. Preserve safe <img> tags (PDF imports)
 * 3. Tokenise into math / plain-text segments
 * 4. Render each token appropriately
 * 5. Join
 */
export function formatMcqHtml(raw) {
  if (raw == null || raw === '') return '';

  const src = stripCiteJunk(raw);

  if (/<img[\s>]/i.test(src)) {
    const parts = src.split(/(<img\b[^>]*\/?>)/gi);
    return parts.map((part) => {
      if (/^<img/i.test(part)) return sanitizeImgTag(part);
      if (!part.trim()) return '';
      return renderTextSegment(part);
    }).join('');
  }

  return renderTextSegment(src);
}

/** Normalize text before save: strip cite junk, convert __x__ → <u>x</u>. */
export function normalizeMcqField(raw) {
  if (raw == null) return '';
  let text = stripCiteJunk(raw);
  text = markupUnderlines(text);
  text = text.replace(/_{2,}/g, '________');
  return text.trim();
}
