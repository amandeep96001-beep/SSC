import mongoose from 'mongoose';
import Subject from '../modules/study/subject.model.js';

let isDbConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 12000,
    });
    isDbConnected = true;
    console.log('🔥 MongoDB connected (Atlas ☁️)');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

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
  } catch (error) {
    console.warn('⚠️ Post-connection setup warning:', error.message);
    // Non-fatal — server continues
  }
};

export const getDBStatus = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};
