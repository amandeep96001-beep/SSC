import mongoose from 'mongoose';



const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  syllabus: { type: String },
  notes: { type: String }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  topics: [TopicSchema]
});

SubjectSchema.index({ name: 1 });
SubjectSchema.index({ 'topics.id': 1 });

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;
