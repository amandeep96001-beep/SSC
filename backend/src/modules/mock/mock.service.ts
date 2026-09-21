import mockRepository from './mock.repository.js';
import type {
  CreateMockTestInput,
  CreateMockTestResult,
  MockQuestionInput,
  MockTestListItem,
} from './mock.interface.js';
import type { IMockQuestion } from './mock.interface.js';
import { badRequest, notFound } from '../../utils/app-errors.js';
import { isRecord } from '../../types/domain.js';

function normalizeQuestions(questions: unknown[]): IMockQuestion[] {
  return questions.map((row) => {
    const item = row as MockQuestionInput;
    return {
      section: String(item.section).trim(),
      q: String(item.q),
      o: Array.isArray(item.o)
        ? item.o.map((opt) => (typeof opt === 'string' ? opt : String(opt)))
        : [],
      a: Number(item.a),
      e: item.e != null ? String(item.e) : '',
    };
  });
}

export class MockService {
  async createMockTest(
    body: CreateMockTestInput,
  ): Promise<{ data: CreateMockTestResult }> {
    const { title, year, date, shift, questions, examId } = body;

    if (!title || !questions || !Array.isArray(questions)) {
      throw badRequest('Title and a valid questions array are required');
    }

    if (questions.length > 0) {
      const q = questions[0];
      if (!isRecord(q) || !q.section || !q.q || !q.o || typeof q.a !== 'number') {
        throw badRequest('Questions array format is invalid. Ensure section, q, o, and a are provided.');
      }
    }

    const resolvedExamId = String(examId || 'ssc').trim() || 'ssc';
    const savedTest = await mockRepository.create({
      title: String(title),
      examId: resolvedExamId,
      year: year != null ? String(year) : '',
      date: date != null ? String(date) : '',
      shift: shift != null ? String(shift) : '',
      questions: normalizeQuestions(questions),
    });

    return {
      data: {
        id: savedTest._id,
        title: savedTest.title,
        examId: savedTest.examId,
        questionsCount: savedTest.questions.length,
      },
    };
  }

  async getMockTests(examId: unknown): Promise<{ data: MockTestListItem[] }> {
    const tests = await mockRepository.findByExam(examId);
    return {
      data: tests.map((t) => ({
        _id: t._id,
        title: t.title,
        examId: t.examId || 'ssc',
        year: t.year,
        date: t.date,
        shift: t.shift,
        createdAt: t.createdAt,
        questionsCount: t.questions ? t.questions.length : 0,
      })),
    };
  }

  async getMockTestById(id: string) {
    const test = await mockRepository.findById(id);
    if (!test) throw notFound('Mock Test not found');
    return { data: test };
  }

  async deleteMockTest(id: string): Promise<{ message: string }> {
    const test = await mockRepository.deleteById(id);
    if (!test) throw notFound('Mock Test not found');
    return { message: 'Mock test deleted successfully' };
  }
}

export const mockService = new MockService();
