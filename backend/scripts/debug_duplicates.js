import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
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

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const jsonPath = path.join(__dirname, '../models/new.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf8').trim();
    const data = JSON.parse(fileContent);

    console.log(`Loaded ${data.length} questions from new.json.`);

    const existingQuestions = await TCSQuestion.find({}).lean();
    console.log(`Loaded ${existingQuestions.length} questions from DB.`);

    const normalizedToDbQuestion = new Map();
    for (const eq of existingQuestions) {
      normalizedToDbQuestion.set(normalizeQuestionText(eq.question), eq);
    }

    let matchCount = 0;
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      const normalized = normalizeQuestionText(q.question);
      if (normalizedToDbQuestion.has(normalized)) {
        matchCount++;
        const matchedDbQ = normalizedToDbQuestion.get(normalized);
        console.log(`\nMatch #${matchCount} (Index ${i} in new.json):`);
        console.log(`  New Q  : ${q.question.substring(0, 100)}...`);
        console.log(`  Db Q   : ${matchedDbQ.question.substring(0, 100)}...`);
        console.log(`  Db ID  : ${matchedDbQ._id}`);
      } else {
        console.log(`\nNO MATCH for Index ${i}:`);
        console.log(`  New Q  : ${q.question.substring(0, 100)}...`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
