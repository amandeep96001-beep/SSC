import mongoose from 'mongoose';
import vocabRepository from '../study/vocab.repository.js';
import TCSQuestionRepository from '../questions/tcs-question.repository.js';
import drillPerformanceRepository from './drill-performance.repository.js';
import {
  acceptedVocabAnswers,
  answersMatch,
  buildVocabMcq,
  extractQuoted,
  getRandomVocabMcq,
  inferVocabPromptKind,
} from '../study/vocab.mcq.js';
import type { VocabLean } from '../study/study.interface.js';
import { badRequest, notFound } from '../../utils/app-errors.js';
import { signDrillChallenge, verifyDrillChallenge } from '../../lib/challenge-token.js';
import wrongLogRepository from './wrong-log.repository.js';
import type { WrongLogUpsertInput } from './wrong-log.interface.js';

const SUBJECT_MAP: Record<string, string> = {
  gk: 'GK',
  'english-mcq': 'English',
  'maths-mcq': 'Maths',
  'reasoning-mcq': 'Reasoning',
};

function cleanDrillAnswer(value: unknown, type: string): string {
  let text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (type === 'fraction' || type === 'percentage') {
    text = text.replace(/%/g, '');
  }
  return text;
}

function publicDrill(
  payload: Record<string, unknown>,
  challenge: { userId: string; answer: string; questionId?: string; question?: string; subject?: string; drillType: string },
): Record<string, unknown> {
  const { correctAnswer: _drop, ...rest } = payload;
  void _drop;
  return {
    ...rest,
    challengeToken: signDrillChallenge(challenge),
  };
}

export class DrillService {
  async getNextDrill(params: {
    type: string;
    maxBase?: unknown;
    userId: string;
  }): Promise<Record<string, unknown>> {
    const { type, maxBase, userId } = params;

    switch (type) {
      case 'table': {
        const max = Math.min(50, Math.max(12, parseInt(String(maxBase ?? ''), 10) || 20));
        let tableBase: number;
        do {
          tableBase = Math.floor(Math.random() * (max - 12 + 1)) + 12;
        } while (tableBase % 10 === 0 && max > 12);

        const multiplier = Math.floor(Math.random() * 8) + 2;
        const answer = (tableBase * multiplier).toString();
        return publicDrill(
          {
            type,
            question: `${tableBase} × ${multiplier}`,
            placeholder: 'Enter calculations result...',
          },
          { userId, drillType: type, answer, question: `${tableBase} × ${multiplier}` },
        );
      }

      case 'fraction': {
        const conversion = await vocabRepository.getRandomConversion();
        return publicDrill(
          {
            type,
            question: `Convert fraction: ${conversion.fraction}`,
            placeholder: 'e.g. 12.5%',
          },
          {
            userId,
            drillType: type,
            answer: String(conversion.percentage),
            question: `Convert fraction: ${conversion.fraction}`,
          },
        );
      }

      case 'percentage': {
        const conversion = await vocabRepository.getRandomConversion();
        return publicDrill(
          {
            type,
            question: `Convert percentage: ${conversion.percentage}`,
            placeholder: 'e.g. 1/8',
          },
          {
            userId,
            drillType: type,
            answer: String(conversion.fraction),
            question: `Convert percentage: ${conversion.percentage}`,
          },
        );
      }

      case 'square': {
        const max = Math.max(2, parseInt(String(maxBase ?? ''), 10) || 30);
        const num = Math.floor(Math.random() * max) + 1;
        return publicDrill(
          {
            type,
            question: `What is the square of ${num}? (${num}²)`,
            placeholder: 'Enter square...',
          },
          { userId, drillType: type, answer: String(num * num), question: `What is the square of ${num}? (${num}²)` },
        );
      }

      case 'cube': {
        const max = Math.max(2, parseInt(String(maxBase ?? ''), 10) || 20);
        const num = Math.floor(Math.random() * max) + 1;
        return publicDrill(
          {
            type,
            question: `What is the cube of ${num}? (${num}³)`,
            placeholder: 'Enter cube...',
          },
          { userId, drillType: type, answer: String(num * num * num), question: `What is the cube of ${num}? (${num}³)` },
        );
      }

      case 'vocab': {
        const mcq = await getRandomVocabMcq();
        if (!mcq) {
          throw notFound('No vocabulary questions are available yet.');
        }
        const { correctAnswer, ...rest } = mcq;
        return publicDrill(
          { type, ...rest },
          {
            userId,
            drillType: type,
            answer: String(correctAnswer),
            questionId: mcq._id ? String(mcq._id) : undefined,
            question: mcq.question,
          },
        );
      }

      case 'gk':
      case 'english-mcq':
      case 'maths-mcq':
      case 'reasoning-mcq': {
        const subject = SUBJECT_MAP[type];
        const tcsQ = await TCSQuestionRepository.getWeightedQuestion(subject, userId);

        if (!tcsQ) {
          throw notFound(`No ${subject} questions found in database.`);
        }

        const answer = String(tcsQ.options[tcsQ.correctAnswer] ?? '');
        return publicDrill(
          {
            type,
            _id: tcsQ._id?.toString() || null,
            question: tcsQ.question,
            options: tcsQ.options,
            explanation: tcsQ.explanation,
            category: tcsQ.category,
            subject,
            year: tcsQ.year,
            isImportant: tcsQ.isImportant || false,
          },
          {
            userId,
            drillType: type,
            answer,
            questionId: tcsQ._id?.toString(),
            question: tcsQ.question,
            subject,
          },
        );
      }

      default:
        throw badRequest(`Unknown drill type: ${type}.`);
    }
  }

  async verifyDrill(params: {
    challengeToken: string;
    userAnswer: unknown;
    userId: string;
  }): Promise<{ isCorrect: boolean; correctAnswer: unknown }> {
    const { challengeToken, userAnswer, userId } = params;
    if (!challengeToken) throw badRequest('challengeToken is required.');
    if (userAnswer === undefined || userAnswer === null || String(userAnswer).trim() === '') {
      throw badRequest('userAnswer is required.');
    }

    const challenge = verifyDrillChallenge(challengeToken, userId);
    const type = challenge.drillType;

    if (type === 'vocab') {
      let doc: VocabLean | null = null;
      if (challenge.questionId && mongoose.isValidObjectId(challenge.questionId)) {
        doc = await vocabRepository.findByIdLean(challenge.questionId);
      }
      if (!doc) {
        const quoted = extractQuoted(String(challenge.question || ''));
        if (quoted) {
          doc = await vocabRepository.findByWordCaseInsensitive(quoted);
        }
      }

      const kind = inferVocabPromptKind(String(challenge.question || ''), doc?.category, doc?.pos);
      const accepted = [
        ...(doc ? acceptedVocabAnswers(doc, kind) : []),
        challenge.answer,
      ].filter(Boolean);

      const isCorrect = accepted.some((answer) => answersMatch(answer, userAnswer));
      const authoritativeCorrect =
        accepted.find((answer) => answersMatch(answer, challenge.answer))
        || accepted[0]
        || challenge.answer;

      return { isCorrect, correctAnswer: authoritativeCorrect };
    }

    let authoritativeCorrect = challenge.answer;
    const subject = SUBJECT_MAP[type] || challenge.subject;
    if (subject && challenge.questionId && mongoose.isValidObjectId(challenge.questionId)) {
      const stored = await TCSQuestionRepository.findByIdForVerify(challenge.questionId);
      if (stored && Array.isArray(stored.options) && typeof stored.correctAnswer === 'number') {
        authoritativeCorrect = String(stored.options[stored.correctAnswer] ?? stored.correctAnswer);
      }
    }

    const isCorrect =
      cleanDrillAnswer(userAnswer, type) === cleanDrillAnswer(authoritativeCorrect, type);

    if (subject && challenge.questionId && userId) {
      void drillPerformanceRepository.createSafe(
        userId,
        challenge.questionId,
        subject,
        isCorrect,
      );
    }

    return { isCorrect, correctAnswer: authoritativeCorrect };
  }

  async getRelatedQuestions(params: {
    category: unknown;
    type: unknown;
    excludeQuestion: unknown;
    excludeIds: unknown;
  }): Promise<Record<string, unknown>[]> {
    const { category, type, excludeQuestion, excludeIds } = params;

    let idsArray: string[] = [];
    if (excludeIds) {
      if (typeof excludeIds === 'string') {
        idsArray = excludeIds.split(',').filter(Boolean);
      } else if (Array.isArray(excludeIds)) {
        idsArray = excludeIds.map((id) => String(id));
      }
    }

    if (type === 'vocab') {
      const filter: Record<string, unknown> = {
        category: category ? String(category) : { $ne: 'Spelling Rules' },
      };

      const andConditions: Record<string, unknown>[] = [];
      if (excludeQuestion) {
        const excludeStr = String(excludeQuestion);
        const matchQuote = excludeStr.match(/"([^"]+)"/);
        const wordToExclude = matchQuote ? matchQuote[1] : excludeStr;
        andConditions.push({ word: { $ne: wordToExclude } });
      }
      if (idsArray.length > 0) {
        const objectIds = idsArray
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (objectIds.length > 0) {
          andConditions.push({ _id: { $nin: objectIds } });
        }
      }
      if (andConditions.length > 0) {
        filter.$and = andConditions;
      }

      const words = await vocabRepository.sampleRelated(filter, 10);

      const formatted: Record<string, unknown>[] = [];
      for (const word of words) {
        const mcq = await buildVocabMcq(word);
        if (!mcq) continue;
        formatted.push({
          _id: mcq._id,
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.isIdiom
            ? `Meaning: ${mcq.revealDefinition}`
            : `Synonyms: ${mcq.revealSynonyms.join(', ') || '—'} | Antonyms: ${mcq.revealAntonyms.join(', ') || '—'}`,
          category: mcq.category,
        });
      }

      return formatted;
    }

    const subject = SUBJECT_MAP[String(type)] || 'GK';

    const questions = await TCSQuestionRepository.getRelatedQuestions({
      subject,
      category: category ? String(category) : null,
      excludeQuestion: excludeQuestion != null ? String(excludeQuestion) : null,
      excludeIds: idsArray,
      limit: 10,
    });

    return questions.map((q) => ({
      _id: q._id ? q._id.toString() : '',
      question: q.question,
      correctAnswer: q.options[q.correctAnswer],
      explanation: q.explanation || '',
      category: q.category,
    }));
  }

  async listWrongLog(userId: string) {
    const rows = await wrongLogRepository.listByUser(userId);
    return rows.map(mapWrongLogRow);
  }

  async upsertWrongLog(userId: string, body: WrongLogUpsertInput) {
    const doc = await wrongLogRepository.upsertWrong(userId, body);
    if (!doc) throw badRequest('question is required.');
    return mapWrongLogRow(doc);
  }

  async migrateWrongLog(userId: string, items: WrongLogUpsertInput[]) {
    const count = await wrongLogRepository.bulkInsert(userId, items);
    const data = await this.listWrongLog(userId);
    return { migrated: count, data };
  }

  async removeWrongLog(userId: string, opts: { id?: string; question?: string }) {
    if (opts.id) {
      const result = await wrongLogRepository.deleteOne(userId, opts.id);
      if (!result.deletedCount) throw notFound('Wrong-log entry not found.');
      return { deleted: true };
    }
    if (opts.question) {
      const result = await wrongLogRepository.deleteByQuestion(userId, opts.question);
      if (!result.deletedCount) throw notFound('Wrong-log entry not found.');
      return { deleted: true };
    }
    throw badRequest('id or question is required.');
  }

  async clearWrongLog(userId: string, type?: string) {
    const result = await wrongLogRepository.clearAll(userId, type || undefined);
    return { deleted: result.deletedCount || 0 };
  }
}

function mapWrongLogRow(row: Record<string, unknown>) {
  return {
    id: String(row._id),
    question: row.question,
    correctAnswer: row.correctAnswer,
    userAnswer: row.userAnswer,
    options: row.options ?? null,
    placeholder: row.placeholder ?? null,
    explanation: row.explanation ?? null,
    category: row.category ?? null,
    type: row.type,
    word: row.word ?? null,
    revealDefinition: row.revealDefinition ?? null,
    revealSynonyms: row.revealSynonyms ?? null,
    revealAntonyms: row.revealAntonyms ?? null,
    pos: row.pos ?? null,
    wrongCount: Number(row.wrongCount) || 1,
    lastWrongAt: row.lastWrongAt instanceof Date
      ? row.lastWrongAt.getTime()
      : new Date(String(row.lastWrongAt || Date.now())).getTime(),
  };
}

export const drillService = new DrillService();
