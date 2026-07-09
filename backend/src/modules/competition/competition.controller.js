import TCSQuestion from '../questions/tcs-question.model.js';
import CompetitionScore from './competition.model.js';

export const getQuestions = async (req, res, next) => {
  try {
    const { subject = 'Mixed', limit = 10 } = req.query;
    const questionLimit = Math.min(parseInt(limit) || 10, 20);

    const matchFilter = {};
    if (subject !== 'Mixed') {
      matchFilter.subject = subject;
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

export const submitScore = async (req, res, next) => {
  try {
    const { username, subject, score, correct, wrong, skipped, accuracy, timeTaken } = req.body;

    if (!username || score === undefined || correct === undefined || wrong === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'username, score, correct, wrong are required fields.'
      });
    }

    const resolvedSubject = subject || 'Mixed';

    const newScore = await CompetitionScore.create({
      username: username.trim(),
      subject: resolvedSubject,
      score,
      correct,
      wrong,
      skipped: skipped || 0,
      accuracy: parseFloat(accuracy) || 0,
      timeTaken: timeTaken || 0
    });

    const personalBest = await CompetitionScore.findOne(
      { username: username.trim(), subject: resolvedSubject },
      null,
      { sort: { score: -1, timeTaken: 1 } }
    ).lean();

    const betterScores = await CompetitionScore.countDocuments({
      subject: resolvedSubject,
      $or: [
        { score: { $gt: score } },
        { score, timeTaken: { $lt: timeTaken } }
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

export const getLeaderboard = async (req, res, next) => {
  try {
    const { subject = 'Mixed' } = req.query;

    const leaderboard = await CompetitionScore.aggregate([
      { $match: { subject } },
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
