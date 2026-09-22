import mongoose, { Schema } from 'mongoose';
import type { IWrongLog } from './wrong-log.interface.js';

const WrongLogSchema = new Schema<IWrongLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true, maxlength: 2000 },
    correctAnswer: { type: String, maxlength: 500 },
    userAnswer: { type: String, maxlength: 500 },
    options: { type: [String], default: undefined },
    placeholder: { type: String, maxlength: 200 },
    explanation: { type: String, maxlength: 4000 },
    category: { type: String, maxlength: 120 },
    type: { type: String, maxlength: 40, index: true },
    word: { type: String, maxlength: 200 },
    revealDefinition: { type: String, maxlength: 2000 },
    revealSynonyms: { type: [String], default: undefined },
    revealAntonyms: { type: [String], default: undefined },
    pos: { type: String, maxlength: 80 },
    wrongCount: { type: Number, default: 1, min: 1 },
    lastWrongAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, versionKey: false },
);

WrongLogSchema.index({ userId: 1, question: 1 }, { unique: true });
WrongLogSchema.index({ userId: 1, lastWrongAt: -1 });

const WrongLog = mongoose.models.WrongLog
  || mongoose.model<IWrongLog>('WrongLog', WrongLogSchema);

export default WrongLog;
