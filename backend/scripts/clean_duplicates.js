import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import TCSQuestion from '../src/modules/questions/tcs-question.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function normalizeQuestionText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function clean() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not defined in the environment variables.");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const questions = await TCSQuestion.find({});
    console.log(`Total questions in DB before cleaning: ${questions.length}`);

    const seen = new Map();
    const idsToDelete = [];

    for (const q of questions) {
      const normalized = normalizeQuestionText(q.question);
      if (seen.has(normalized)) {
        // We have already seen this question, mark this duplicate's ID for deletion
        idsToDelete.push(q._id);
      } else {
        seen.set(normalized, q._id);
      }
    }

    if (idsToDelete.length === 0) {
      console.log("No duplicate questions found in the database. Clean up not needed.");
    } else {
      console.log(`Found ${idsToDelete.length} duplicate questions. Deleting them...`);
      const result = await TCSQuestion.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Successfully deleted ${result.deletedCount} duplicate questions.`);
    }

    console.log(`Total DB Count after cleaning: ${await TCSQuestion.countDocuments()}`);

  } catch (error) {
    console.error("Error during cleaning:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

clean();
