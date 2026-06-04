import mongoose from 'mongoose';

const VocabSchema = new mongoose.Schema({
  word: { type: String, required: true },
  pos: { type: String, default: 'Noun' },
  definition: { type: String, required: true },
  synonyms: [{ type: String, required: true }],
  antonyms: [{ type: String, required: true }],
  category: { 
    type: String, 
    required: true,
    enum: ['Word Power', 'Idioms & Phrases', 'One Word Substitution', 'Spelling Rules']
  },
  createdBy: { type: String, default: 'system' }
});

// Avoid re-compiling Model if already registered
const Vocab = mongoose.models.Vocab || mongoose.model('Vocab', VocabSchema);

const fractionConversions = [
  { fraction: '1/1', percentage: '100%' },
  { fraction: '1/2', percentage: '50%' },
  { fraction: '1/3', percentage: '33.33%' },
  { fraction: '1/4', percentage: '25%' },
  { fraction: '1/5', percentage: '20%' },
  { fraction: '1/6', percentage: '16.67%' },
  { fraction: '1/7', percentage: '14.28%' },
  { fraction: '1/8', percentage: '12.5%' },
  { fraction: '1/9', percentage: '11.11%' },
  { fraction: '1/10', percentage: '10%' },
  { fraction: '1/11', percentage: '9.09%' },
  { fraction: '1/12', percentage: '8.33%' },
  { fraction: '1/13', percentage: '7.69%' },
  { fraction: '1/14', percentage: '7.14%' },
  { fraction: '1/15', percentage: '6.67%' },
  { fraction: '1/16', percentage: '6.25%' },
  { fraction: '1/17', percentage: '5.88%' },
  { fraction: '1/18', percentage: '5.56%' },
  { fraction: '1/19', percentage: '5.26%' },
  { fraction: '1/20', percentage: '5%' },
  { fraction: '1/21', percentage: '4.76%' },
  { fraction: '1/22', percentage: '4.54%' },
  { fraction: '1/23', percentage: '4.35%' },
  { fraction: '1/24', percentage: '4.17%' },
  { fraction: '1/25', percentage: '4%' },
  { fraction: '2/3', percentage: '66.67%' },
  { fraction: '3/4', percentage: '75%' },
  { fraction: '2/5', percentage: '40%' },
  { fraction: '3/5', percentage: '60%' },
  { fraction: '4/5', percentage: '80%' },
  { fraction: '3/8', percentage: '37.5%' },
  { fraction: '5/8', percentage: '62.5%' },
  { fraction: '7/8', percentage: '87.5%' },
  { fraction: '5/6', percentage: '83.33%' },
  { fraction: '4/7', percentage: '57.14%' },
  { fraction: '5/7', percentage: '71.43%' }
];

class VocabModel {
  static async getVocabulary() {
    return await Vocab.find({}).lean();
  }

  static async getRandomWord() {
    const count = await Vocab.countDocuments();
    if (count === 0) {
      // Return safe fallback word
      return {
        word: 'Alacrity',
        pos: 'Noun',
        definition: 'Brisk and cheerful readiness.',
        synonyms: ['Eagerness', 'Promptness'],
        antonyms: ['Reluctance', 'Apathy'],
        category: 'Word Power',
        options: ['Eagerness', 'Reluctance', 'Apathy', 'Doubt']
      };
    }
    const idx = Math.floor(Math.random() * count);
    const word = await Vocab.findOne().skip(idx).lean();
    
    // Dynamically retrieve wrong options from other words in DB for the drill compatibility
    const otherWords = await Vocab.find({ _id: { $ne: word._id } }).limit(3).lean();
    const wrongOptions = otherWords.map(w => w.synonyms[0] || w.word);
    const correctOption = word.synonyms[0] || word.word;
    
    while (wrongOptions.length < 3) {
      wrongOptions.push('IncorrectOption' + wrongOptions.length);
    }
    
    word.options = [correctOption, ...wrongOptions];
    return word;
  }

  static getFractionConversions() {
    return fractionConversions;
  }

  static async getRandomConversion() {
    const idx = Math.floor(Math.random() * fractionConversions.length);
    return fractionConversions[idx];
  }
}

export { Vocab };
export default VocabModel;
