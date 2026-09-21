import { badRequest } from '../../utils/app-errors.js';
import { isRecord, mongoErrorCode } from '../../types/domain.js';
import { normalizeMcqField } from './mcqText.js';
import TCSQuestionRepository from './tcs-question.repository.js';
import type {
  BulkUploadResult,
  SubjectUploadRow,
  TcsStatsData,
  TCSQuestionInsert,
  UploadStats,
  UserAddResult,
} from './tcs-question.interface.js';

const DEFAULT_SUBJECTS = ['GK', 'English', 'Maths', 'Reasoning'];

const SUBJECT_ALIASES: Record<string, string> = {
  gk: 'GK',
  'general knowledge': 'GK',
  'general awareness': 'GK',
  ga: 'GK',
  english: 'English',
  eng: 'English',
  maths: 'Maths',
  math: 'Maths',
  mathematics: 'Maths',
  quant: 'Maths',
  quantitative: 'Maths',
  'quantitative aptitude': 'Maths',
  reasoning: 'Reasoning',
  reason: 'Reasoning',
  computer: 'Computer',
  'computer awareness': 'Computer',
  'computer knowledge': 'Computer',
};

/** topicId prefixes used in seeded syllabus questions → TCS drill subject */
const TOPIC_PREFIX_TO_SUBJECT: [RegExp, string][] = [
  [/^ga[-_]/i, 'GK'],
  [/^gk[-_]/i, 'GK'],
  [/^eng(?:lish)?[-_]/i, 'English'],
  [/^quant(?:itative)?[-_]/i, 'Maths'],
  [/^math(?:s|ematics)?[-_]/i, 'Maths'],
  [/^reason(?:ing)?[-_]/i, 'Reasoning'],
  [/^comp(?:uter)?[-_]/i, 'Computer'],
  [/^bio[-_]/i, 'GK'],
  [/^chem[-_]/i, 'GK'],
  [/^physics[-_]/i, 'GK'],
  [/^polity[-_]/i, 'GK'],
  [/^history[-_]/i, 'GK'],
  [/^geo[-_]/i, 'GK'],
];

function normalizeQuestionText(text: unknown): string {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accept any subject name; map known aliases; title-case freeform labels. */
function normalizeSubject(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().replace(/\s+/g, ' ');
  if (!s) return null;
  if (DEFAULT_SUBJECTS.includes(s)) return s;
  const aliased = SUBJECT_ALIASES[s.toLowerCase()];
  if (aliased) return aliased;
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function subjectFromTopicId(topicId: unknown): string | null {
  if (!topicId) return null;
  const id = String(topicId).trim();
  for (const [re, subject] of TOPIC_PREFIX_TO_SUBJECT) {
    if (re.test(id)) return subject;
  }
  return normalizeSubject(id);
}

function categoryFromTopicId(topicId: unknown): string {
  if (!topicId) return 'General';
  return String(topicId)
    .replace(/^(ga|gk|eng(?:lish)?|quant(?:itative)?|math(?:s|ematics)?|reason(?:ing)?|comp(?:uter)?|bio|chem|physics|polity|history|geo)[-_]+/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'General';
}

/**
 * Accepts:
 * 1) TCS bank: { question, options, correctAnswer, subject, category, ... }
 * 2) Compact: { q, o, a, e, subject|section, category }
 * 3) Syllabus/Mongo export: { topicId, q, o, a, e, state?, _id?, __v? }
 */
function normalizeItem(raw: unknown): TCSQuestionInsert | null {
  if (!isRecord(raw)) return null;

  const question = normalizeMcqField(String(raw.question ?? raw.q ?? '').replace(/\r\n/g, '\n'));
  const optionsRaw = raw.options ?? raw.o;
  const correctRaw = raw.correctAnswer ?? raw.a;
  const explanation = normalizeMcqField(String(raw.explanation ?? raw.e ?? '').replace(/\r\n/g, '\n'));

  const topicId = raw.topicId ? String(raw.topicId).trim() : '';
  let subject = normalizeSubject(raw.subject ?? raw.section);
  if (!subject && topicId) subject = subjectFromTopicId(topicId);

  const category = String(
    raw.category
    || raw.topic
    || raw.state
    || (topicId ? categoryFromTopicId(topicId) : '')
    || subject
    || 'General',
  ).trim() || 'General';

  const year = raw.year != null && raw.year !== '' ? Number(raw.year) : null;
  const isImportant = Boolean(raw.isImportant);

  if (!question || !subject) return null;
  if (!Array.isArray(optionsRaw) || optionsRaw.length < 2) return null;
  if (correctRaw === undefined || correctRaw === null || Number.isNaN(Number(correctRaw))) return null;

  const options = optionsRaw.map((opt) => normalizeMcqField(typeof opt === 'string' ? opt : String(opt)));
  const correctAnswer = Number(correctRaw);
  if (correctAnswer < 0 || correctAnswer >= options.length) return null;

  return {
    question,
    options,
    correctAnswer,
    explanation,
    subject,
    category,
    year: Number.isFinite(year) ? year : null,
    isImportant,
  };
}

type SubjectUploadField = 'inserted' | 'duplicates' | 'invalid';

function parseQuestionList(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.questions)) return payload.questions;
  return null;
}

function guessSubject(raw: unknown): string {
  if (!isRecord(raw)) return 'Unknown';
  return normalizeSubject(raw.subject ?? raw.section)
    || (raw.topicId ? subjectFromTopicId(raw.topicId) : null)
    || 'Unknown';
}

async function buildSeenQuestionKeys(): Promise<Set<string>> {
  const existing = await TCSQuestionRepository.findAllQuestionTexts();
  return new Set(existing.map((q) => normalizeQuestionText(q.question)));
}

function partitionQuestions(
  list: unknown[],
  seen: Set<string>,
  trackBySubject: boolean,
): {
  toInsert: TCSQuestionInsert[];
  invalid: number;
  duplicates: number;
  bySubject: Record<string, SubjectUploadRow>;
} {
  const toInsert: TCSQuestionInsert[] = [];
  let invalid = 0;
  let duplicates = 0;
  const bySubject: Record<string, SubjectUploadRow> = {};

  const bump = (subject: string | null | undefined, field: SubjectUploadField) => {
    if (!trackBySubject) return;
    const key = subject || 'Unknown';
    if (!bySubject[key]) {
      bySubject[key] = { inserted: 0, duplicates: 0, invalid: 0, received: 0 };
    }
    bySubject[key][field] += 1;
    bySubject[key].received += 1;
  };

  for (const raw of list) {
    const item = normalizeItem(raw);
    if (!item) {
      invalid++;
      bump(guessSubject(raw), 'invalid');
      continue;
    }
    const key = normalizeQuestionText(item.question);
    if (seen.has(key)) {
      duplicates++;
      bump(item.subject, 'duplicates');
      continue;
    }
    seen.add(key);
    toInsert.push(item);
    bump(item.subject, 'inserted');
  }

  return { toInsert, invalid, duplicates, bySubject };
}

function formatSubjectSummary(bySubject: Record<string, SubjectUploadRow>): string {
  const subjectLines = Object.entries(bySubject)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subject, row]) => {
      const parts = [`${row.inserted} added`];
      if (row.duplicates) parts.push(`${row.duplicates} duplicate`);
      if (row.invalid) parts.push(`${row.invalid} invalid`);
      return `${subject}: ${parts.join(', ')}`;
    });

  return subjectLines.length ? ` ${subjectLines.join(' · ')}` : '';
}

export class TcsQuestionService {
  async getTcsStats(): Promise<TcsStatsData> {
  return TCSQuestionRepository.getCountBySubject();
}

  async bulkUploadTcsQuestions(payload: unknown): Promise<BulkUploadResult> {
  const list = parseQuestionList(payload);

  if (!list) {
    throw badRequest('Expected a JSON array of questions (or { "questions": [...] }).');
  }
  if (list.length === 0) {
    throw badRequest('Question list is empty.');
  }
  if (list.length > 2000) {
    throw badRequest('Max 2000 questions per upload. Split into smaller batches.');
  }

  const seen = await buildSeenQuestionKeys();
  const { toInsert, invalid, duplicates, bySubject } = partitionQuestions(list, seen, true);

  let inserted = 0;
  try {
    inserted = await TCSQuestionRepository.insertMany(toInsert, { ordered: false });
  } catch (error) {
    if (mongoErrorCode(error) === 11000) {
      return {
        kind: 'partial_success',
        message: 'Bulk insert finished with some duplicates skipped.',
      };
    }
    throw error;
  }

  const stats = await TCSQuestionRepository.getCountBySubject();
  const summary = formatSubjectSummary(bySubject);

  return {
    kind: 'success',
    statusCode: inserted > 0 ? 201 : 200,
    message: inserted > 0
      ? `Imported ${inserted} question(s). ${duplicates} duplicate(s), ${invalid} invalid skipped.${summary}`
      : `Nothing new imported. ${duplicates} duplicate(s), ${invalid} invalid skipped.${summary}`,
    data: {
      inserted,
      duplicates,
      invalid,
      received: list.length,
      bySubject,
      stats,
    },
  };
}

  async addQuestionsFromUser(payload: unknown): Promise<UserAddResult> {
  const list = parseQuestionList(payload);

  if (!list || list.length === 0) {
    throw badRequest('Send a JSON array of question objects (or { "questions": [...] }).');
  }
  if (list.length > 50) {
    throw badRequest('Max 50 questions per submission. Split into smaller batches.');
  }

  const seen = await buildSeenQuestionKeys();
  const { toInsert, invalid, duplicates } = partitionQuestions(list, seen, false);

  let inserted = 0;
  try {
    inserted = await TCSQuestionRepository.insertMany(toInsert, { ordered: false });
  } catch (error) {
    if (mongoErrorCode(error) === 11000) {
      return {
        kind: 'partial_success',
        message: 'Insert finished with some duplicates skipped.',
      };
    }
    throw error;
  }

  const stats = await TCSQuestionRepository.getCountBySubject();

  return {
    kind: 'success',
    statusCode: inserted > 0 ? 201 : 200,
    message: inserted > 0
      ? `Added ${inserted} question(s) to the drill bank. ${duplicates} duplicate(s), ${invalid} invalid skipped.`
      : `Nothing new added. ${duplicates} duplicate(s), ${invalid} invalid skipped.`,
    data: {
      inserted,
      duplicates,
      invalid,
      received: list.length,
      stats,
    },
  };
}
}

export const tcsQuestionService = new TcsQuestionService();
