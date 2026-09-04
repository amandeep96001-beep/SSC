import mongoose from 'mongoose';
import { Vocab } from '../modules/study/vocab.model.js';
import Subject from '../modules/study/subject.model.js';

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

const LOCAL_URI = 'mongodb://127.0.0.1:27017/ssc_prep';

function isSrvOrRemoteUri(uri) {
  if (!uri) return false;
  if (uri.startsWith('mongodb+srv://')) return true;
  if (uri === LOCAL_URI) return false;
  return !/mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(uri);
}

function authHint(errMsg = '') {
  const msg = String(errMsg);
  if (/bad auth|authentication failed|auth failed/i.test(msg)) {
    return [
      'Atlas username/password in MONGODB_URI is wrong.',
      'Fix: MongoDB Atlas → Database Access → Edit user → Reset password,',
      'then paste the NEW connection string into Render → Environment → MONGODB_URI.',
      'If the password has @ # % / : ? & characters, URL-encode them (e.g. @ → %40).',
    ].join(' ');
  }
  if (/ENOTFOUND|querySrv|getaddrinfo/i.test(msg)) {
    return 'Atlas hostname not found — cluster may be deleted/paused, or MONGODB_URI host is wrong.';
  }
  if (/IP|whitelist|not allowed|Network/i.test(msg)) {
    return 'Atlas Network Access: allow 0.0.0.0/0 (or Render outbound IPs) so Render can connect.';
  }
  return 'Check MONGODB_URI on Render (Dashboard → Environment). Local MongoDB does not exist on Render.';
}

async function tryConnect(uri, label) {
  console.log(`🔄 Trying ${label}: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 12000,
  });
}

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI?.trim();
  const onRenderOrProd = Boolean(process.env.RENDER) || process.env.NODE_ENV === 'production';
  const isRemote = isSrvOrRemoteUri(primaryUri);

  if (!primaryUri) {
    console.error('❌ MONGODB_URI is not set.');
    if (onRenderOrProd) {
      console.error('   Set MONGODB_URI in Render → Environment to your Atlas connection string.');
      process.exit(1);
    }
    try {
      await tryConnect(LOCAL_URI, 'Local MongoDB (dev default)');
      isDbConnected = true;
      console.log('🔥 MongoDB connected (Local 🖥️)');
    } catch (err) {
      console.error('❌ Local MongoDB failed:', err.message);
      console.warn('⚠️ Starting without database (dev mode).');
      return;
    }
  } else {
    try {
      await tryConnect(primaryUri, isRemote ? 'Atlas' : 'Local MongoDB');
      isDbConnected = true;
      console.log(`🔥 MongoDB connected (${isRemote ? 'Atlas ☁️' : 'Local 🖥️'})`);
    } catch (primaryErr) {
      console.error(`❌ MongoDB connection failed: ${primaryErr.message}`);
      isDbConnected = false;

      // Never fall back to localhost on Render — there is no mongod there
      if (onRenderOrProd || isRemote) {
        console.error(`💡 ${authHint(primaryErr.message)}`);
        if (onRenderOrProd) process.exit(1);
        console.warn('⚠️ Starting without database (dev mode — auth & data routes return 503).');
        return;
      }

      // Local URI failed in local-only setup
      console.warn('⚠️ Starting without database (dev mode).');
      return;
    }
  }

  if (!isDbConnected) return;

  try {
    // Drop legacy unique-on-name index so users can create personal subjects
    try {
      await Subject.collection.dropIndex('name_1');
      console.log('🧹 Dropped legacy Subject.name unique index');
    } catch (err) {
      if (err?.codeName !== 'IndexNotFound' && err?.code !== 27) {
        console.warn('Subject index migrate note:', err.message);
      }
    }
    await Subject.syncIndexes();

    const vocabCount = await Vocab.countDocuments();
    if (vocabCount === 0) {
      console.log('🌱 Seeding default vocabulary items...');
      await Vocab.insertMany(defaultSeedVocab);
      console.log('✅ Successfully seeded vocabulary items!');
    }
  } catch (error) {
    console.warn('⚠️ Post-connection setup warning:', error.message);
    // Non-fatal — server continues
  }
};

export const getDBStatus = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};
