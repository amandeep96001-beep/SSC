import User from './user.model.js';
import MockProgress from './mock-progress.model.js';
import Progress from './progress.model.js';
import { hashPassword, verifyPassword, isLegacyHash } from './password.util.js';
import { signToken } from './token.util.js';

function publicUserPayload(user, progress = [], mockProgress = [], token = null) {
  const payload = {
    username: user.username,
    role: user.role || 'user',
    progress,
    mockProgress
  };
  if (token) payload.token = token;
  return payload;
}

function resolveRole(username, adminCode) {
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const code = process.env.ADMIN_CODE || 'examprep-admin';
  if (String(username).trim().toLowerCase() === adminUser) return 'admin';
  if (adminCode && String(adminCode) === code) return 'admin';
  return 'user';
}

export const register = async (req, res, next) => {
  try {
    const { username, password, adminCode } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required.'
      });
    }

    const trimmedUsername = String(username).trim();

    const existingUser = await User.findOne({ username: trimmedUsername }).lean();
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Username is already taken. Choose another.'
      });
    }

    const hashed = await hashPassword(password);
    const role = resolveRole(trimmedUsername, adminCode);
    const newUser = await User.create({
      username: trimmedUsername,
      password: hashed,
      role
    });

    const token = signToken(newUser);

    res.status(201).json({
      status: 'success',
      data: publicUserPayload(newUser, [], [], token)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required.'
      });
    }

    const trimmedUsername = String(username).trim();
    const user = await User.findOne({ username: trimmedUsername });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    const matched = await verifyPassword(password, user.password);
    if (!matched) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    if (isLegacyHash(user.password)) {
      user.password = await hashPassword(password);
      await user.save();
    }

    let progress = [];
    let mockProgress = [];
    try {
      [mockProgress, progress] = await Promise.all([
        MockProgress.find({ username: user.username }).lean(),
        Progress.find({ username: user.username }).lean()
      ]);
    } catch (progressErr) {
      console.error('[login] Progress load failed:', progressErr.message);
    }

    const token = signToken(user);

    res.json({
      status: 'success',
      data: publicUserPayload(user, progress, mockProgress, token)
    });
  } catch (error) {
    next(error);
  }
};

export const saveProgress = async (req, res, next) => {
  try {
    const { topicId, score, maxScore, elapsedTime } = req.body;
    const username = req.user.username;

    let status = 'red';
    const dynamicMaxScore = maxScore || 50;
    if (score >= (dynamicMaxScore * 0.8)) status = 'green';
    else if (score >= (dynamicMaxScore * 0.4)) status = 'yellow';

    const existingCount = await Progress.countDocuments({ username, topicId });

    await Progress.create({
      username,
      topicId,
      score,
      maxScore: dynamicMaxScore,
      status,
      elapsedTime,
      attemptNumber: existingCount + 1,
      timestamp: new Date()
    });

    const updatedProgress = await Progress.find({ username }).lean();
    res.json({ status: 'success', data: updatedProgress });
  } catch (error) {
    next(error);
  }
};

export const saveMockProgress = async (req, res, next) => {
  try {
    const { mockTestId, title, score, correct, wrong, blank, accuracy, elapsedTime, sectionTimes } = req.body;
    const username = req.user.username;

    const existingCount = await MockProgress.countDocuments({ username, mockTestId });

    await MockProgress.create({
      username,
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

    const updatedMockProgress = await MockProgress.find({ username }).lean();
    res.json({ status: 'success', data: updatedMockProgress });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const username = req.user.username;
    const [progress, mockProgress] = await Promise.all([
      Progress.find({ username }).lean(),
      MockProgress.find({ username }).lean()
    ]);

    res.json({
      status: 'success',
      data: publicUserPayload(
        { username, role: req.user.role || 'user' },
        progress,
        mockProgress
      )
    });
  } catch (error) {
    next(error);
  }
};
