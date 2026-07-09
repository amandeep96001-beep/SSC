/**
 * Migrates legacy embedded subject.topics[] → topics + questions collections.
 * Run once if syllabus/topics show empty but data exists in MongoDB subjects.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/modules/study/subject.model.js';
import Topic from '../src/modules/study/topic.model.js';
import Question from '../src/modules/study/question.model.js';

dotenv.config();

async function migrate() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssc_prep';
  console.log(`🔄 Migrating embedded data at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

  await mongoose.connect(mongoUri);

  const rawSubjects = await mongoose.connection.collection('subjects').find({}).toArray();
  let topicsMigrated = 0;
  let questionsMigrated = 0;

  for (const subject of rawSubjects) {
    if (!subject.topics?.length) continue;

    for (const topic of subject.topics) {
      const { questions = [], ...topicFields } = topic;

      await Topic.findOneAndUpdate(
        { id: topicFields.id },
        {
          id: topicFields.id,
          subjectName: subject.name,
          name: topicFields.name,
          syllabus: topicFields.syllabus || '',
          notes: topicFields.notes || ''
        },
        { upsert: true, returnDocument: 'after' }
      );
      topicsMigrated++;

      if (questions.length > 0) {
        await Question.deleteMany({ topicId: topicFields.id });
        const docs = questions.map((q) => ({
          topicId: topicFields.id,
          q: q.q,
          o: q.o,
          a: q.a,
          e: q.e || '',
          state: q.state
        }));
        await Question.insertMany(docs);
        questionsMigrated += docs.length;
      }
    }

    await Subject.updateOne({ _id: subject._id }, { $unset: { topics: '' } });
    console.log(`✅ Migrated: ${subject.name}`);
  }

  console.log(`🎉 Done — ${topicsMigrated} topics, ${questionsMigrated} questions`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
