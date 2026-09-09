import mongoose, { Schema } from 'mongoose';

export interface IQuestion {
  topicId: string;
  q: string;
  o: string[];
  a: number;
  e: string;
  state?: string;
}

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
