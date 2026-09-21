import mongoose, { Schema } from 'mongoose';
import type { IExamConfig } from './exam-config.interface.js';

const ExamConfigSchema = new Schema<IExamConfig>(
  {
    examId: { type: String, required: true, unique: true, index: true },
    subjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IExamConfig>('ExamConfig', ExamConfigSchema);
