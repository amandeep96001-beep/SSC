import express from 'express';
import User, { hashPassword } from '../models/userModel.js';
import MockProgress from '../models/mockProgressModel.js';

const router = express.Router();

/**
 * @desc    Register a new candidate
 * @route   POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required fields.'
      });
    }

    const trimmedUsername = username.trim();
    const existingUser = await User.findOne({ username: trimmedUsername }).lean();
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username is already taken, choose another.'
      });
    }

    const newUser = new User({
      username: trimmedUsername,
      password: hashPassword(password),
      progress: []
    });

    await newUser.save();

    res.status(201).json({
      status: 'success',
      data: {
        username: newUser.username,
        progress: [],
        mockProgress: []
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Login credentials check
 * @route   POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required.'
      });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username credentials.'
      });
    }

    const matched = user.password === hashPassword(password);
    if (!matched) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password credentials.'
      });
    }

    const mockProgress = await MockProgress.find({ username: user.username }).lean() || [];

    res.json({
      status: 'success',
      data: {
        username: user.username,
        progress: user.progress,
        mockProgress: mockProgress
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update progress metrics for a topic
 * @route   POST /api/auth/progress
 */
router.post('/progress', async (req, res, next) => {
  try {
    const { username, topicId, score, maxScore, elapsedTime } = req.body;
    if (!username || !topicId || score === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, topicId, and score are required.'
      });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    // Determine performance color status
    let status = 'red';
    const dynamicMaxScore = maxScore || 50;
    if (score >= (dynamicMaxScore * 0.8)) {
      status = 'green';
    } else if (score >= (dynamicMaxScore * 0.4)) {
      status = 'yellow';
    }

    const existingCount = user.progress.filter(p => p.topicId === topicId).length;
    user.progress.push({
      topicId,
      score,
      maxScore: dynamicMaxScore,
      status,
      elapsedTime,
      attemptNumber: existingCount + 1,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      status: 'success',
      data: user.progress
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update progress metrics for a full mock test
 * @route   POST /api/auth/mock-progress
 */
router.post('/mock-progress', async (req, res, next) => {
  try {
    const { username, mockTestId, title, score, correct, wrong, blank, accuracy, elapsedTime, sectionTimes } = req.body;
    if (!username || !mockTestId || !title || score === undefined || correct === undefined || wrong === undefined || blank === undefined || accuracy === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'All parameters (username, mockTestId, title, score, correct, wrong, blank, accuracy) are required.'
      });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    const existingCount = await MockProgress.countDocuments({ username: user.username, mockTestId });
    
    await MockProgress.create({
      username: user.username,
      mockTestId,
      title,
      score,
      correct,
      wrong,
      blank,
      accuracy,
      elapsedTime,
      sectionTimes,
      attemptNumber: existingCount + 1,
      timestamp: new Date()
    });

    const updatedMockProgress = await MockProgress.find({ username: user.username }).lean();

    res.json({
      status: 'success',
      data: updatedMockProgress
    });
  } catch (error) {
    next(error);
  }
});

export default router;
