import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import vocabRepository from '../study/vocab.repository.js';
import TCSQuestionRepository from '../questions/tcs-question.repository.js';
import TCSQuestion from '../questions/tcs-question.model.js';
import DrillPerformance from './drill-performance.model.js';
import { Vocab } from '../study/vocab.model.js';
import type { IVocab } from '../study/vocab.model.js';
import { shuffle as shuffleArray } from '../../shared/utils/shuffle.js';

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
        const wordData = await vocabRepository.getRandomWord();
        const isIdiom = wordData.category === 'Idioms & Phrases';

        let question: string;
        let correctAnswer: string;
        let wrongPool: string[];

        if (isIdiom) {
          question = `Select the most appropriate meaning of the idiom: "${wordData.word}"`;
          correctAnswer = wordData.definition;
          wrongPool = [...(wordData.options || [])];
        } else if (wordData.category === 'One Word Substitution') {
          question = `Choose the one word which can be substituted for: "${wordData.definition}"`;
          correctAnswer = wordData.word;
          wrongPool = [...(wordData.options || [])];
        } else {
          const hasSynonyms = wordData.synonyms && wordData.synonyms.length > 0;
          const hasAntonyms = wordData.antonyms && wordData.antonyms.length > 0;

          const types = ['meaning'];
          if (hasSynonyms) types.push('synonym');
          if (hasAntonyms) types.push('antonym');

          const qType = types[Math.floor(Math.random() * types.length)];

          if (qType === 'synonym') {
            question = `Select the most appropriate SYNONYM of "${wordData.word}"`;
            correctAnswer = wordData.synonyms![Math.floor(Math.random() * wordData.synonyms!.length)];
            wrongPool = [
              ...(wordData.antonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.synonyms!.includes(w) && w !== correctAnswer);
          } else if (qType === 'antonym') {
            question = `Select the most appropriate ANTONYM of "${wordData.word}"`;
            correctAnswer = wordData.antonyms![Math.floor(Math.random() * wordData.antonyms!.length)];
            wrongPool = [
              ...(wordData.synonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.antonyms!.includes(w) && w !== correctAnswer);
          } else {
            question = `Select the most appropriate meaning of "${wordData.word}"`;
            correctAnswer = wordData.definition || (wordData.synonyms || [])[0];
            wrongPool = [
              ...(wordData.options || []),
              ...(wordData.antonyms || []),
            ];
            wrongPool = wrongPool.filter(w => !(wordData.synonyms || []).includes(w) && w !== wordData.definition && w !== correctAnswer);
          }
        }

        const correctKey = String(correctAnswer || '').trim().toLowerCase();
        wrongPool = wrongPool
          .map((w) => String(w || '').trim())
          .filter((w) => w && w.toLowerCase() !== correctKey);
        const shuffledWrong = shuffleArray([...new Set(wrongPool)]).slice(0, 3);

        while (shuffledWrong.length < 3) {
          const filler = ['To remain idle', 'A sudden misfortune', 'Without any delay', 'In complete agreement'][shuffledWrong.length];
          if (filler && filler.toLowerCase() !== correctKey && !shuffledWrong.includes(filler)) {
            shuffledWrong.push(filler);
          } else {
            break;
          }
        }

        const optionsList = shuffleArray([correctAnswer, ...shuffledWrong]);

        drillData = {
          type,
          question,
          isIdiom,
          word: wordData.word,
          revealDefinition: wordData.definition,
          revealSynonyms: wordData.synonyms,
          revealAntonyms: wordData.antonyms,
          pos: wordData.pos,
          category: wordData.category,
          options: optionsList,
          correctAnswer
        };
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

export const verifyDrill: RequestHandler = async (req, res, next) => {
  try {
    const { type, userAnswer, correctAnswer, questionId } = req.body;
    const userId = req.user?.id ?? null;

    if (userAnswer === undefined || (correctAnswer === undefined && !questionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer.',
      });
    }

    let authoritativeCorrect = correctAnswer;
    if (questionId && mongoose.isValidObjectId(String(questionId))) {
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

    const cleanUser    = userAnswer.toString().trim().toLowerCase().replace('%', '');
    const cleanCorrect = authoritativeCorrect.toString().trim().toLowerCase().replace('%', '');

    const isCorrect = cleanUser === cleanCorrect;

    const subject = SUBJECT_MAP[type];
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
      const filter: Record<string, unknown> = {};
      if (category) filter.category = String(category);

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

      const words = await Vocab.aggregate<IVocab & { _id?: unknown }>([
        { $match: filter },
        { $sample: { size: 10 } }
      ]);

      const formatted = words.map(w => {
        const isIdiom = w.category === 'Idioms & Phrases';
        const isOws = w.category === 'One Word Substitution';
        const questionText = isIdiom
          ? `Select the most appropriate meaning of the idiom: "${w.word}"`
          : isOws
            ? `Choose the one word which can be substituted for: "${w.definition}"`
            : `Select the most appropriate meaning of "${w.word}"`;
        const correctAnswer = isOws ? w.word : w.definition;

        return {
          _id: w._id ? w._id.toString() : '',
          question: questionText,
          correctAnswer,
          explanation: isIdiom
            ? `Meaning: ${w.definition}`
            : `Synonyms: ${w.synonyms?.join(', ') || '—'} | Antonyms: ${w.antonyms?.join(', ') || '—'}`,
          category: w.category
        };
      });

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
