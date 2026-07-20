/**
 * Repair MCQ underline / blank / [cite] junk in MongoDB.
 * Usage: node backend/scripts/fixMcqMarkup.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { repairMcqFields } from '../src/modules/questions/mcqText.js';

async function fixTcs(db) {
  const col = db.collection('tcsquestions');
  const docs = await col.find({}).toArray();
  let updated = 0;
  for (const d of docs) {
    const next = repairMcqFields({
      question: d.question,
      options: d.options,
      explanation: d.explanation,
    });
    const changed =
      next.question !== (d.question || '')
      || JSON.stringify(next.options) !== JSON.stringify(d.options || [])
      || next.explanation !== (d.explanation || '');
    if (!changed) continue;
    await col.updateOne(
      { _id: d._id },
      {
        $set: {
          question: next.question,
          options: next.options,
          explanation: next.explanation,
        },
      }
    );
    updated++;
  }
  return { total: docs.length, updated };
}

async function fixTopicQuestions(db) {
  const col = db.collection('questions');
  const docs = await col.find({}).toArray();
  let updated = 0;
  for (const d of docs) {
    const next = repairMcqFields({
      question: d.q,
      options: d.o,
      explanation: d.e,
    });
    const changed =
      next.question !== (d.q || '')
      || JSON.stringify(next.options) !== JSON.stringify(d.o || [])
      || next.explanation !== (d.e || '');
    if (!changed) continue;
    await col.updateOne(
      { _id: d._id },
      { $set: { q: next.question, o: next.options, e: next.explanation } }
    );
    updated++;
  }
  return { total: docs.length, updated };
}

async function fixMocks(db) {
  const col = db.collection('mocktests');
  const mocks = await col.find({}).toArray();
  let updatedMocks = 0;
  let updatedQs = 0;
  for (const m of mocks) {
    let changed = false;
    const questions = (m.questions || []).map((q) => {
      const next = repairMcqFields({
        question: q.q,
        options: q.o,
        explanation: q.e,
      });
      const qChanged =
        next.question !== (q.q || '')
        || JSON.stringify(next.options) !== JSON.stringify(q.o || [])
        || next.explanation !== (q.e || '');
      if (qChanged) {
        changed = true;
        updatedQs++;
      }
      return {
        ...q,
        q: next.question,
        o: next.options,
        e: next.explanation,
      };
    });
    if (!changed) continue;
    await col.updateOne({ _id: m._id }, { $set: { questions } });
    updatedMocks++;
  }
  return { total: mocks.length, updatedMocks, updatedQs };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const tcs = await fixTcs(db);
  const topic = await fixTopicQuestions(db);
  const mocks = await fixMocks(db);

  console.log(JSON.stringify({ tcs, topic, mocks }, null, 2));

  // Spot-check remaining underline-without-tag
  const leftover = await db.collection('tcsquestions').countDocuments({
    question: { $regex: /underlin|highlight/i, $not: { $regex: /<u>/i } },
  });
  console.log('tcs underline/highlight still missing <u>:', leftover);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
