/**
 * Fill SSC-style MCQ distractors on every vocab row.
 * Idioms → 3 other idiom meanings
 * One Word → 3 other substitution words
 * Word Power → 3 other words / synonyms
 *
 * Also upserts high-frequency SSC idioms missing from the bank.
 *
 * Usage: node scripts/seedVocabOptions.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Vocab } from '../src/modules/study/vocab.model.js';

dotenv.config();

function norm(s: unknown): string {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function key(s: unknown): string {
  return norm(s).toLowerCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickThree(pool: string[], excludeKeys: Iterable<unknown>): string[] {
  const banned = new Set([...excludeKeys].map(key));
  const unique = [];
  const seen = new Set();
  for (const raw of shuffle(pool)) {
    const v = norm(raw);
    const k = key(v);
    if (!v || banned.has(k) || seen.has(k)) continue;
    seen.add(k);
    unique.push(v);
    if (unique.length === 3) break;
  }
  return unique;
}

/** High-frequency SSC CGL/CHSL idioms — upsert if missing. */
const SSC_IDIOMS = [
  ['A blessing in disguise', 'An apparent misfortune that later produces a good result'],
  ['A bone of contention', 'A subject that causes disagreement or conflict'],
  ['A bolt from the blue', 'A sudden and unexpected shock or surprise'],
  ['A close shave', 'A narrow escape from danger'],
  ['A feather in one\'s cap', 'An achievement to be proud of'],
  ['A fish out of water', 'A person in an uncomfortable or unfamiliar situation'],
  ['A man of straw', 'A person of no substance or weak character'],
  ['A red-letter day', 'An important or memorable day'],
  ['A wild goose chase', 'A foolish or hopeless search for something unattainable'],
  ['A white elephant', 'A costly possession that is more trouble than it is worth'],
  ['At sixes and sevens', 'In a state of confusion or disorder'],
  ['At the drop of a hat', 'Immediately, without any hesitation'],
  ['Apple of one\'s eye', 'Someone cherished above all others'],
  ['Barking up the wrong tree', 'Pursuing a mistaken line of thought or action'],
  ['Beat about the bush', 'To avoid coming to the main point'],
  ['Beat black and blue', 'To hit someone badly and violently'],
  ['Bite off more than one can chew', 'To take on a task that is too difficult'],
  ['Bite the bullet', 'To face a painful or difficult situation with courage'],
  ['Blow one\'s own trumpet', 'To boast about one\'s own achievements'],
  ['Burn one\'s boats', 'To do something that makes it impossible to go back'],
  ['Bury the hatchet', 'To end a quarrel and make peace'],
  ['By leaps and bounds', 'Very rapidly; with great speed'],
  ['Call a spade a spade', 'To speak frankly and plainly'],
  ['Call it a day', 'To stop working on something for the rest of the day'],
  ['Caught red-handed', 'Discovered in the act of doing something wrong'],
  ['Cock and bull story', 'An absurd or improbable tale'],
  ['Cost an arm and a leg', 'To be extremely expensive'],
  ['Cry wolf', 'To raise a false alarm'],
  ['Cut a sorry figure', 'To create a poor impression'],
  ['Cut corners', 'To do something poorly in order to save time or money'],
  ['Dark horse', 'A person who reveals unexpected talent or wins unexpectedly'],
  ['Eat humble pie', 'To admit one\'s mistake and apologise'],
  ['Every cloud has a silver lining', 'Every difficult situation has some hope'],
  ['Fair-weather friend', 'A friend who stays only in good times'],
  ['Get cold feet', 'To become too frightened to do something'],
  ['Get out of hand', 'To become uncontrollable'],
  ['Gift of the gab', 'The ability to speak fluently and persuasively'],
  ['Give the cold shoulder', 'To treat someone in an unfriendly way'],
  ['Go the extra mile', 'To make a special extra effort'],
  ['Grease someone\'s palm', 'To bribe someone'],
  ['Hard and fast', 'Strict and not to be changed'],
  ['Hit below the belt', 'To act unfairly'],
  ['Hit the nail on the head', 'To describe a situation exactly; to be precisely right'],
  ['Hobson\'s choice', 'No real choice at all; take it or leave it'],
  ['Hold water', 'To appear to be true or reasonable'],
  ['In a nutshell', 'In the fewest possible words; briefly'],
  ['In hot water', 'In trouble or difficulty'],
  ['In the nick of time', 'Just in time; at the last possible moment'],
  ['Jack of all trades', 'A person who can do many different kinds of work'],
  ['Keep at bay', 'To prevent someone or something from coming near'],
  ['Keep body and soul together', 'To manage to stay alive with the bare minimum'],
  ['Kick the bucket', 'To die'],
  ['Kill two birds with one stone', 'To achieve two aims with a single effort'],
  ['Leave no stone unturned', 'To try every possible means'],
  ['Let bygones be bygones', 'To forget past quarrels'],
  ['Look down upon', 'To regard someone as inferior'],
  ['Make a mountain out of a molehill', 'To exaggerate a small problem'],
  ['Make both ends meet', 'To manage one\'s expenses within one\'s income'],
  ['Move heaven and earth', 'To make every possible effort'],
  ['Nip in the bud', 'To stop something at an early stage'],
  ['Null and void', 'Having no legal force or effect'],
  ['On cloud nine', 'Extremely happy'],
  ['On the cards', 'Likely to happen'],
  ['Out of the blue', 'Unexpectedly; without warning'],
  ['Pay through the nose', 'To pay an unreasonably high price'],
  ['Play ducks and drakes', 'To waste money recklessly'],
  ['Pour oil on troubled waters', 'To calm a tense situation'],
  ['Put the cart before the horse', 'To do things in the wrong order'],
  ['Rain cats and dogs', 'To rain very heavily'],
  ['Rest on one\'s laurels', 'To be satisfied with past success and stop trying'],
  ['Smell a rat', 'To suspect that something is wrong'],
  ['Spill the beans', 'To reveal a secret'],
  ['Steal someone\'s thunder', 'To take credit for someone else\'s idea'],
  ['Take the bull by the horns', 'To face a difficulty boldly'],
  ['Take to task', 'To scold or criticise someone'],
  ['The last straw', 'The final difficulty that makes a situation unbearable'],
  ['Through thick and thin', 'Under all circumstances, good and bad'],
  ['Throw down the gauntlet', 'To challenge someone'],
  ['Throw in the towel', 'To admit defeat and give up'],
  ['Turn a deaf ear', 'To refuse to listen'],
  ['Turn over a new leaf', 'To start behaving in a better way'],
  ['Under the weather', 'Slightly unwell'],
  ['Yeoman\'s service', 'Excellent and useful service, especially in need'],
];

const SSC_OWS = [
  ['Altruist', 'One who is concerned with the welfare of others', 'Noun'],
  ['Misanthrope', 'One who hates mankind', 'Noun'],
  ['Omniscient', 'One who knows everything', 'Adjective'],
  ['Omnipotent', 'One who is all-powerful', 'Adjective'],
  ['Omnipresent', 'Present everywhere', 'Adjective'],
  ['Infallible', 'One who never makes a mistake', 'Adjective'],
  ['Illegible', 'That which cannot be read', 'Adjective'],
  ['Illicit', 'That which is forbidden by law', 'Adjective'],
  ['Inevitable', 'That which cannot be avoided', 'Adjective'],
  ['Invincible', 'That which cannot be conquered', 'Adjective'],
  ['Invisible', 'That which cannot be seen', 'Adjective'],
  ['Inaudible', 'That which cannot be heard', 'Adjective'],
  ['Incorrigible', 'One who cannot be corrected', 'Adjective'],
  ['Indefatigable', 'One who does not tire easily', 'Adjective'],
  ['Teetotaller', 'One who never takes alcoholic drinks', 'Noun'],
  ['Stoic', 'One who is indifferent to pleasure and pain', 'Noun'],
  ['Cynic', 'One who doubts the sincerity of human motives', 'Noun'],
  ['Optimist', 'One who looks at the bright side of things', 'Noun'],
  ['Pessimist', 'One who looks at the dark side of things', 'Noun'],
  ['Atheist', 'One who does not believe in God', 'Noun'],
  ['Theist', 'One who believes in God', 'Noun'],
  ['Amateur', 'One who does something for pleasure, not as a profession', 'Noun'],
  ['Contemporaries', 'People living at the same time', 'Noun'],
  ['Fatalist', 'One who believes in fate', 'Noun'],
  ['Honorary', 'A post for which no salary is paid', 'Adjective'],
  ['Anonymous', 'A writing or work whose author is not known', 'Adjective'],
  ['Bibliophile', 'One who loves books', 'Noun'],
  ['Cartographer', 'One who draws maps', 'Noun'],
  ['Calligrapher', 'One who has beautiful handwriting', 'Noun'],
  ['Philanthropist', 'One who loves and helps humanity', 'Noun'],
];

const QUALITY_FIXES: Record<string, { synonyms: string[]; antonyms: string[] }> = {
  Mitigate: {
    synonyms: ['Alleviate', 'Lessen', 'Ease'],
    antonyms: ['Aggravate', 'Intensify', 'Worsen'],
  },
};

function genericFillers(kind: string): string[] {
  if (kind === 'Idioms & Phrases') {
    return [
      'To remain idle and do nothing useful',
      'A sudden and unexpected misfortune',
      'To act without any delay',
      'To be in complete disagreement',
      'To waste time on unimportant things',
    ];
  }
  if (kind === 'One Word Substitution') {
    return ['Egoist', 'Stoic', 'Cynic', 'Amateur', 'Fatalist', 'Theist'];
  }
  return ['Apathy', 'Reluctance', 'Timidity', 'Indifference', 'Carelessness'];
}

async function upsertIdioms() {
  const ops = [];
  for (const [word, definition] of SSC_IDIOMS) {
    ops.push({
      updateOne: {
        filter: { word: { $regex: `^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        update: {
          $setOnInsert: {
            word,
            pos: 'Idiom',
            definition,
            synonyms: [],
            antonyms: [],
            options: [],
            category: 'Idioms & Phrases',
            isImportant: true,
            createdBy: 'system',
          },
        },
        upsert: true,
      },
    });
  }
  const res = await Vocab.bulkWrite(ops, { ordered: false });
  return res.upsertedCount || 0;
}

async function upsertOws() {
  const ops = [];
  for (const [word, definition, pos] of SSC_OWS) {
    ops.push({
      updateOne: {
        filter: { word: { $regex: `^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        update: {
          $setOnInsert: {
            word,
            pos,
            definition,
            synonyms: [],
            antonyms: [],
            options: [],
            category: 'One Word Substitution',
            isImportant: true,
            createdBy: 'system',
          },
        },
        upsert: true,
      },
    });
  }
  const res = await Vocab.bulkWrite(ops, { ordered: false });
  return res.upsertedCount || 0;
}

async function fillOptions(
  category: string,
  pickFrom: (r: { word?: string; definition?: string; synonyms?: string[]; antonyms?: string[] }) => string | undefined
) {
  const rows = await Vocab.find({ category }).lean();
  const pool = rows.map((r) => pickFrom(r)).filter((v): v is string => Boolean(v));
  let short = 0;
  const ops = [];

  for (const row of rows) {
    const correct = pickFrom(row);
    const exclude = new Set([
      correct,
      row.word,
      row.definition,
      ...(row.synonyms || []),
      ...(row.antonyms || []),
    ]);
    let options = pickThree(pool, exclude);
    if (options.length < 3) {
      options = [...options, ...pickThree(genericFillers(category), new Set([...exclude, ...options]))];
      options = [...new Set(options.map(norm))].slice(0, 3);
    }
    if (options.length < 3) short += 1;

    const patch = { options };
    const fix = QUALITY_FIXES[row.word];
    if (fix) Object.assign(patch, fix);
    ops.push({ updateOne: { filter: { _id: row._id }, update: { $set: patch } } });
  }

  if (ops.length) await Vocab.bulkWrite(ops, { ordered: false });
  return { count: rows.length, updated: ops.length, short };
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

  const idiomsAdded = await upsertIdioms();
  const owsAdded = await upsertOws();

  const idiomStats = await fillOptions('Idioms & Phrases', (r) => r.definition);
  const owsStats = await fillOptions('One Word Substitution', (r) => r.word);
  const wpStats = await fillOptions('Word Power', (r) => r.word);

  const withOpts = await Vocab.countDocuments({
    category: { $in: ['Idioms & Phrases', 'One Word Substitution', 'Word Power'] },
    options: { $exists: true, $not: { $size: 0 } },
  });
  const idiomOpts = await Vocab.countDocuments({
    category: 'Idioms & Phrases',
    'options.2': { $exists: true },
  });

  console.log(JSON.stringify({
    idiomsAdded,
    owsAdded,
    idioms: idiomStats,
    oneWord: owsStats,
    wordPower: wpStats,
    rowsWithAnyOptions: withOpts,
    idiomsWithThreeOptions: idiomOpts,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
