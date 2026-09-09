import VocabModel, { Vocab } from './vocab.model.js';

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
    // using ordered: false so if one word fails due to unique constraint, the rest still insert
    return await Vocab.insertMany(vocabArray, { ordered: false });
  }

  async update(id: string, updateData: object) {
    return await Vocab.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async getRandomWord() {
    return await VocabModel.getRandomWord();
  }

  async getRandomConversion() {
    return await VocabModel.getRandomConversion();
  }
}

export default new VocabRepository();
