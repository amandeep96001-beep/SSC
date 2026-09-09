import mongoose, { Schema, type Model } from 'mongoose';

export type VocabCategory =
  | 'Word Power'
  | 'Idioms & Phrases'
  | 'One Word Substitution'
  | 'Spelling Rules';

export interface IVocab {
  word: string;
  pos?: string;
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
  options?: string[];
  category: VocabCategory | string;
  isImportant?: boolean;
  createdBy?: string;
}

const VocabSchema = new Schema<IVocab>({
  word: { type: String, required: true, unique: true },
  pos: { type: String, default: 'Noun' },
  definition: { type: String, required: true },
  synonyms: [{ type: String }],
  antonyms: [{ type: String }],
  // 3 same-type SSC distractors (idiom meanings / OWS words / WP words)
  options: [{ type: String }],
  category: {
    type: String,
    required: true,
    enum: ['Word Power', 'Idioms & Phrases', 'One Word Substitution', 'Spelling Rules']
  },
  isImportant: { type: Boolean, default: false },
  createdBy: { type: String, default: 'system' }
});

const Vocab: Model<IVocab> = (mongoose.models.Vocab as Model<IVocab> | undefined)
  || mongoose.model<IVocab>('Vocab', VocabSchema);

export { Vocab };
export default Vocab;
