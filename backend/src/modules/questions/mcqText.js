/** Shared MCQ text cleanup for upload + DB repair. */

const CITE_RE = /\s*\[cite:\s*\d+\]\.?/gi;

const COMMON_IDIOMS = [
  'throw cold water on',
  'call it a day',
  'on the cards',
  'up in the air',
  'piece of cake',
  'nipped on the bud',
  'think creatively and unconventionally',
  'making wrong choices with that argument',
  'outside the box',
];

const STOP = new Set(
  'the a an to of in on for and or but with from that this his her their its was were are is be been being by at as into about over after before until while when who which what where why how very really so too not no nor either neither'.split(' ')
);

export function stripCiteJunk(text) {
  return String(text ?? '').replace(CITE_RE, '').trim();
}

function normalizeLatexFragments(text) {
  let result = String(text ?? '');
  const replacements = [
    [/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1 / $2)'],
    [/\\sqrt\s*\{([^{}]+)\}/g, '√($1)'],
    [/\\left\s*\[/g, '['],
    [/\\right\s*\]/g, ']'],
    [/\\left\s*\(/g, '('],
    [/\\right\s*\)/g, ')'],
    [/\\left\s*\{/g, '{'],
    [/\\right\s*\}/g, '}'],
    [/\\cdot/g, '·'],
    [/\\times/g, '×'],
    [/\\div/g, '÷'],
    [/\\pm/g, '±'],
    [/\\approx/g, '≈'],
    [/\\neq/g, '≠'],
    [/\\leq/g, '≤'],
    [/\\geq/g, '≥'],
    [/\\theta/g, 'θ'],
    [/\\alpha/g, 'α'],
    [/\\beta/g, 'β'],
    [/\\gamma/g, 'γ'],
    [/\\delta/g, 'δ'],
    [/\\pi/g, 'π'],
    [/\\sum/g, 'Σ'],
    [/\\sin/g, 'sin'],
    [/\\cos/g, 'cos'],
    [/\\tan/g, 'tan'],
    [/\\log/g, 'log'],
    [/\\text\s*\{([^{}]+)\}/g, '$1'],
    [/\\\^\{?([0-9A-Za-z]+)\}?/g, '^$1'],
    [/\\_\{?([0-9A-Za-z]+)\}?/g, '_$1'],
    [/\\\s+/g, ' '],
    [/\\\{/g, '{'],
    [/\\\}/g, '}'],
    [/\\\[/g, '['],
    [/\\\]/g, ']']
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/** Convert __phrase__ → <u>phrase</u> without touching ____ blanks. */
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
      rewritten += `__${inner.trim()}__`;
      lastIndex = endBraceIndex + 1;
    }

    output = rewritten;
  }

  return output;
}

export function normalizeMcqField(raw) {
  if (raw == null) return '';
  let text = stripCiteJunk(raw);
  text = normalizeLatexFragments(text);
  text = convertLatexUnderlines(text);
  text = markupUnderlines(text);
  text = text.replace(/(?<![A-Za-z0-9])_{2,}(?![A-Za-z0-9])/g, '________');
  return text.trim();
}

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wrapPhrase(body, phrase) {
  if (!phrase) return null;
  const idx = body.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx < 0) return null;
  return `${body.slice(0, idx)}<u>${body.slice(idx, idx + phrase.length)}</u>${body.slice(idx + phrase.length)}`;
}

/** Find a body span close to an option (for grammar substitution). */
function closestSegment(body, option) {
  const optWords = option.toLowerCase().split(/\s+/).filter(Boolean);
  if (optWords.length < 2) return null;
  const bodyWords = body.split(/(\s+)/);
  const tokens = [];
  for (let i = 0; i < bodyWords.length; i++) {
    if (/\s+/.test(bodyWords[i])) continue;
    tokens.push({ word: bodyWords[i], start: bodyWords.slice(0, i).join('').length });
  }
  let best = null;
  for (let i = 0; i < tokens.length; i++) {
    for (let len = Math.min(optWords.length + 2, tokens.length - i); len >= Math.max(2, optWords.length - 1); len--) {
      const slice = tokens.slice(i, i + len);
      const text = body.slice(slice[0].start, slice[slice.length - 1].start + slice[slice.length - 1].word.length);
      const sliceWords = slice.map((t) => t.word.toLowerCase());
      let hits = 0;
      for (const ow of optWords) {
        if (sliceWords.some((sw) => sw === ow || editDistance(sw, ow) <= 1)) hits++;
      }
      const score = hits / optWords.length;
      if (score >= 0.6 && (!best || score > best.score || (score === best.score && text.length < best.text.length))) {
        best = { text, score };
      }
    }
  }
  return best && best.score >= 0.6 ? best.text : null;
}

/**
 * If question mentions underlined/highlighted but has no <u>, try to wrap the target.
 */
export function autoUnderline(question, options = []) {
  let q = String(question ?? '');
  if (!q || /<u>/i.test(q)) return q;
  if (!/underlin|highlight/i.test(q)) return q;

  const lines = q.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let instruction;
  let body;
  if (lines.length >= 2) {
    instruction = lines[0];
    body = lines.slice(1).join(' ');
  } else {
    const m = q.match(/^(.+?(?:sentence|word|segment|idiom|expression|error|blank)[:.]?\s*)(.+)$/i);
    if (m && m[2].split(/\s+/).length >= 3) {
      instruction = m[1].trim();
      body = m[2].trim();
    } else {
      return q;
    }
  }

  const opts = (options || [])
    .map((o) => String(o || '').trim())
    .filter((o) => o && !/^no (substitution|correction|error)/i.test(o));

  const finish = (wrappedBody) => `${instruction}\n${wrappedBody}`;

  // Exact option phrase present in body
  for (const o of [...opts].sort((a, b) => b.length - a.length)) {
    if (o.length >= 3) {
      const wrapped = wrapPhrase(body, o);
      if (wrapped) return finish(wrapped);
    }
  }

  // Spelling: body word close to an option
  const words = body.match(/[A-Za-z']+/g) || [];
  for (const w of words) {
    for (const o of opts) {
      if (/^[A-Za-z']+$/.test(o) && w.toLowerCase() !== o.toLowerCase()) {
        const d = editDistance(w.toLowerCase(), o.toLowerCase());
        if (d > 0 && d <= 2) {
          const wrapped = wrapPhrase(body, w);
          if (wrapped) return finish(wrapped);
        }
      }
    }
  }

  // Near-match segment vs option
  for (const o of [...opts].sort((a, b) => b.length - a.length)) {
    const seg = closestSegment(body, o);
    if (seg) {
      const wrapped = wrapPhrase(body, seg);
      if (wrapped) return finish(wrapped);
    }
  }

  // Known idioms / phrases
  for (const idiom of COMMON_IDIOMS) {
    if (body.toLowerCase().includes(idiom)) {
      const wrapped = wrapPhrase(body, idiom);
      if (wrapped) return finish(wrapped);
    }
  }

  // Synonym / antonym of a hard word
  if (/synonym|antonym/i.test(instruction)) {
    const hard = words
      .filter((w) => w.length >= 6 && !STOP.has(w.toLowerCase()))
      .sort((a, b) => b.length - a.length);
    if (hard[0]) {
      const wrapped = wrapPhrase(body, hard[0]);
      if (wrapped) return finish(wrapped);
    }
  }

  // "substitute the word" — underline short pronoun/determiner that options replace
  if (/substitute the (underlined |highlighted )?word/i.test(instruction)) {
    for (const w of ['which', 'who', 'whom', 'what', 'that', 'this', 'these', 'those']) {
      if (new RegExp(`\\b${w}\\b`, 'i').test(body)) {
        const wrapped = wrapPhrase(body, w);
        if (wrapped) return finish(wrapped);
      }
    }
  }

  // Neither/nor verb agreement — underline "was/were + verb"
  if (/neither .+ nor /i.test(body)) {
    const m = body.match(/\b((?:was|were|is|are)\s+\w+)/i);
    if (m) {
      const wrapped = wrapPhrase(body, m[1]);
      if (wrapped) return finish(wrapped);
    }
  }

  // "very X" adjective phrases for single-word substitutes
  if (/substitute/i.test(instruction) && opts.every((o) => !o.includes(' '))) {
    const m = body.match(/\b(very\s+\w+)/i);
    if (m) {
      const wrapped = wrapPhrase(body, m[1]);
      if (wrapped) return finish(wrapped);
    }
  }

  return q;
}

export function repairMcqFields({ question, options, explanation }) {
  let q = normalizeMcqField(question);
  const o = (options || []).map(normalizeMcqField);
  const e = normalizeMcqField(explanation);
  q = autoUnderline(q, o);
  return { question: q, options: o, explanation: e };
}
