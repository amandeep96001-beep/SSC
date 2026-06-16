import mongoose from 'mongoose';

const TCSQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],       // always 4 options
  correctAnswer: { type: Number, required: true },   // 0-indexed (0, 1, 2, 3)
  explanation: { type: String, default: '' },
  subject: {
    type: String,
    required: true,
    enum: ['GK', 'English', 'Maths', 'Reasoning']
  },
  category: { type: String, required: true },        // e.g. 'History', 'Grammar', 'Idioms'
  year: { type: Number, default: null },             // SSC shift year
  isImportant: { type: Boolean, default: false }     // High-ROI / repeated question
}, { timestamps: true });

const TCSQuestion = mongoose.models.TCSQuestion || mongoose.model('TCSQuestion', TCSQuestionSchema);

export default TCSQuestion;
