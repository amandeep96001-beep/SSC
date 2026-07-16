import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // null / missing = official global syllabus; set for user-created subjects
  ownerId: { type: String, default: null, index: true }
});

SubjectSchema.index({ name: 1, ownerId: 1 }, { unique: true });

const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

export default Subject;
