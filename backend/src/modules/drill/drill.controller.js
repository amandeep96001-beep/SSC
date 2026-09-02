import mongoose from 'mongoose';
import vocabRepository from '../study/vocab.repository.js';
import TCSQuestionRepository from '../questions/tcs-question.repository.js';
import DrillPerformance from './drill-performance.model.js';
import { Vocab } from '../study/vocab.model.js';
import { shuffle as shuffleArray } from '../../shared/utils/shuffle.js';

// Subject map for MCQ drill types
const SUBJECT_MAP = {
  'gk':            'GK',
  'english-mcq':   'English',
  'maths-mcq':     'Maths',
  'reasoning-mcq': 'Reasoning',
};

/** Fire-and-forget: save a DrillPerformance record, never throws. */
async function recordPerformance(userId, questionId, subject, correct) {
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

export const getNextDrill = async (req, res, next) => {
  try {
    const type    = req.query.type || 'table';
    const userId  = req.user?._id ?? null;

    let drillData = {};

    switch (type) {
      case 'table': {
        const maxBase = Math.max(12, parseInt(req.query.maxBase, 10) || 20);
        let tableBase;
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
        const maxBase = Math.max(2, parseInt(req.query.maxBase, 10) || 30);
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
        const maxBase = Math.max(2, parseInt(req.query.maxBase, 10) || 20);
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

        let question, correctAnswer, wrongPool;

        if (isIdiom) {
          question = `What is the meaning of the idiom: "${wordData.word}"?`;
          correctAnswer = wordData.definition;
          wrongPool = [
            ...(wordData.synonyms || []).slice(0, 2),
            ...(wordData.antonyms || []).slice(0, 2),
          ];
        } else {
          const hasSynonyms = wordData.synonyms && wordData.synonyms.length > 0;
          const hasAntonyms = wordData.antonyms && wordData.antonyms.length > 0;

          const types = ['meaning'];
          if (hasSynonyms) types.push('synonym');
          if (hasAntonyms) types.push('antonym');

          const qType = types[Math.floor(Math.random() * types.length)];

          if (qType === 'synonym') {
            question = `What is the SYNONYM of "${wordData.word}"?`;
            correctAnswer = wordData.synonyms[Math.floor(Math.random() * wordData.synonyms.length)];
            wrongPool = [
              ...(wordData.antonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.synonyms.includes(w) && w !== correctAnswer);
          } else if (qType === 'antonym') {
            question = `What is the ANTONYM of "${wordData.word}"?`;
            correctAnswer = wordData.antonyms[Math.floor(Math.random() * wordData.antonyms.length)];
            wrongPool = [
              ...(wordData.synonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.antonyms.includes(w) && w !== correctAnswer);
          } else {
            question = `What is the meaning of "${wordData.word}"?`;
            correctAnswer = (wordData.synonyms || [])[0] || wordData.definition;
            wrongPool = [
              ...(wordData.antonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !(wordData.synonyms || []).includes(w) && w !== wordData.definition && w !== correctAnswer);
          }
        }

        wrongPool = wrongPool.filter(w => w !== correctAnswer && w != null);
        const shuffledWrong = shuffleArray(wrongPool).slice(0, 3);

        while (shuffledWrong.length < 3) {
          shuffledWrong.push(`None of these ${shuffledWrong.length + 1}`);
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
        const tcsQ = await TCSQuestionRepository.getWeightedQuestion(subject, userId);

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

export const verifyDrill = async (req, res, next) => {
  try {
    const { type, question, userAnswer, correctAnswer, questionId } = req.body;
    const userId = req.user?._id ?? null;

    if (userAnswer === undefined || correctAnswer === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer variables.'
      });
    }

    const cleanUser    = userAnswer.toString().trim().toLowerCase().replace('%', '');
    const cleanCorrect = correctAnswer.toString().trim().toLowerCase().replace('%', '');

    const isCorrect = cleanUser === cleanCorrect;

    // ── RECORD PERFORMANCE (for MCQ types only) ────────────────────────────
    const subject = SUBJECT_MAP[type];
    if (subject && questionId && userId) {
      // Non-blocking fire-and-forget
      recordPerformance(userId, questionId, subject, isCorrect);
    }

    res.json({
      status: 'success',
      data: { isCorrect, correctAnswer }
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedQuestions = async (req, res, next) => {
  try {
    const { category, type, excludeQuestion, excludeIds } = req.query;

    let idsArray = [];
    if (excludeIds) {
      if (typeof excludeIds === 'string') {
        idsArray = excludeIds.split(',').filter(Boolean);
      } else if (Array.isArray(excludeIds)) {
        idsArray = excludeIds;
      }
    }

    if (type === 'vocab') {
      const filter = {};
      if (category) filter.category = category;

      const andConditions = [];
      if (excludeQuestion) {
        const matchQuote = excludeQuestion.match(/"([^"]+)"/);
        const wordToExclude = matchQuote ? matchQuote[1] : excludeQuestion;
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

      const words = await Vocab.aggregate([
        { $match: filter },
        { $sample: { size: 10 } }
      ]);

      const formatted = words.map(w => {
        const isIdiom = w.category === 'Idioms & Phrases';
        const questionText = isIdiom
          ? `What is the meaning of the idiom: "${w.word}"?`
          : `What is the meaning of "${w.word}"?`;

        return {
          _id: w._id ? w._id.toString() : '',
          question: questionText,
          correctAnswer: w.definition,
          explanation: `Synonyms: ${w.synonyms?.join(', ') || 'None'} | Antonyms: ${w.antonyms?.join(', ') || 'None'}`,
          category: w.category
        };
      });

      return res.json({ status: 'success', data: formatted });
    }

    const subjectMap = {
      'gk':            'GK',
      'english-mcq':   'English',
      'maths-mcq':     'Maths',
      'reasoning-mcq': 'Reasoning'
    };
    const subject = subjectMap[type] || 'GK';

    const questions = await TCSQuestionRepository.getRelatedQuestions({
      subject,
      category: category || null,
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
