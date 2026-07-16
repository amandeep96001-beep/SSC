import mongoose from 'mongoose';

const ExamConfigSchema = new mongoose.Schema(
  {
    examId: { type: String, required: true, unique: true, index: true },
    subjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('ExamConfig', ExamConfigSchema);
