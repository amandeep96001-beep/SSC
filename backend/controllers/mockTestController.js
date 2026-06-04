import MockTest from '../models/mockTestModel.js';

// @desc    Add a new full mock test
// @route   POST /api/mock
// @access  Public
export const createMockTest = async (req, res, next) => {
  try {
    const { title, year, date, shift, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      res.status(400);
      throw new Error('Title and a valid questions array are required');
    }

    // Validate structure of at least the first question
    if (questions.length > 0) {
      const q = questions[0];
      if (!q.section || !q.q || !q.o || typeof q.a !== 'number') {
        res.status(400);
        throw new Error('Questions array format is invalid. Ensure section, q, o, and a are provided.');
      }
    }

    const mockTest = new MockTest({
      title,
      year: year || '',
      date: date || '',
      shift: shift || '',
      questions
    });

    const savedTest = await mockTest.save();

    res.status(201).json({
      success: true,
      data: {
        id: savedTest._id,
        title: savedTest.title,
        questionsCount: savedTest.questions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all mock tests (metadata only)
// @route   GET /api/mock
// @access  Public
export const getMockTests = async (req, res, next) => {
  try {
    const tests = await MockTest.find({}).sort({ createdAt: -1 });

    const formattedTests = tests.map(t => ({
      _id: t._id,
      title: t.title,
      year: t.year,
      date: t.date,
      shift: t.shift,
      createdAt: t.createdAt,
      questionsCount: t.questions ? t.questions.length : 0
    }));

    res.json({
      success: true,
      data: formattedTests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific mock test by ID (full data)
// @route   GET /api/mock/:id
// @access  Public
export const getMockTestById = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id);

    if (!test) {
      res.status(404);
      throw new Error('Mock Test not found');
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a mock test
// @route   DELETE /api/mock/:id
// @access  Public
export const deleteMockTest = async (req, res, next) => {
  try {
    const test = await MockTest.findByIdAndDelete(req.params.id);

    if (!test) {
      res.status(404);
      throw new Error('Mock Test not found');
    }

    res.json({
      success: true,
      message: 'Mock test deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
