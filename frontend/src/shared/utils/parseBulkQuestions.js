import { normalizeMcqField } from '@/shared/utils/formatMcqText';

/**
 * Parse bulk MCQ paste for mocks, topic notes, and TCS bank.
 * Preferred: plain text blocks (no JSON knowledge required).
 * Also accepts a JSON array / { questions: [...] }.
 *
 * Underline: wrap with __like this__ or <u>like this</u>
 * Blank: use ____ (underscores) in the question or options
 */

const ANS_LETTER = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };

/** Loose aliases → preferred canonical names (matched against allowed list when provided) */
const SECTION_ALIASES = {
  english: 'English',
  eng: 'English',
  varc: 'VARC',
  gk: 'GK',
  'general knowledge': 'GK',
  'general awareness': 'GA',
  ga: 'GA',
  quant: 'Quant',
  quantitative: 'Quant',
  maths: 'Maths',
  math: 'Maths',
  mathematics: 'Maths',
  reasoning: 'Reasoning',
  reason: 'Reasoning',
  computer: 'Computer',
  'computer awareness': 'Computer',
  'computer knowledge': 'Computer',
  hindi: 'Hindi',
  science: 'General Science',
  'general science': 'General Science',
  dilr: 'DILR',
  csat: 'CSAT',
  'gs paper i': 'GS Paper I',
  'gs paper 1': 'GS Paper I',
  gs: 'GS',
  aptitude: 'Aptitude',
  'state gk': 'State GK',
  language: 'Language',
};

export const MOCK_SECTIONS = ['English', 'GK', 'Quant', 'Reasoning'];

export const BULK_MCQ_EXAMPLE = `Q: Select the synonym of the underlined word.
She felt __excruciating__ pain after the fall.
A) Mild
B) Painful
C) Soft
D) Calm
Ans: B
E: Excruciating means extremely painful.

Q: Fill in the blank.
Grey ________ is no sure sign of wisdom.
A) heir
B) air
C) hare
D) hair
Ans: D
E: Grey hair is the correct collocation.`;

export function buildBulkMockExample(sections = MOCK_SECTIONS) {
  const samples = {
    English: {
      q: 'Identify the synonym of Abundant.',
      o: ['Scarce', 'Plentiful', 'Rare', 'Empty'],
      a: 'B',
      e: 'Plentiful means existing in great quantity.',
    },
    GK: {
      q: 'Who was the first President of India?',
      o: ['Dr. Rajendra Prasad', 'Dr. S. Radhakrishnan', 'Zakir Husain', 'V. V. Giri'],
      a: 'A',
      e: 'Dr. Rajendra Prasad was the first President of India.',
    },
    Quant: {
      q: 'What is 15% of 200?',
      o: ['20', '25', '30', '35'],
      a: 'C',
      e: '15% of 200 = (15/100) × 200 = 30.',
    },
    Reasoning: {
      q: 'If CAT = 24 and DOG = 26, then BAT = ?',
      o: ['23', '24', '25', '26'],
      a: 'A',
      e: 'Sum of position values: B(2)+A(1)+T(20) = 23.',
    },
  };

  const list = (sections || []).filter(Boolean);
  const use = list.length ? list : MOCK_SECTIONS;

  return use.map((section, idx) => {
    const sample = samples[section] || {
      q: `Sample question for ${section}?`,
      o: ['Option A', 'Option B', 'Option C', 'Option D'],
      a: 'A',
      e: `Explanation for ${section}.`,
    };
    return `Section: ${section}
Q: ${sample.q}
A) ${sample.o[0]}
B) ${sample.o[1]}
C) ${sample.o[2]}
D) ${sample.o[3]}
Ans: ${sample.a}
E: ${sample.e}`;
  }).join('\n\n');
}

export const BULK_MOCK_EXAMPLE = buildBulkMockExample(MOCK_SECTIONS);

function tryParseJson(raw) {
  const t = raw.trim();
  if (!t.startsWith('[') && !t.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(t);
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list;
  } catch {
    return null;
  }
}

function splitBlocks(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  if (/\n(?:Section|S)\s*[:.]/i.test(normalized) || /^(?:Section|S)\s*[:.]/i.test(normalized)) {
    const bySection = normalized
      .split(/\n(?=(?:Section|S)\s*[:.])/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (bySection.length > 1 || /^(?:Section|S)\s*[:.]/i.test(bySection[0] || '')) {
      return bySection;
    }
  }

  const parts = normalized.split(/\n(?=(?:Q[:.\s]|Question\s*[:.]|\d{1,3}[.)]\s))/i);
  if (parts.length > 1) return parts.map((p) => p.trim()).filter(Boolean);

  return normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Resolve a section name against optional allowed list for the current exam.
 * Falls back to trimmed title-case string so custom exam sections work.
 */
export function normalizeSection(raw, allowedSections = null) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s) return null;

  const allowed = Array.isArray(allowedSections) && allowedSections.length
    ? allowedSections
    : null;

  if (allowed) {
    const exact = allowed.find((a) => a.toLowerCase() === s.toLowerCase());
    if (exact) return exact;
  } else if (MOCK_SECTIONS.includes(s)) {
    return s;
  }

  const aliased = SECTION_ALIASES[s.toLowerCase()];
  if (aliased) {
    if (!allowed) return aliased;
    const match = allowed.find((a) => a.toLowerCase() === aliased.toLowerCase());
    if (match) return match;
  }

  // Keep custom label as typed (title-ish) when allowed list not restricting
  if (!allowed) return s;

  return null;
}

function parseAnswerIndex(raw, options) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const letter = s.match(/^([A-Da-d1-4])\b/);
  if (letter) {
    const idx = ANS_LETTER[letter[1].toLowerCase()];
    if (idx != null) return idx;
  }

  const lower = s.toLowerCase();
  const byText = options.findIndex((o) => o.toLowerCase() === lower);
  if (byText >= 0) return byText;

  const n = Number(s);
  if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  if (Number.isInteger(n) && n >= 1 && n <= 4) return n - 1;
  return null;
}

function parseOneBlock(block, allowedSections) {
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 5) return null;

  let q = '';
  let section = null;
  const options = [];
  let ansRaw = '';
  let explanation = '';

  for (const line of lines) {
    const sectionMatch = line.match(/^(?:Section|S)\s*[:.\-]?\s*(.+)$/i);
    const qMatch = line.match(/^(?:Q(?:uestion)?\s*[:.]?\s*|\d{1,3}[.)]\s*)(.+)$/i);
    const optMatch = line.match(/^(?:([A-Da-d])[).:\-]\s*|\(([A-Da-d])\)\s*)(.+)$/);
    const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct)\s*[:.\-]?\s*(.+)$/i);
    const expMatch = line.match(/^(?:E|Exp(?:lanation)?|Explain)\s*[:.\-]?\s*(.+)$/i);

    if (sectionMatch) {
      section = normalizeSection(sectionMatch[1], allowedSections);
      continue;
    }
    if (optMatch && options.length < 4) {
      options.push((optMatch[3] || '').trim());
      continue;
    }
    if (ansMatch) {
      ansRaw = ansMatch[1].trim();
      continue;
    }
    if (expMatch) {
      explanation = expMatch[1].trim();
      continue;
    }
    if (qMatch && !q) {
      q = qMatch[1].trim();
      continue;
    }
    if (!options.length && q && !ansRaw) {
      q = `${q} ${line}`.trim();
    }
  }

  if (!q || options.length < 4) return null;
  const a = parseAnswerIndex(ansRaw, options);
  if (a == null || a < 0 || a > 3) return null;

  return {
    q: normalizeMcqField(q),
    o: options.slice(0, 4).map(normalizeMcqField),
    a,
    e: normalizeMcqField(explanation),
    section,
  };
}

/**
 * @param {string} raw
 * @param {{ subject?: string, category?: string, defaultSection?: string, allowedSections?: string[] }} [meta]
 */
export function parseBulkQuestions(raw, meta = {}) {
  const subject = meta.subject || null;
  const category = (meta.category || 'General').trim() || 'General';
  const allowedSections = meta.allowedSections || null;
  const defaultSection = normalizeSection(meta.defaultSection, allowedSections) || null;
  const errors = [];

  const jsonList = tryParseJson(raw);
  if (jsonList) {
    const items = [];
    jsonList.forEach((row, i) => {
      const q = String(row.q ?? row.question ?? '').trim();
      const oRaw = row.o ?? row.options;
      const aRaw = row.a ?? row.correctAnswer;
      const e = String(row.e ?? row.explanation ?? '').trim();
      if (!q || !Array.isArray(oRaw) || oRaw.length < 4) {
        errors.push(`Item #${i + 1}: question or options missing`);
        return;
      }
      const o = oRaw.slice(0, 4).map((x) => String(x).trim());
      if (o.some((x) => !x)) {
        errors.push(`Item #${i + 1}: empty option`);
        return;
      }
      let a = Number(aRaw);
      if (typeof aRaw === 'string' && /[A-Da-d]/.test(aRaw.trim())) {
        a = ANS_LETTER[aRaw.trim()[0].toLowerCase()];
      }
      if (!Number.isInteger(a) || a < 0 || a > 3) {
        errors.push(`Item #${i + 1}: invalid answer`);
        return;
      }
      const section =
        normalizeSection(row.section, allowedSections)
        || defaultSection
        || normalizeSection(row.subject, allowedSections)
        || null;
      items.push({
        subject: row.subject || subject,
        category: String(row.category || row.topic || row.state || category).trim() || category,
        section,
        q: normalizeMcqField(q),
        o: o.map(normalizeMcqField),
        a,
        e: normalizeMcqField(e),
      });
    });
    return { items, errors, source: 'json' };
  }

  const blocks = splitBlocks(raw);
  const items = [];
  blocks.forEach((block, i) => {
    const parsed = parseOneBlock(block, allowedSections);
    if (!parsed) {
      errors.push(`Block #${i + 1}: invalid format (requires Q, A–D options, and Ans)`);
      return;
    }
    items.push({
      subject,
      category,
      section: parsed.section || defaultSection,
      q: parsed.q,
      o: parsed.o,
      a: parsed.a,
      e: parsed.e,
    });
  });

  return { items, errors, source: 'text' };
}

export function toCompactMcqs(items, { requireSection = false } = {}) {
  const out = [];
  const errors = [];
  items.forEach((item, i) => {
    if (!item?.q || !Array.isArray(item.o) || item.o.length < 4) {
      errors.push(`Item #${i + 1}: incomplete`);
      return;
    }
    if (requireSection && !item.section) {
      errors.push(`Item #${i + 1}: missing section`);
      return;
    }
    const row = {
      q: item.q,
      o: item.o.slice(0, 4).map((x) => String(x)),
      a: item.a,
      e: item.e || '',
    };
    if (item.section) row.section = item.section;
    out.push(row);
  });
  return { items: out, errors };
}

export const BULK_SAMPLE = BULK_MCQ_EXAMPLE;
