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

export class DrillService {
  async getNextDrill(params: {
    type: string;
    maxBase?: unknown;
    userId: unknown;
  }): Promise<Record<string, unknown>> {
    const { type, maxBase, userId } = params;

    switch (type) {
      case 'table': {
        // Always 12–max (never push tables 1–11)
        const max = Math.min(50, Math.max(12, parseInt(String(maxBase ?? ''), 10) || 20));
        let tableBase: number;
        do {
          tableBase = Math.floor(Math.random() * (max - 12 + 1)) + 12;
        } while (tableBase % 10 === 0 && max > 12);

        const multiplier = Math.floor(Math.random() * 8) + 2; // ×2–×9
        return {
          type,
          question: `${tableBase} × ${multiplier}`,
          correctAnswer: (tableBase * multiplier).toString(),
          placeholder: 'Enter calculations result...',
        };
      }

      case 'fraction': {
        const conversion = await vocabRepository.getRandomConversion();
        return {
          type,
          question: `Convert fraction: ${conversion.fraction}`,
          correctAnswer: conversion.percentage,
          placeholder: 'e.g. 12.5%',
        };
      }

      case 'percentage': {
        const conversion = await vocabRepository.getRandomConversion();
        return {
          type,
          question: `Convert percentage: ${conversion.percentage}`,
          correctAnswer: conversion.fraction,
          placeholder: 'e.g. 1/8',
        };
      }

      case 'square': {
        const max = Math.max(2, parseInt(String(maxBase ?? ''), 10) || 30);
        const num = Math.floor(Math.random() * max) + 1;
        return {
          type,
          question: `What is the square of ${num}? (${num}²)`,
          correctAnswer: (num * num).toString(),
          placeholder: 'Enter square...',
        };
      }

      case 'cube': {
        const max = Math.max(2, parseInt(String(maxBase ?? ''), 10) || 20);
        const num = Math.floor(Math.random() * max) + 1;
        return {
          type,
          question: `What is the cube of ${num}? (${num}³)`,
          correctAnswer: (num * num * num).toString(),
          placeholder: 'Enter cube...',
        };
      }

      case 'vocab': {
        const mcq = await getRandomVocabMcq();
        if (!mcq) {
          throw notFound('No vocabulary questions are available yet.');
        }
        return { type, ...mcq };
      }

      case 'gk':
      case 'english-mcq':
      case 'maths-mcq':
      case 'reasoning-mcq': {
        const subject = SUBJECT_MAP[type];
        const tcsQ = await TCSQuestionRepository.getWeightedQuestion(subject, userId as string | null);

        if (!tcsQ) {
          throw notFound(`No ${subject} questions found in database.`);
        }

        return {
          type,
          _id: tcsQ._id?.toString() || null,
          question: tcsQ.question,
          options: tcsQ.options,
          correctAnswer: tcsQ.options[tcsQ.correctAnswer],
          explanation: tcsQ.explanation,
          category: tcsQ.category,
          subject,
          year: tcsQ.year,
          isImportant: tcsQ.isImportant || false,
        };
      }

      default:
        throw badRequest(`Unknown drill type: ${type}.`);
    }
  }

  async verifyDrill(params: {
    type: unknown;
    userAnswer: unknown;
    correctAnswer: unknown;
    questionId: unknown;
    question: unknown;
    userId: unknown;
  }): Promise<{ isCorrect: boolean; correctAnswer: unknown }> {
    const { type, userAnswer, correctAnswer, questionId, question, userId } = params;

    if (userAnswer === undefined || (correctAnswer === undefined && !questionId)) {
      throw badRequest('Please provide userAnswer and correctAnswer.');
    }

    if (type === 'vocab') {
      let doc: VocabLean | null = null;
      if (questionId && mongoose.isValidObjectId(String(questionId))) {
        doc = await vocabRepository.findByIdLean(String(questionId));
      }
      if (!doc) {
        const quoted = extractQuoted(String(question || ''));
        if (quoted) {
          doc = await vocabRepository.findByWordCaseInsensitive(quoted);
        }
      }

      const kind = inferVocabPromptKind(String(question || ''), doc?.category, doc?.pos);
      const accepted = [
        ...(doc ? acceptedVocabAnswers(doc, kind) : []),
        correctAnswer,
      ].filter(Boolean);

      const isCorrect = accepted.some((answer) => answersMatch(answer, userAnswer));
      const shownCorrect = accepted.find((answer) => answersMatch(answer, correctAnswer));
      const authoritativeCorrect = shownCorrect || accepted[0] || correctAnswer;

      return { isCorrect, correctAnswer: authoritativeCorrect };
    }

    let authoritativeCorrect = correctAnswer;
    const subject = SUBJECT_MAP[String(type)];
    if (subject && questionId && mongoose.isValidObjectId(String(questionId))) {
      const stored = await TCSQuestionRepository.findByIdForVerify(String(questionId));
      if (stored && Array.isArray(stored.options) && typeof stored.correctAnswer === 'number') {
        authoritativeCorrect = stored.options[stored.correctAnswer] ?? stored.correctAnswer;
      }
    }

    if (authoritativeCorrect === undefined) {
      throw badRequest('Please provide userAnswer and correctAnswer.');
    }

    const isCorrect =
      cleanDrillAnswer(userAnswer, String(type)) ===
      cleanDrillAnswer(authoritativeCorrect, String(type));

    if (subject && questionId && userId) {
      void drillPerformanceRepository.createSafe(
        String(userId),
        String(questionId),
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
}

export const drillService = new DrillService();
