import mongoose from 'mongoose';
import { Vocab, type IVocab } from './vocab.model.js';
import { shuffle } from '../../shared/utils/shuffle.js';

export type VocabPromptKind =
  | 'idiom-meaning'
  | 'ows-word'
  | 'wp-meaning'
  | 'wp-synonym'
  | 'wp-antonym';

export type VocabLean = IVocab & { _id: mongoose.Types.ObjectId };

export interface VocabMcq {
  _id: string;
  promptKind: VocabPromptKind;
  question: string;
  options: string[];
  correctAnswer: string;
  isIdiom: boolean;
  word: string;
  revealDefinition: string;
  revealSynonyms: string[];
  revealAntonyms: string[];
  pos?: string;
  category: string;
}

const SPELLING = 'Spelling Rules';
const IDIOMS = 'Idioms & Phrases';

export function isIdiomEntry(doc: { category?: string; pos?: string } | null | undefined): boolean {
  if (!doc) return false;
  return String(doc.category || '') === IDIOMS || /idiom/i.test(String(doc.pos || ''));
}

export function displayText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normVocabAnswer(value: unknown): string {
  return displayText(value).toLowerCase();
}

export function answersMatch(a: unknown, b: unknown): boolean {
  const left = normVocabAnswer(a);
  const right = normVocabAnswer(b);
  return Boolean(left) && left === right;
}

function isJunkOption(value: string): boolean {
  const k = normVocabAnswer(value);
  return !k
    || /^none of (the|these)/.test(k)
    || /^all of (the|these)/.test(k)
    || /^both \(?[a-d]/.test(k)
    || /^option [a-d]$/.test(k);
}

export function inferVocabPromptKind(
  question: string,
  category?: string,
  pos?: string,
): VocabPromptKind {
  if (isIdiomEntry({ category, pos })) return 'idiom-meaning';
  const q = String(question || '').toLowerCase();
  if (q.includes('idiom')) return 'idiom-meaning';
  if (q.includes('substituted') || category === 'One Word Substitution') return 'ows-word';
  if (/\bsynonym\b/.test(q)) return 'wp-synonym';
  if (/\bantonym\b/.test(q)) return 'wp-antonym';
  return 'wp-meaning';
}

export function acceptedVocabAnswers(doc: IVocab, kind: VocabPromptKind): string[] {
  const list = (arr?: string[]) => (arr || []).map(displayText).filter(Boolean);
  switch (kind) {
    case 'idiom-meaning':
    case 'wp-meaning':
      return [displayText(doc.definition)].filter(Boolean);
    case 'ows-word':
      return [displayText(doc.word)].filter(Boolean);
    case 'wp-synonym':
      return list(doc.synonyms);
    case 'wp-antonym':
      return list(doc.antonyms);
    default:
      return [];
  }
}

function excludeKeys(doc: IVocab, extra: string[] = []): Set<string> {
  const base = isIdiomEntry(doc)
    ? [doc.word, doc.definition, ...extra]
    : [doc.word, doc.definition, ...(doc.synonyms || []), ...(doc.antonyms || []), ...extra];
  return new Set(base.map(normVocabAnswer).filter(Boolean));
}

function fieldForKind(kind: VocabPromptKind): 'definition' | 'word' {
  return kind === 'idiom-meaning' || kind === 'wp-meaning' ? 'definition' : 'word';
}

function pickWordPowerKind(doc: IVocab): VocabPromptKind {
  const kinds: VocabPromptKind[] = ['wp-meaning'];
  if ((doc.synonyms || []).some((s) => displayText(s))) kinds.push('wp-synonym');
  if ((doc.antonyms || []).some((s) => displayText(s))) kinds.push('wp-antonym');
  return kinds[Math.floor(Math.random() * kinds.length)];
}

async function sampleTexts(
  match: Record<string, unknown>,
  field: 'definition' | 'word',
  size: number,
): Promise<string[]> {
  const rows = await Vocab.aggregate<IVocab>([
    { $match: match },
    { $sample: { size } },
  ]);
  return rows.map((row) => displayText(field === 'definition' ? row.definition : row.word));
}

export async function collectDistractors(params: {
  category: string;
  field: 'definition' | 'word';
  exclude: Set<string>;
  stored?: string[];
  need?: number;
  excludeId?: mongoose.Types.ObjectId;
}): Promise<string[]> {
  const need = params.need ?? 3;
  const picked: string[] = [];
  const seen = new Set(params.exclude);

  const push = (raw: unknown): boolean => {
    const value = displayText(raw);
    const key = value.toLowerCase();
    if (!value || isJunkOption(value) || seen.has(key)) return false;
    seen.add(key);
    picked.push(value);
    return picked.length >= need;
  };

  for (const option of params.stored || []) {
    if (push(option)) return picked;
  }

  const notSelf = params.excludeId
    ? { _id: { $ne: params.excludeId } }
    : {};
  const sameCategory = {
    ...notSelf,
    category: params.category || { $ne: SPELLING },
  };
  const anyVocab = {
    ...notSelf,
    category: { $ne: SPELLING },
  };

  for (const candidate of await sampleTexts(sameCategory, params.field, 24)) {
    if (push(candidate)) return picked;
  }
  if (picked.length < need && params.category !== IDIOMS) {
    for (const candidate of await sampleTexts(anyVocab, params.field, 24)) {
      if (push(candidate)) return picked;
    }
  }

  if (picked.length < need && params.category) {
    const select = params.field === 'definition' ? 'definition' : 'word';
    const rest = await Vocab.find({
      ...(params.excludeId ? { _id: { $ne: params.excludeId } } : {}),
      category: params.category,
    }).select(select).lean();
    for (const row of rest) {
      if (push(row[select])) return picked;
    }
  }

  return picked;
}

export async function distractorsForEntry(doc: VocabLean): Promise<string[]> {
  const category = isIdiomEntry(doc) ? IDIOMS : String(doc.category || '');
  const field: 'definition' | 'word' = category === IDIOMS ? 'definition' : 'word';
  const extra = field === 'definition' ? [displayText(doc.definition)] : [displayText(doc.word)];
  return collectDistractors({
    category,
    field,
    exclude: excludeKeys(doc, extra),
    stored: [],
    need: 3,
    excludeId: doc._id,
  });
}

export async function buildVocabMcq(doc: VocabLean): Promise<VocabMcq | null> {
  const word = displayText(doc.word);
  const definition = displayText(doc.definition);
  const category = String(doc.category || '');
  if (!word || !definition || category === SPELLING) return null;

  let kind: VocabPromptKind;
  let question: string;
  let correctAnswer: string;
  const idiom = isIdiomEntry(doc);

  if (idiom) {
    kind = 'idiom-meaning';
    question = `Select the most appropriate meaning of the idiom: "${word}"`;
    correctAnswer = definition;
  } else if (category === 'One Word Substitution') {
    kind = 'ows-word';
    question = `Choose the one word which can be substituted for: "${definition}"`;
    correctAnswer = word;
  } else {
    kind = pickWordPowerKind(doc);
    if (kind === 'wp-synonym') {
      const synonyms = (doc.synonyms || []).map(displayText).filter(Boolean);
      correctAnswer = synonyms[Math.floor(Math.random() * synonyms.length)];
      question = `Select the most appropriate SYNONYM of "${word}"`;
    } else if (kind === 'wp-antonym') {
      const antonyms = (doc.antonyms || []).map(displayText).filter(Boolean);
      correctAnswer = antonyms[Math.floor(Math.random() * antonyms.length)];
      question = `Select the most appropriate ANTONYM of "${word}"`;
    } else {
      kind = 'wp-meaning';
      correctAnswer = definition;
      question = `Select the most appropriate meaning of "${word}"`;
    }
  }

  if (!correctAnswer) return null;

  const field = fieldForKind(kind);
  const stored = kind === 'idiom-meaning'
    ? (doc.options || []).filter((option) => displayText(option).split(/\s+/).length >= 2)
    : kind === 'wp-meaning'
      ? []
      : (doc.options || []);
  const wrong = await collectDistractors({
    category: idiom ? IDIOMS : category,
    field,
    exclude: excludeKeys(doc, [correctAnswer]),
    stored,
    need: 3,
    excludeId: doc._id,
  });
  if (wrong.length < 3) return null;

  const options = shuffle([correctAnswer, ...wrong.slice(0, 3)]);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const option of options) {
    const key = normVocabAnswer(option);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(option);
  }
  if (unique.length < 4 || !unique.some((option) => answersMatch(option, correctAnswer))) {
    return null;
  }

  return {
    _id: String(doc._id),
    promptKind: kind,
    question,
    options: unique.slice(0, 4),
    correctAnswer,
    isIdiom: idiom,
    word,
    revealDefinition: definition,
    revealSynonyms: idiom ? [] : (doc.synonyms || []).map(displayText).filter(Boolean),
    revealAntonyms: idiom ? [] : (doc.antonyms || []).map(displayText).filter(Boolean),
    pos: idiom ? (doc.pos || 'Idiom') : doc.pos,
    category: idiom ? IDIOMS : category,
  };
}

export async function getRandomVocabMcq(): Promise<VocabMcq | null> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const [row] = await Vocab.aggregate<VocabLean>([
      { $match: { category: { $ne: SPELLING } } },
      { $sample: { size: 1 } },
    ]);
    if (!row) return null;
    const mcq = await buildVocabMcq(row);
    if (mcq) return mcq;
  }
  return null;
}

export function extractQuoted(question: string): string | null {
  const match = String(question || '').match(/"([^"]+)"/);
  return match ? match[1] : null;
}

/** Write 3 same-type distractors onto every row in a category (idiom meanings / OWS-WP words). */
export async function fillStoredDistractors(category: string): Promise<{ count: number; updated: number; short: number }> {
  const field: 'definition' | 'word' = category === IDIOMS ? 'definition' : 'word';
  if (category === IDIOMS) {
    await Vocab.updateMany(
      { $or: [{ category: IDIOMS }, { pos: /idiom/i }] },
      { $set: { category: IDIOMS, synonyms: [], antonyms: [] } },
    );
  }
  const rows = await Vocab.find({ category }).lean<VocabLean[]>();
  const pool = rows
    .map((row) => displayText(field === 'definition' ? row.definition : row.word))
    .filter((value) => value && !isJunkOption(value));

  const ops: Parameters<typeof Vocab.bulkWrite>[0] = [];
  let short = 0;

  for (const row of rows) {
    const correct = displayText(field === 'definition' ? row.definition : row.word);
    const banned = excludeKeys(row, [correct]);
    const picked: string[] = [];
    const seen = new Set(banned);

    for (const raw of shuffle(pool)) {
      const value = displayText(raw);
      const key = value.toLowerCase();
      if (!value || isJunkOption(value) || seen.has(key)) continue;
      seen.add(key);
      picked.push(value);
      if (picked.length === 3) break;
    }

    if (picked.length < 3) short += 1;
    if (picked.length === 0) continue;
    ops.push({
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: category === IDIOMS
            ? { options: picked.slice(0, 3), synonyms: [], antonyms: [] }
            : { options: picked.slice(0, 3) },
        },
      },
    });
  }

  if (ops.length) await Vocab.bulkWrite(ops, { ordered: false });
  return { count: rows.length, updated: ops.length, short };
}
