import VocabModel, { Vocab } from '../models/vocabModel.js';

class VocabRepository {
  async findAll(query = {}) {
    return await Vocab.find(query).sort({ word: 1 }).lean();
  }

  async findById(id) {
    return await Vocab.findById(id);
  }

  async create(vocabData) {
    const newVocab = new Vocab(vocabData);
    return await newVocab.save();
  }

  async update(id, updateData) {
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
