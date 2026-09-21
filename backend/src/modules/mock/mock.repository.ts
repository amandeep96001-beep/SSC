import MockTest from './mock-test.model.js';
import type { IMockQuestion, IMockTest } from './mock-test.model.js';
import type { HydratedDocument } from 'mongoose';

export type MockTestDoc = HydratedDocument<IMockTest>;

export interface CreateMockTestData {
  title: string;
  examId: string;
  year: string;
  date: string;
  shift: string;
  questions: IMockQuestion[];
}

function examFilter(examId: unknown) {
  const id = String(examId || 'ssc').trim() || 'ssc';
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

class MockRepository {
  async create(data: CreateMockTestData): Promise<MockTestDoc> {
    const mockTest = new MockTest(data);
    return mockTest.save();
  }

  async findByExam(examId: unknown): Promise<MockTestDoc[]> {
    return MockTest.find(examFilter(examId)).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<MockTestDoc | null> {
    return MockTest.findById(id);
  }

  async deleteById(id: string): Promise<MockTestDoc | null> {
    return MockTest.findByIdAndDelete(id);
  }
}

export default new MockRepository();
