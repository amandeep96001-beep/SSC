import mongoose, { Schema } from 'mongoose';
import type { ISubject } from './study.interface.js';

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  ownerId: { type: String, default: null, index: true }
});

SubjectSchema.index({ name: 1, ownerId: 1 }, { unique: true });

const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

export default Subject;
