import express from 'express';
import TCSQuestion from '../models/tcsQuestionModel.js';
import CompetitionScore from '../models/competitionModel.js';

const router = express.Router();

/**
 * @desc    Fetch random MCQ questions for a competition round
 * @route   GET /api/competition/questions?subject=Mixed&limit=10
 */
router.get('/questions', async (req, res, next) => {
  try {
    const { subject = 'Mixed', limit = 10 } = req.query;
    const questionLimit = Math.min(parseInt(limit) || 10, 20); // max 20 questions

    let matchFilter = {};
    if (subject !== 'Mixed') {
      matchFilter.subject = subject;
    }

    // Use MongoDB aggregation $sample for true random selection
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
});

/**
 * @desc    Submit a completed competition round score
 * @route   POST /api/competition/submit
 */
router.post('/submit', async (req, res, next) => {
  try {
    const { username, subject, score, correct, wrong, skipped, accuracy, timeTaken } = req.body;

    if (!username || score === undefined || correct === undefined || wrong === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'username, score, correct, wrong are required fields.'
      });
    }

    const newScore = await CompetitionScore.create({
      username: username.trim(),
      subject: subject || 'Mixed',
      score,
      correct,
      wrong,
      skipped: skipped || 0,
      accuracy: parseFloat(accuracy) || 0,
      timeTaken: timeTaken || 0
    });

    // Fetch user's personal best for this subject
    const personalBest = await CompetitionScore.findOne(
      { username: username.trim(), subject: subject || 'Mixed' },
      null,
      { sort: { score: -1, timeTaken: 1 } }
    ).lean();

    // Compute user's rank on leaderboard for this subject
    const betterScores = await CompetitionScore.countDocuments({
      subject: subject || 'Mixed',
      $or: [
        { score: { $gt: score } },
        { score: score, timeTaken: { $lt: timeTaken } }
      ]
    });
    const userRank = betterScores + 1;

    res.json({
      status: 'success',
      data: {
        savedScore: newScore,
        personalBest: personalBest,
        rank: userRank
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Fetch top 10 leaderboard for a subject
 * @route   GET /api/competition/leaderboard?subject=Mixed
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { subject = 'Mixed' } = req.query;

    // Get best score per user (group by username, pick max score then min timeTaken)
    const leaderboard = await CompetitionScore.aggregate([
      { $match: { subject } },
      {
        $sort: { score: -1, timeTaken: 1 } // best score first, fastest time as tiebreaker
      },
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
});

export default router;
