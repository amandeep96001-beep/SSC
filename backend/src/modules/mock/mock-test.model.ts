import mongoose, { Schema } from 'mongoose';
import type { IMockQuestion, IMockTest } from './mock.interface.js';

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
