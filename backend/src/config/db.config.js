import mongoose from 'mongoose';
import { Vocab } from '../modules/study/vocab.model.js';

let isDbConnected = false;

const defaultSeedVocab = [
  // 1. Word Power
  {
    word: 'Alacrity',
    pos: 'Noun',
    definition: 'Brisk and cheerful readiness.',
    synonyms: ['Eagerness', 'Enthusiasm', 'Promptness'],
    antonyms: ['Apathy', 'Reluctance', 'Lethargy'],
    category: 'Word Power'
  },
  {
    word: 'Capricious',
    pos: 'Adjective',
    definition: 'Given to sudden and unaccountable changes of mood or behavior.',
    synonyms: ['Fickle', 'Inconstant', 'Variable'],
    antonyms: ['Stable', 'Consistent', 'Predictable'],
    category: 'Word Power'
  },
  {
    word: 'Ephemeral',
    pos: 'Adjective',
    definition: 'Lasting for a very short time.',
    synonyms: ['Transient', 'Fleeting', 'Brief'],
    antonyms: ['Eternal', 'Enduring', 'Infinite'],
    category: 'Word Power'
  },
  {
    word: 'Mitigate',
    pos: 'Verb',
    definition: 'Make less severe, serious, or painful.',
    synonyms: ['Alleviate', 'Erase', 'Appease'],
    antonyms: ['Aggravate', 'Increase', 'Intensify'],
    category: 'Word Power'
  },
  {
    word: 'Loquacious',
    pos: 'Adjective',
    definition: 'Tending to talk a great deal; talkative.',
    synonyms: ['Talkative', 'Garrulous', 'Wordy'],
    antonyms: ['Taciturn', 'Silent', 'Reserved'],
    category: 'Word Power'
  },
  {
    word: 'Audacious',
    pos: 'Adjective',
    definition: 'Showing a willingness to take surprisingly bold risks.',
    synonyms: ['Bold', 'Daring', 'Intrepid'],
    antonyms: ['Cowardly', 'Timid', 'Fearful'],
    category: 'Word Power'
  },
  {
    word: 'Fastidious',
    pos: 'Adjective',
    definition: 'Very attentive to and concerned about accuracy and detail.',
    synonyms: ['Meticulous', 'Scrupulous', 'Fussy'],
    antonyms: ['Sloppy', 'Careless', 'Indifferent'],
    category: 'Word Power'
  },

  // 2. Idioms & Phrases
  {
    word: 'Bite the bullet',
    pos: 'Idiom',
    definition: 'Decide to do something difficult or unpleasant that one has been avoiding.',
    synonyms: ['Face the music', 'Endure hardship', 'Be brave'],
    antonyms: ['Coward out', 'Avoid', 'Shrink'],
    category: 'Idioms & Phrases'
  },
  {
    word: 'Blessing in disguise',
    pos: 'Idiom',
    definition: 'An apparent misfortune that eventually has good results.',
    synonyms: ['Hidden favor', 'Good luck', 'Fortunate turn'],
    antonyms: ['Curse', 'Unmitigated disaster', 'Setback'],
    category: 'Idioms & Phrases'
  },
  {
    word: 'Burn the midnight oil',
    pos: 'Idiom',
    definition: 'Read or work late into the night.',
    synonyms: ['Work late', 'Study hard', 'Overwork'],
    antonyms: ['Slack off', 'Sleep early', 'Idle'],
    category: 'Idioms & Phrases'
  },

  // 3. One Word Substitution
  {
    word: 'Altruist',
    pos: 'Noun',
    definition: 'A person who cares about others and helps them without expecting anything in return.',
    synonyms: ['Philanthropist', 'Benefactor', 'Samaritan'],
    antonyms: ['Egoist', 'Selfish person', 'Misanthrope'],
    category: 'One Word Substitution'
  },
  {
    word: 'Ephemeral OWS',
    pos: 'Adjective',
    definition: 'Things lasting for a very short time / one day.',
    synonyms: ['Transient', 'Fleeting', 'Brief'],
    antonyms: ['Perpetual', 'Everlasting', 'Permanent'],
    category: 'One Word Substitution'
  },
  {
    word: 'Infallible',
    pos: 'Adjective',
    definition: 'Incapable of making mistakes or being wrong.',
    synonyms: ['Faultless', 'Flawless', 'Unerring'],
    antonyms: ['Fallible', 'Imperfect', 'Weak'],
    category: 'One Word Substitution'
  },

  // 4. Spelling Rules
  {
    word: 'Acquiesce',
    pos: 'Spelling Rule',
    definition: 'Common spelling mistake: writing "Acquise" or "Ackece". Correct form includes "-c-" and "-sce".',
    synonyms: ['Agree silently', 'Comply', 'Accept'],
    antonyms: ['Dissent', 'Protest', 'Object'],
    category: 'Spelling Rules'
  },
  {
    word: 'Maintenance',
    pos: 'Spelling Rule',
    definition: 'Common spelling mistake: writing "Maintainance". Remember that "-tain-" changes to "-ten-" in maintenance.',
    synonyms: ['Upkeep', 'Preservation', 'Support'],
    antonyms: ['Neglect', 'Destruction', 'Abandonment'],
    category: 'Spelling Rules'
  },
  {
    word: 'Occurrence',
    pos: 'Spelling Rule',
    definition: 'Common spelling mistake: writing "Occurence" or "Ocurrence". Correct form has double "c", double "r", and ends in "-ence".',
    synonyms: ['Event', 'Happening', 'Incident'],
    antonyms: ['Non-existence', 'Void', 'Absence'],
    category: 'Spelling Rules'
  }
];

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssc_prep';
    console.log(`🔄 Connecting to Database at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log('🔥 MongoDB connected successfully!');

    const vocabCount = await Vocab.countDocuments();
    if (vocabCount === 0) {
      console.log('🌱 Seeding default vocabulary items into MongoDB Atlas...');
      await Vocab.insertMany(defaultSeedVocab);
      console.log('✅ Successfully seeded vocabulary items!');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isDbConnected = false;
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const getDBStatus = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};
