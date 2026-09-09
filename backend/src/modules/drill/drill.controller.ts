import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import vocabRepository from '../study/vocab.repository.js';
import TCSQuestionRepository from '../questions/tcs-question.repository.js';
import TCSQuestion from '../questions/tcs-question.model.js';
import DrillPerformance from './drill-performance.model.js';
import { Vocab } from '../study/vocab.model.js';
import type { IVocab } from '../study/vocab.model.js';
import {
  acceptedVocabAnswers,
  answersMatch,
  buildVocabMcq,
  extractQuoted,
  getRandomVocabMcq,
  inferVocabPromptKind,
  type VocabLean,
} from '../study/vocab.mcq.js';

// Subject map for MCQ drill types
const SUBJECT_MAP: Record<string, string> = {
  'gk':            'GK',
  'english-mcq':   'English',
  'maths-mcq':     'Maths',
  'reasoning-mcq': 'Reasoning',
};

/** Fire-and-forget: save a DrillPerformance record, never throws. */
async function recordPerformance(
  userId: unknown,
  questionId: unknown,
  subject: string,
  correct: boolean,
) {
  if (!userId || !questionId) return;
  try {
    await DrillPerformance.create({
      userId:     new mongoose.Types.ObjectId(String(userId)),
      questionId: new mongoose.Types.ObjectId(String(questionId)),
      subject,
      correct,
      seenAt: new Date(),
    });
  } catch {
    // Non-critical — silently ignore write errors
  }
}

export const getNextDrill: RequestHandler = async (req, res, next) => {
  try {
    const type    = String(req.query.type || 'table');
    const userId  = (req.user as { _id?: unknown } | undefined)?._id ?? null;

    let drillData: Record<string, unknown> = {};

    switch (type) {
      case 'table': {
        const maxBase = Math.max(12, parseInt(String(req.query.maxBase ?? ''), 10) || 20);
        let tableBase: number;
        do {
          tableBase = Math.floor(Math.random() * (maxBase - 12 + 1)) + 12;
        } while (tableBase % 10 === 0);

        const multiplier = Math.floor(Math.random() * 8) + 2;
        const answer = (tableBase * multiplier).toString();

        drillData = {
          type,
          question: `${tableBase} × ${multiplier}`,
          correctAnswer: answer,
          placeholder: 'Enter calculations result...'
        };
        break;
      }

      case 'fraction': {
        const conversion = await vocabRepository.getRandomConversion();
        drillData = {
          type,
          question: `Convert fraction: ${conversion.fraction}`,
          correctAnswer: conversion.percentage,
          placeholder: 'e.g. 12.5%'
        };
        break;
      }

      case 'percentage': {
        const conversion = await vocabRepository.getRandomConversion();
        drillData = {
          type,
          question: `Convert percentage: ${conversion.percentage}`,
          correctAnswer: conversion.fraction,
          placeholder: 'e.g. 1/8'
        };
        break;
      }

      case 'square': {
        const maxBase = Math.max(2, parseInt(String(req.query.maxBase ?? ''), 10) || 30);
        const num = Math.floor(Math.random() * maxBase) + 1;
        drillData = {
          type,
          question: `What is the square of ${num}? (${num}²)`,
          correctAnswer: (num * num).toString(),
          placeholder: 'Enter square...'
        };
        break;
      }

      case 'cube': {
        const maxBase = Math.max(2, parseInt(String(req.query.maxBase ?? ''), 10) || 20);
        const num = Math.floor(Math.random() * maxBase) + 1;
        drillData = {
          type,
          question: `What is the cube of ${num}? (${num}³)`,
          correctAnswer: (num * num * num).toString(),
          placeholder: 'Enter cube...'
        };
        break;
      }

      case 'vocab': {
        const mcq = await getRandomVocabMcq();
        if (!mcq) {
          return res.status(404).json({
            status: 'error',
            message: 'No vocabulary questions are available yet.',
          });
        }
        drillData = { type, ...mcq };
        break;
      }

      case 'gk':
      case 'english-mcq':
      case 'maths-mcq':
      case 'reasoning-mcq': {
        const subject = SUBJECT_MAP[type];

        // ── WEIGHTED SELECTION ──────────────────────────────────────────────
        const tcsQ = await TCSQuestionRepository.getWeightedQuestion(subject, userId as string | null);

        if (!tcsQ) {
          return res.status(404).json({
            status: 'error',
            message: `No ${subject} questions found in database.`
          });
        }

        drillData = {
          type,
          _id: tcsQ._id?.toString() || null,  // expose for perf recording on verify
          question: tcsQ.question,
          options: tcsQ.options,
          correctAnswer: tcsQ.options[tcsQ.correctAnswer],
          explanation: tcsQ.explanation,
          category: tcsQ.category,
          subject,
          year: tcsQ.year,
          isImportant: tcsQ.isImportant || false
        };
        break;
      }

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown drill type: ${type}.`
        });
    }

    res.json({ status: 'success', data: drillData });
  } catch (error) {
    next(error);
  }
};

function cleanDrillAnswer(value: unknown, type: string): string {
  let text = String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (type === 'fraction' || type === 'percentage') {
    text = text.replace(/%/g, '');
  }
  return text;
}

export const verifyDrill: RequestHandler = async (req, res, next) => {
  try {
    const { type, userAnswer, correctAnswer, questionId, question } = req.body;
    const userId = req.user?.id ?? null;

    if (userAnswer === undefined || (correctAnswer === undefined && !questionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer.',
      });
    }

    if (type === 'vocab') {
      let doc: IVocab | null = null;
      if (questionId && mongoose.isValidObjectId(String(questionId))) {
        doc = await Vocab.findById(questionId).lean();
      }
      if (!doc) {
        const quoted = extractQuoted(String(question || ''));
        if (quoted) {
          doc = await Vocab.findOne({
            word: new RegExp(`^${quoted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          }).lean();
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

      return res.json({
        status: 'success',
        data: { isCorrect, correctAnswer: authoritativeCorrect }
      });
    }

    let authoritativeCorrect = correctAnswer;
    const subject = SUBJECT_MAP[String(type)];
    if (subject && questionId && mongoose.isValidObjectId(String(questionId))) {
      const stored = await TCSQuestion.findById(questionId).select('options correctAnswer').lean();
      if (stored && Array.isArray(stored.options) && typeof stored.correctAnswer === 'number') {
        authoritativeCorrect = stored.options[stored.correctAnswer] ?? stored.correctAnswer;
      }
    }

    if (authoritativeCorrect === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer.',
      });
    }

    const isCorrect = cleanDrillAnswer(userAnswer, String(type))
      === cleanDrillAnswer(authoritativeCorrect, String(type));

    if (subject && questionId && userId) {
      recordPerformance(userId, questionId, subject, isCorrect);
    }

    res.json({
      status: 'success',
      data: { isCorrect, correctAnswer: authoritativeCorrect }
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedQuestions: RequestHandler = async (req, res, next) => {
  try {
    const { category, type, excludeQuestion, excludeIds } = req.query;

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
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (objectIds.length > 0) {
          andConditions.push({ _id: { $nin: objectIds } });
        }
      }
      if (andConditions.length > 0) {
        filter.$and = andConditions;
      }

      const words = await Vocab.aggregate<VocabLean>([
        { $match: filter },
        { $sample: { size: 10 } }
      ]);

      const formatted = [];
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

      return res.json({ status: 'success', data: formatted });
    }

    const subjectMap: Record<string, string> = {
      'gk':            'GK',
      'english-mcq':   'English',
      'maths-mcq':     'Maths',
      'reasoning-mcq': 'Reasoning'
    };
    const subject = subjectMap[String(type)] || 'GK';

    const questions = await TCSQuestionRepository.getRelatedQuestions({
      subject,
      category: category ? String(category) : null,
      excludeQuestion: excludeQuestion || null,
      excludeIds: idsArray,
      limit: 10
    });

    const formatted = questions.map(q => ({
      _id: q._id ? q._id.toString() : '',
      question: q.question,
      correctAnswer: q.options[q.correctAnswer],
      explanation: q.explanation || '',
      category: q.category
    }));

    res.json({ status: 'success', data: formatted });
  } catch (error) {
    next(error);
  }
};
