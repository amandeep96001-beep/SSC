import type { RequestHandler } from 'express';
import TCSQuestion from '../questions/tcs-question.model.js';
import CompetitionScore from './competition.model.js';

export const getQuestions: RequestHandler = async (req, res, next) => {
  try {
    const { subject = 'Mixed', limit = 10 } = req.query;
    const questionLimit = Math.min(parseInt(String(limit), 10) || 10, 20);

    const matchFilter: { subject?: string } = {};
    if (subject !== 'Mixed') {
      matchFilter.subject = String(subject);
    }

    const questions = await TCSQuestion.aggregate([
      { $match: matchFilter },
      { $sample: { size: questionLimit } },
      {
        $project: {
          question: 1,
          options: 1,
          correctAnswer: 1,
          subject: 1,
          category: 1,
          explanation: 1
        }
      }
    ]);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No questions found for subject: ${subject}. Please seed the database first.`
      });
    }

    res.json({
      status: 'success',
      data: questions,
      meta: { total: questions.length, subject }
    });
  } catch (error) {
    next(error);
  }
};

export const submitScore: RequestHandler = async (req, res, next) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    const { subject, score, correct, wrong, skipped, accuracy, timeTaken } = req.body;

    if (score === undefined || correct === undefined || wrong === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'score, correct, and wrong are required fields.'
      });
    }

    const resolvedSubject = String(subject || 'Mixed').slice(0, 32);
    const scoreN = Math.min(20, Math.max(0, Number(score) || 0));
    const correctN = Math.min(20, Math.max(0, Number(correct) || 0));
    const wrongN = Math.min(20, Math.max(0, Number(wrong) || 0));
    const skippedN = Math.min(20, Math.max(0, Number(skipped) || 0));
    const accuracyN = Math.min(100, Math.max(0, parseFloat(accuracy) || 0));
    const timeTakenN = Math.min(3600, Math.max(0, Number(timeTaken) || 0));

    const newScore = await CompetitionScore.create({
      username,
      subject: resolvedSubject,
      score: scoreN,
      correct: correctN,
      wrong: wrongN,
      skipped: skippedN,
      accuracy: accuracyN,
      timeTaken: timeTakenN
    });

    const personalBest = await CompetitionScore.findOne(
      { username, subject: resolvedSubject },
      null,
      { sort: { score: -1, timeTaken: 1 } }
    ).lean();

    const betterScores = await CompetitionScore.countDocuments({
      subject: resolvedSubject,
      $or: [
        { score: { $gt: scoreN } },
        { score: scoreN, timeTaken: { $lt: timeTakenN } }
      ]
    });

    res.json({
      status: 'success',
      data: {
        savedScore: newScore,
        personalBest,
        rank: betterScores + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard: RequestHandler = async (req, res, next) => {
  try {
    const { subject = 'Mixed' } = req.query;

    const leaderboard = await CompetitionScore.aggregate([
      { $match: { subject: String(subject) } },
      { $sort: { score: -1, timeTaken: 1 } },
      {
        $group: {
          _id: '$username',
          bestScore: { $first: '$score' },
          bestAccuracy: { $first: '$accuracy' },
          bestTimeTaken: { $first: '$timeTaken' },
          correct: { $first: '$correct' },
          wrong: { $first: '$wrong' },
          timestamp: { $first: '$timestamp' }
        }
      },
      { $sort: { bestScore: -1, bestTimeTaken: 1 } },
      { $limit: 10 },
      {
        $project: {
          username: '$_id',
          bestScore: 1,
          bestAccuracy: 1,
          bestTimeTaken: 1,
          correct: 1,
          wrong: 1,
          timestamp: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      status: 'success',
      data: leaderboard,
      meta: { subject, total: leaderboard.length }
    });
  } catch (error) {
    next(error);
  }
};
