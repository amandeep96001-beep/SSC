import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  subjectName: { type: String, required: true, index: true },
  name: { type: String, required: true },
  syllabus: { type: String },
  notes: { type: String },
  // null / missing = official global content; set for user-created topics
  ownerId: { type: String, default: null, index: true }
});

const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

export default Topic;
