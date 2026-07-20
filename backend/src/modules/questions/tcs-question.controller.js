import TCSQuestion from './tcs-question.model.js';
import TCSQuestionRepository from './tcs-question.repository.js';
import { normalizeMcqField } from './mcqText.js';

const DEFAULT_SUBJECTS = ['GK', 'English', 'Maths', 'Reasoning'];

const SUBJECT_ALIASES = {
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
const TOPIC_PREFIX_TO_SUBJECT = [
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
  [/^geo[-_]/i, 'GK']
];

function normalizeQuestionText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accept any subject name; map known aliases; title-case freeform labels. */
function normalizeSubject(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().replace(/\s+/g, ' ');
  if (!s) return null;
  if (DEFAULT_SUBJECTS.includes(s)) return s;
  const aliased = SUBJECT_ALIASES[s.toLowerCase()];
  if (aliased) return aliased;
  // Title Case for custom subjects like "computer awareness" → "Computer Awareness"
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function subjectFromTopicId(topicId) {
  if (!topicId) return null;
  const id = String(topicId).trim();
  for (const [re, subject] of TOPIC_PREFIX_TO_SUBJECT) {
    if (re.test(id)) return subject;
  }
  // bare subject as topicId
  return normalizeSubject(id);
}

function categoryFromTopicId(topicId) {
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
 *    e.g. topicId "ga-culture-geography" → subject GK, category Culture Geography
 */
function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const question = normalizeMcqField(String(raw.question ?? raw.q ?? '').replace(/\r\n/g, '\n'));
  const optionsRaw = raw.options ?? raw.o;
  const correctRaw = raw.correctAnswer ?? raw.a;
  const explanation = normalizeMcqField(String(raw.explanation ?? raw.e ?? '').replace(/\r\n/g, '\n'));

  const topicId = raw.topicId ? String(raw.topicId).trim() : '';
  let subject = normalizeSubject(raw.subject ?? raw.section);
  if (!subject && topicId) subject = subjectFromTopicId(topicId);

  let category = String(
    raw.category
    || raw.topic
    || raw.state
    || (topicId ? categoryFromTopicId(topicId) : '')
    || subject
    || 'General'
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
    isImportant
  };
}

export const getTcsStats = async (req, res, next) => {
  try {
    const stats = await TCSQuestionRepository.getCountBySubject();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadTcsQuestions = async (req, res, next) => {
  try {
    const payload = req.body;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
        ? payload.questions
        : null;

    if (!list) {
      return res.status(400).json({
        status: 'error',
        message: 'Expected a JSON array of questions (or { "questions": [...] }).'
      });
    }

    if (list.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Question list is empty.' });
    }

    if (list.length > 2000) {
      return res.status(400).json({
        status: 'error',
        message: 'Max 2000 questions per upload. Split into smaller batches.'
      });
    }

    const existing = await TCSQuestion.find({}, { question: 1 }).lean();
    const seen = new Set(existing.map((q) => normalizeQuestionText(q.question)));

    const toInsert = [];
    let invalid = 0;
    let duplicates = 0;

    for (const raw of list) {
      const item = normalizeItem(raw);
      if (!item) {
        invalid++;
        continue;
      }
      const key = normalizeQuestionText(item.question);
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      toInsert.push(item);
    }

    let inserted = 0;
    if (toInsert.length > 0) {
      const result = await TCSQuestion.insertMany(toInsert, { ordered: false });
      inserted = result.length;
    }

    const stats = await TCSQuestionRepository.getCountBySubject();

    res.status(inserted > 0 ? 201 : 200).json({
      status: 'success',
      message: inserted > 0
        ? `Imported ${inserted} question(s). ${duplicates} duplicate(s), ${invalid} invalid skipped.`
        : `Nothing new imported. ${duplicates} duplicate(s), ${invalid} invalid skipped.`,
      data: {
        inserted,
        duplicates,
        invalid,
        received: list.length,
        stats
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(207).json({
        status: 'partial_success',
        message: 'Bulk insert finished with some duplicates skipped.'
      });
    }
    next(error);
  }
};
