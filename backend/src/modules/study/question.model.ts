import mongoose, { Schema } from 'mongoose';
import type { IQuestion } from './study.interface.js';

const QuestionSchema = new Schema<IQuestion>({
  topicId: { type: String, required: true, index: true },
  q: { type: String, required: true },
  o: [{ type: String, required: true }],
  a: { type: Number, required: true },
  e: { type: String, required: true },
  state: { type: String }
});

const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
