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
  // 3 SSC-style distractors (correct answer is definition for idioms, word for OWS)
  options: [{ type: String }],
  category: {
    type: String,
    required: true,
    enum: ['Word Power', 'Idioms & Phrases', 'One Word Substitution', 'Spelling Rules']
  },
  isImportant: { type: Boolean, default: false },
  createdBy: { type: String, default: 'system' }
});

// Avoid re-compiling Model if already registered
const Vocab: Model<IVocab> = (mongoose.models.Vocab as Model<IVocab> | undefined)
  || mongoose.model<IVocab>('Vocab', VocabSchema);

const fractionConversions = [
  { fraction: '1/1', percentage: '100%' },
  { fraction: '1/2', percentage: '50%' },
  { fraction: '1/3', percentage: '33.33%' },
  { fraction: '1/4', percentage: '25%' },
  { fraction: '1/5', percentage: '20%' },
  { fraction: '1/6', percentage: '16.66%' },
  { fraction: '1/7', percentage: '14.28%' },
  { fraction: '1/8', percentage: '12.5%' },
  { fraction: '1/9', percentage: '11.11%' },
  { fraction: '1/10', percentage: '10%' },
  { fraction: '1/11', percentage: '9.09%' },
  { fraction: '1/12', percentage: '8.33%' },
  { fraction: '1/13', percentage: '7.69%' },
  { fraction: '1/14', percentage: '7.14%' },
  { fraction: '1/15', percentage: '6.66%' },
  { fraction: '1/16', percentage: '6.25%' },
  { fraction: '1/17', percentage: '5.88%' },
  { fraction: '1/18', percentage: '5.55%' },
  { fraction: '1/19', percentage: '5.26%' },
  { fraction: '1/20', percentage: '5%' },
  { fraction: '1/24', percentage: '4.16%' },
  { fraction: '1/25', percentage: '4%' },
  { fraction: '1/30', percentage: '3.33%' },
  { fraction: '1/40', percentage: '2.5%' },
  { fraction: '1/50', percentage: '2%' },
  { fraction: '2/3', percentage: '66.66%' },
  { fraction: '3/4', percentage: '75%' },
  { fraction: '2/5', percentage: '40%' },
  { fraction: '3/5', percentage: '60%' },
  { fraction: '4/5', percentage: '80%' },
  { fraction: '5/6', percentage: '83.33%' },
  { fraction: '2/7', percentage: '28.56%' },
  { fraction: '3/7', percentage: '42.84%' },
  { fraction: '4/7', percentage: '57.14%' },
  { fraction: '5/7', percentage: '71.42%' },
  { fraction: '6/7', percentage: '85.71%' },
  { fraction: '3/8', percentage: '37.5%' },
  { fraction: '5/8', percentage: '62.5%' },
  { fraction: '7/8', percentage: '87.5%' },
  { fraction: '2/9', percentage: '22.22%' },
  { fraction: '4/9', percentage: '44.44%' },
  { fraction: '5/9', percentage: '55.55%' },
  { fraction: '7/9', percentage: '77.77%' },
  { fraction: '8/9', percentage: '88.88%' },
  { fraction: '2/11', percentage: '18.18%' },
  { fraction: '3/11', percentage: '27.27%' },
  { fraction: '4/11', percentage: '36.36%' },
  { fraction: '5/11', percentage: '45.45%' },
  { fraction: '5/12', percentage: '41.66%' },
  { fraction: '7/12', percentage: '58.33%' },
  { fraction: '11/12', percentage: '91.66%' },
  { fraction: '3/16', percentage: '18.75%' },
  { fraction: '5/16', percentage: '31.25%' },
  { fraction: '7/16', percentage: '43.75%' },
  { fraction: '9/16', percentage: '56.25%' }
];

export type FractionConversion = { fraction: string; percentage: string };

export interface RandomVocabWord {
  word: string;
  pos?: string;
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
  options: string[];
  category: string;
}

const FALLBACK_WORD: RandomVocabWord = {
  word: 'Alacrity',
  pos: 'Noun',
  definition: 'Brisk and cheerful readiness.',
  synonyms: ['Eagerness', 'Promptness'],
  antonyms: ['Reluctance', 'Apathy'],
  category: 'Word Power',
  options: ['Reluctance', 'Apathy', 'Doubt']
};

class VocabModel {
  static async getVocabulary() {
    return await Vocab.find({}).lean();
  }

  static async getRandomWord(): Promise<RandomVocabWord> {
    const query = { category: { $ne: 'Spelling Rules' } };
    const count = await Vocab.countDocuments(query);
    if (count === 0) {
      return { ...FALLBACK_WORD };
    }
    const idx = Math.floor(Math.random() * count);
    const word = await Vocab.findOne(query).skip(idx).lean();
    if (!word) {
      return { ...FALLBACK_WORD };
    }
    const stored = (word.options || []).map((o: string) => String(o).trim()).filter(Boolean);
    const exclude = new Set(
      [word.definition, word.word, ...(word.synonyms || []), ...(word.antonyms || [])]
        .map((s) => String(s || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const wrongOptions = stored.filter((o) => !exclude.has(o.toLowerCase()));

    if (wrongOptions.length < 3) {
      const otherWords = await Vocab.aggregate<IVocab & { _id: unknown }>([
        { $match: { _id: { $ne: word._id }, category: word.category || { $ne: 'Spelling Rules' } } },
        { $sample: { size: 8 } }
      ]);
      for (const w of otherWords) {
        const candidate = word.category === 'Idioms & Phrases'
          ? (w.definition || w.word)
          : (w.word || w.synonyms?.[0]);
        const key = String(candidate || '').trim();
        if (!key || exclude.has(key.toLowerCase()) || wrongOptions.includes(key)) continue;
        wrongOptions.push(key);
        if (wrongOptions.length >= 3) break;
      }
    }

    return { ...word, options: wrongOptions.slice(0, 3) };
  }

  static getFractionConversions() {
    return fractionConversions;
  }

  static async getRandomConversion(): Promise<FractionConversion> {
    const idx = Math.floor(Math.random() * fractionConversions.length);
    return fractionConversions[idx];
  }
}

export { Vocab };
export default VocabModel;
