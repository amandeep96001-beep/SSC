import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  q: { type: String, required: true },
  o: [{ type: String, required: true }],
  a: { type: Number, required: true },
  e: { type: String, required: true },
  state: { type: String }
});

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  syllabus: { type: String },
  notes: { type: String },
  questions: [QuestionSchema]
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  topics: [TopicSchema]
});

SubjectSchema.index({ name: 1 });
SubjectSchema.index({ 'topics.id': 1 });

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;
