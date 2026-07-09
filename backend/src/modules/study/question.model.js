import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  topicId: { type: String, required: true, index: true },
  q: { type: String, required: true },
  o: [{ type: String, required: true }],
  a: { type: Number, required: true },
  e: { type: String, required: true },
  state: { type: String }
});

const Question = mongoose.model('Question', QuestionSchema);

export default Question;
