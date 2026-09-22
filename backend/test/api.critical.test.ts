import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { setupTestApp, teardownTestApp } from './setup.js';
import User from '../src/modules/auth/auth.model.js';
import { hashPassword } from '../src/utils/password.js';
import { signToken } from '../src/utils/token.js';
import { signDrillChallenge, signCompetitionSession } from '../src/lib/challenge-token.js';
import Progress from '../src/modules/progress/progress.model.js';
import TCSQuestion from '../src/modules/questions/tcs-question.model.js';
import mongoose from 'mongoose';

let app: Express;
let userId: string;
let username: string;
let token: string;

beforeAll(async () => {
  app = await setupTestApp();

  const password = await hashPassword('Password1');
  const user = await User.create({
    username: 'tester',
    email: 'tester@example.com',
    password,
    emailVerified: true,
    role: 'user',
    tokenVersion: 0,
  });
  userId = user._id.toString();
  username = user.username;
  token = signToken(user);
});

afterAll(async () => {
  await teardownTestApp();
});

describe('health + errors', () => {
  it('returns requestId on unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.requestId || res.headers['x-request-id']).toBeTruthy();
  });
});

describe('auth', () => {
  it('rejects bad login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('logs in and returns slim progress arrays', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@example.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeTruthy();
    expect(Array.isArray(res.body.data.progress)).toBe(true);
    // Login bumps tokenVersion — refresh local token for later tests.
    token = res.body.data.token;
    const me = await User.findById(userId);
    expect(me?.tokenVersion).toBeGreaterThan(0);
  });

  it('invalidates old session after login (tokenVersion)', async () => {
    const stale = signToken({
      _id: { toString: () => userId },
      username,
      email: 'tester@example.com',
      role: 'user',
      tokenVersion: 0,
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${stale}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_SUPERSEDED');
  });
});

describe('progress userId', () => {
  it('saves progress keyed by userId', async () => {
    const res = await request(app)
      .post('/api/auth/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ topicId: 'topic-1', score: 40, maxScore: 50, examId: 'ssc-cgl' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const row = await Progress.findOne({ topicId: 'topic-1' }).lean();
    expect(row?.userId?.toString()).toBe(userId);
    expect(row?.username).toBe(username);
  });
});

describe('drill challenge', () => {
  it('verifies with challenge token and does not accept client answer key', async () => {
    const challengeToken = signDrillChallenge({
      userId,
      drillType: 'square',
      answer: '25',
      question: 'What is the square of 5?',
    });

    const okRes = await request(app)
      .post('/api/drill/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ challengeToken, userAnswer: '25' });

    expect(okRes.status).toBe(200);
    expect(okRes.body.data.isCorrect).toBe(true);
    expect(okRes.body.data.correctAnswer).toBe('25');

    const badRes = await request(app)
      .post('/api/drill/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ challengeToken, userAnswer: '24' });

    expect(badRes.status).toBe(200);
    expect(badRes.body.data.isCorrect).toBe(false);
  });
});

describe('competition server grade', () => {
  it('grades answers from session token', async () => {
    const q = await TCSQuestion.create({
      question: '2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      subject: 'Maths',
      category: 'Arithmetic',
    });

    const sessionToken = signCompetitionSession({
      userId,
      subject: 'Maths',
      qids: [q._id.toString()],
      keys: [1],
    });

    const res = await request(app)
      .post('/api/competition/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionToken,
        answers: [1],
        timeTaken: 12,
        subject: 'Maths',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(1);
    expect(res.body.data.correct).toBe(1);
    expect(res.body.data.savedScore.userId.toString()).toBe(userId);
  });
});

describe('zod validation', () => {
  it('rejects invalid progress body', async () => {
    const res = await request(app)
      .post('/api/auth/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 10 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });
});
