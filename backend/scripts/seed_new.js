import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TCSQuestion from '../models/tcsQuestionModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not defined in the environment variables.");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const jsonPath = path.join(__dirname, '../models/new.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}. Please place your JSON file there.`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8').trim();
    if (!fileContent) {
      console.log("new.json is empty. Nothing to seed.");
      return;
    }

    const data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
      console.error("new.json must contain a JSON Array of questions.");
      process.exit(1);
    }

    console.log(`Loaded ${data.length} questions from new.json.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const q of data) {
      // Basic validation
      if (!q.question || !q.subject || !q.category || !Array.isArray(q.options) || q.correctAnswer === undefined) {
        console.warn(`Skipping invalid question structure: ${JSON.stringify(q).substring(0, 100)}...`);
        skippedCount++;
        continue;
      }

      // Check duplicate
      const exists = await TCSQuestion.findOne({ question: q.question });
      if (!exists) {
        await TCSQuestion.create(q);
        insertedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Successfully Imported: ${insertedCount}`);
    console.log(`Skipped (Duplicates/Invalid): ${skippedCount}`);
    console.log(`Total DB Count: ${await TCSQuestion.countDocuments()}`);
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
