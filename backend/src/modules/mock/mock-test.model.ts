import mongoose, { Schema } from 'mongoose';

export interface IMockQuestion {
  section: string;
  q: string;
  o: string[];
  a: number;
  e?: string;
}

export interface IMockTest {
  title: string;
  examId: string;
  year: string;
  date: string;
  shift: string;
  questions: IMockQuestion[];
  createdAt: Date;
}

const MockTestSchema = new Schema<IMockTest>({
  title: { type: String, required: true },
  examId: { type: String, default: 'ssc', index: true },
  year: { type: String, default: '' },
  date: { type: String, default: '' },
  shift: { type: String, default: '' },
  questions: [{
    section: {
      type: String,
      required: true,
      trim: true,
    },
    q: { type: String, required: true },
    o: [{ type: String, required: true }],
    a: { type: Number, required: true },
    e: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const MockTest = mongoose.model<IMockTest>('MockTest', MockTestSchema);

export default MockTest;
