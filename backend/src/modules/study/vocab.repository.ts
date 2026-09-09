import { Vocab } from './vocab.model.js';
import { getRandomConversion } from '../drill/fraction-conversions.js';
import { distractorsForEntry, fillStoredDistractors, type VocabLean } from './vocab.mcq.js';

class VocabRepository {
  async findAll(query: object = {}, skip = 0, limit = 30) {
    const total = await Vocab.countDocuments(query);
    const data = await Vocab.find(query).sort({ word: 1 }).skip(skip).limit(limit).lean();
    return { data, total };
  }

  async findById(id: string) {
    return await Vocab.findById(id);
  }

  async create(vocabData: object) {
    const newVocab = new Vocab(vocabData);
    return await newVocab.save();
  }

  async insertMany(vocabArray: object[]) {
    return await Vocab.insertMany(vocabArray, { ordered: false });
  }

  async update(id: string, updateData: object) {
    return await Vocab.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async attachDistractors(doc: VocabLean) {
    const options = await distractorsForEntry(doc);
    if (options.length < 3) return doc;
    const updated = await Vocab.findByIdAndUpdate(
      doc._id,
      { $set: { options: options.slice(0, 3) } },
      { new: true }
    ).lean();
    return (updated as VocabLean | null) || doc;
  }

  async fillCategoryOptions(category: string) {
    return fillStoredDistractors(category);
  }

  getRandomConversion() {
    return getRandomConversion();
  }
}

export default new VocabRepository();
