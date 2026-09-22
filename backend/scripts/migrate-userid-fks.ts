#!/usr/bin/env tsx
/**
 * Backfill userId on Progress, MockProgress, and CompetitionScore from username.
 * Safe to re-run — only updates documents missing userId.
 *
 *   npx tsx scripts/migrate-userid-fks.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(root, '../.env') });

async function backfill(
  collectionName: string,
  users: Map<string, mongoose.Types.ObjectId>,
): Promise<number> {
  const col = mongoose.connection.collection(collectionName);
  const cursor = col.find({ userId: { $exists: false } });
  let updated = 0;
  let missing = 0;

  for await (const doc of cursor) {
    const username = String(doc.username || '');
    const userId = users.get(username);
    if (!userId) {
      missing += 1;
      continue;
    }
    await col.updateOne({ _id: doc._id }, { $set: { userId } });
    updated += 1;
  }

  console.info(`[migrate] ${collectionName}: updated=${updated} missingUser=${missing}`);
  return updated;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.info('[migrate] connected');

  const users = new Map<string, mongoose.Types.ObjectId>();
  const userDocs = await mongoose.connection.collection('users').find({}).project({ username: 1 }).toArray();
  for (const u of userDocs) {
    users.set(String(u.username), u._id as mongoose.Types.ObjectId);
  }
  console.info(`[migrate] loaded ${users.size} users`);

  await backfill('progresses', users);
  await backfill('mockprogresses', users);
  await backfill('competitionscores', users);

  await mongoose.disconnect();
  console.info('[migrate] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
