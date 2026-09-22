import mongoose from 'mongoose';
import competitionRepository from './competition.repository.js';
import { badRequest, notFound, unauthorized } from '../../utils/app-errors.js';
import type {
  CompetitionQuestionMeta,
  PublicCompetitionQuestion,
  SubmitScoreInput,
} from './competition.interface.js';
import { cacheDel, cacheGetJson, cacheSetJson } from '../../infra/cache.js';
import { signCompetitionSession, verifyCompetitionSession } from '../../lib/challenge-token.js';

export class CompetitionService {
  async getQuestions(userId: string, subjectRaw: unknown, limitRaw: unknown) {
    if (!userId) throw unauthorized('Authentication required.');

    const subject = String(subjectRaw ?? 'Mixed');
    const questionLimit = Math.min(parseInt(String(limitRaw), 10) || 10, 20);

    const matchFilter: { subject?: string } = {};
    if (subject !== 'Mixed') {
      matchFilter.subject = subject;
    }

    const questions = await competitionRepository.sampleQuestions(matchFilter, questionLimit);
    if (!questions || questions.length === 0) {
      throw notFound(`No questions found for subject: ${subject}. Please seed the database first.`);
    }

    const qids: string[] = [];
    const keys: number[] = [];
    const publicQuestions: PublicCompetitionQuestion[] = [];

    for (const q of questions) {
      const id = String(q._id);
      qids.push(id);
      keys.push(Number(q.correctAnswer));
      publicQuestions.push({
        _id: id,
        question: q.question,
        options: q.options,
        subject: q.subject,
        category: q.category,
        explanation: q.explanation,
      });
    }

    const sessionToken = signCompetitionSession({
      userId,
      subject,
      qids,
      keys,
    });

    return {
      data: publicQuestions,
      meta: {
        total: publicQuestions.length,
        subject,
        sessionToken,
      } satisfies CompetitionQuestionMeta,
    };
  }

  async submitScore(
    userId: string,
    username: string,
    body: SubmitScoreInput,
  ) {
    if (!userId) throw unauthorized('Authentication required.');

    const session = verifyCompetitionSession(body.sessionToken, userId);
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== session.qids.length) {
      throw badRequest(`Expected ${session.qids.length} answers, got ${answers.length}.`);
    }

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const keyedResults: Array<{
      questionId: string;
      selected: number | null;
      correctIndex: number;
      isCorrect: boolean;
    }> = [];

    for (let i = 0; i < session.keys.length; i++) {
      const selected = answers[i];
      const correctIndex = session.keys[i];
      const normalized =
        selected === null || selected === undefined || Number.isNaN(Number(selected))
          ? null
          : Number(selected);

      let isCorrect = false;
      if (normalized === null) {
        skipped += 1;
      } else if (normalized === correctIndex) {
        correct += 1;
        isCorrect = true;
      } else {
        wrong += 1;
      }

      keyedResults.push({
        questionId: session.qids[i],
        selected: normalized,
        correctIndex,
        isCorrect,
      });
    }

    const total = session.keys.length || 1;
    const accuracy = Math.round((correct / total) * 1000) / 10;
    const score = correct;
    const timeTakenN = Math.min(3600, Math.max(0, Number(body.timeTaken) || 0));
    const resolvedSubject = String(body.subject || session.subject || 'Mixed').slice(0, 32);

    const newScore = await competitionRepository.createScore({
      userId: new mongoose.Types.ObjectId(userId),
      username,
      subject: resolvedSubject,
      score,
      correct,
      wrong,
      skipped,
      accuracy,
      timeTaken: timeTakenN,
    });

    await cacheDel(`competition:lb:${resolvedSubject}`);

    const personalBest = await competitionRepository.findPersonalBest(userId, resolvedSubject);
    const betterScores = await competitionRepository.countBetterScores(
      resolvedSubject,
      score,
      timeTakenN,
    );

    return {
      data: {
        savedScore: newScore,
        personalBest,
        rank: betterScores + 1,
        correct,
        wrong,
        skipped,
        accuracy,
        score,
        timeTaken: timeTakenN,
        results: keyedResults,
      },
    };
  }

  async getLeaderboard(subjectRaw: unknown) {
    const subject = String(subjectRaw ?? 'Mixed');
    const cacheKey = `competition:lb:${subject}`;
    const cached = await cacheGetJson<unknown[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        meta: { subject, total: cached.length, cached: true },
      };
    }

    const leaderboard = await competitionRepository.leaderboard(subject);
    const ttl = Number(process.env.LEADERBOARD_CACHE_TTL_SEC || 30);
    await cacheSetJson(cacheKey, leaderboard, ttl);
    return {
      data: leaderboard,
      meta: { subject, total: leaderboard.length, cached: false },
    };
  }
}

export const competitionService = new CompetitionService();
