import mongoose, { Schema } from 'mongoose';

export interface ITopic {
  id: string;
  subjectName: string;
  name: string;
  syllabus?: string;
  notes?: string;
  ownerId?: string | null;
}

const TopicSchema = new Schema<ITopic>({
  id: { type: String, required: true, unique: true },
  subjectName: { type: String, required: true, index: true },
  name: { type: String, required: true },
  syllabus: { type: String },
  notes: { type: String },
  ownerId: { type: String, default: null, index: true }
});

const Topic = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;
