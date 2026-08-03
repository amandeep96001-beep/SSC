/**
 * Remove duplicate syllabus/topic MCQs (same normalized question text within a topicId).
 * Keeps the oldest document per topic+question; deletes the rest.
 *
 * Usage: node scripts/clean_topic_duplicates.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Question from '../src/modules/study/question.model.js';
import { normalizeQuestionText } from '../src/modules/study/questionDedupe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function clean() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI is not defined in backend/.env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    const totalBefore = await Question.countDocuments();
    console.log(`Topic questions before: ${totalBefore}`);

    const all = await Question.find({}).sort({ _id: 1 }).lean();
    const seenByTopic = new Map(); // topicId -> Set(normalized q)
    const idsToDelete = [];
    /** @type {Record<string, number>} */
    const deletedByTopic = {};

    for (const row of all) {
      const topicId = row.topicId || 'unknown';
      if (!seenByTopic.has(topicId)) seenByTopic.set(topicId, new Set());
      const seen = seenByTopic.get(topicId);
      const key = normalizeQuestionText(row.q);

      if (!key) {
        idsToDelete.push(row._id);
        deletedByTopic[topicId] = (deletedByTopic[topicId] || 0) + 1;
        continue;
      }

      if (seen.has(key)) {
        idsToDelete.push(row._id);
        deletedByTopic[topicId] = (deletedByTopic[topicId] || 0) + 1;
      } else {
        seen.add(key);
      }
    }

    if (idsToDelete.length === 0) {
      console.log('No topic-wise duplicate questions found.');
    } else {
      console.log(`Found ${idsToDelete.length} duplicate(s). Deleting…`);
      const result = await Question.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${result.deletedCount} duplicate question(s).`);

      const topicsTouched = Object.entries(deletedByTopic).sort((a, b) => b[1] - a[1]);
      console.log('\nPer topic:');
      for (const [topicId, count] of topicsTouched) {
        console.log(`  ${topicId}: removed ${count}`);
      }
    }

    console.log(`\nTopic questions after: ${await Question.countDocuments()}`);
  } catch (error) {
    console.error('Error during topic duplicate cleanup:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

clean();
