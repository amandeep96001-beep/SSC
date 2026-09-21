import mongoose, { Schema } from 'mongoose';
import type { ITCSQuestion } from './tcs-question.interface.js';

const TCSQuestionSchema = new Schema<ITCSQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  category: { type: String, required: true },
  year: { type: Number, default: null },
  isImportant: { type: Boolean, default: false }
}, { timestamps: true });

const TCSQuestion = mongoose.models.TCSQuestion || mongoose.model<ITCSQuestion>('TCSQuestion', TCSQuestionSchema);

export default TCSQuestion;
