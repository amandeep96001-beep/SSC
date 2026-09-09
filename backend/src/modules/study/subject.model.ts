import mongoose, { Schema } from 'mongoose';

export interface ISubject {
  name: string;
  ownerId?: string | null;
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  ownerId: { type: String, default: null, index: true }
});

SubjectSchema.index({ name: 1, ownerId: 1 }, { unique: true });

const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

export default Subject;
