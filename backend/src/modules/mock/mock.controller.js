import MockTest from './mock-test.model.js';

function examFilter(examId) {
  const id = String(examId || 'ssc').trim() || 'ssc';
  // Legacy rows without examId belong to SSC
  if (id === 'ssc') {
    return {
      $or: [
        { examId: 'ssc' },
        { examId: { $exists: false } },
        { examId: null },
        { examId: '' },
      ],
    };
  }
  return { examId: id };
}

// @desc    Add a new full mock test
// @route   POST /api/mock
export const createMockTest = async (req, res, next) => {
  try {
    const { title, year, date, shift, questions, examId } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      res.status(400);
      throw new Error('Title and a valid questions array are required');
    }

    if (questions.length > 0) {
      const q = questions[0];
      if (!q.section || !q.q || !q.o || typeof q.a !== 'number') {
        res.status(400);
        throw new Error('Questions array format is invalid. Ensure section, q, o, and a are provided.');
      }
    }

    const resolvedExamId = String(examId || 'ssc').trim() || 'ssc';

    const mockTest = new MockTest({
      title,
      examId: resolvedExamId,
      year: year || '',
      date: date || '',
      shift: shift || '',
      questions: questions.map((row) => ({
        section: String(row.section).trim(),
        q: row.q,
        o: Array.isArray(row.o) ? row.o.map((opt) => (typeof opt === 'string' ? opt : String(opt))) : [],
        a: row.a,
        e: row.e || '',
      })),
    });

    const savedTest = await mockTest.save();

    res.status(201).json({
      status: 'success',
      data: {
        id: savedTest._id,
        title: savedTest.title,
        examId: savedTest.examId,
        questionsCount: savedTest.questions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mock tests for an exam (metadata only)
// @route   GET /api/mock?examId=ssc
export const getMockTests = async (req, res, next) => {
  try {
    const examId = req.query.examId || 'ssc';
    const tests = await MockTest.find(examFilter(examId)).sort({ createdAt: -1 });

    const formattedTests = tests.map((t) => ({
      _id: t._id,
      title: t.title,
      examId: t.examId || 'ssc',
      year: t.year,
      date: t.date,
      shift: t.shift,
      createdAt: t.createdAt,
      questionsCount: t.questions ? t.questions.length : 0
    }));

    res.json({
      status: 'success',
      data: formattedTests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific mock test by ID (full data)
// @route   GET /api/mock/:id
export const getMockTestById = async (req, res, next) => {
  try {
    const test = await MockTest.findById(req.params.id);

    if (!test) {
      res.status(404);
      throw new Error('Mock Test not found');
    }

    res.json({
      status: 'success',
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a mock test
// @route   DELETE /api/mock/:id
export const deleteMockTest = async (req, res, next) => {
  try {
    const test = await MockTest.findByIdAndDelete(req.params.id);

    if (!test) {
      res.status(404);
      throw new Error('Mock Test not found');
    }

    res.json({
      status: 'success',
      message: 'Mock test deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
