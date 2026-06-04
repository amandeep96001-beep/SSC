import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/subjectModel.js';
import Question from '../models/questionModel.js';

dotenv.config();

const migrateDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssc_prep';
    console.log(`🔄 Connecting to database at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('🔍 Finding subjects to migrate...');
    
    // Use lean to avoid Mongoose validation errors during migration of raw docs
    const subjects = await mongoose.connection.collection('subjects').find({}).toArray();
    let totalQuestionsMigrated = 0;

    for (const subject of subjects) {
      if (!subject.topics || !Array.isArray(subject.topics)) continue;
      
      let modified = false;
      const questionsToInsert = [];

      for (let i = 0; i < subject.topics.length; i++) {
        const topic = subject.topics[i];
        
        if (topic.questions && Array.isArray(topic.questions) && topic.questions.length > 0) {
          modified = true;
          
          topic.questions.forEach(q => {
            questionsToInsert.push({
              topicId: topic.id,
              q: q.q,
              o: q.o,
              a: q.a,
              e: q.e,
              state: q.state
            });
          });
          
          // Remove questions from the raw topic object
          delete subject.topics[i].questions;
        }
      }

      if (modified) {
        if (questionsToInsert.length > 0) {
          await Question.insertMany(questionsToInsert);
          totalQuestionsMigrated += questionsToInsert.length;
        }
        
        // Update the subject document in DB
        await mongoose.connection.collection('subjects').updateOne(
          { _id: subject._id },
          { $set: { topics: subject.topics } }
        );
        console.log(`✅ Migrated questions for subject: ${subject.name}`);
      }
    }

    console.log(`🎉 Migration complete! Total questions moved: ${totalQuestionsMigrated}`);
    
    mongoose.connection.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateDB();
