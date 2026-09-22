import competitionRepository from './competition.repository.js';
import { badRequest, notFound, unauthorized } from '../../utils/app-errors.js';
import type { CompetitionQuestionMeta, SubmitScoreInput } from './competition.interface.js';
import { cacheDel, cacheGetJson, cacheSetJson } from '../../infra/cache.js';

export class CompetitionService {
  async getQuestions(subjectRaw: unknown, limitRaw: unknown) {
    const subject = subjectRaw ?? 'Mixed';
    const questionLimit = Math.min(parseInt(String(limitRaw), 10) || 10, 20);

    const matchFilter: { subject?: string } = {};
    if (subject !== 'Mixed') {
      matchFilter.subject = String(subject);
    }

    const questions = await competitionRepository.sampleQuestions(matchFilter, questionLimit);
    if (!questions || questions.length === 0) {
      throw notFound(`No questions found for subject: ${subject}. Please seed the database first.`);
    }

    return {
      data: questions,
      meta: { total: questions.length, subject: String(subject) } satisfies CompetitionQuestionMeta,
    };
  }

  async submitScore(username: string | undefined, body: SubmitScoreInput) {
    if (!username) throw unauthorized('Authentication required.');

    const { subject, score, correct, wrong, skipped, accuracy, timeTaken } = body;
    if (score === undefined || correct === undefined || wrong === undefined) {
      throw badRequest('score, correct, and wrong are required fields.');
    }

    const resolvedSubject = String(subject || 'Mixed').slice(0, 32);
    const scoreN = Math.min(20, Math.max(0, Number(score) || 0));
    const correctN = Math.min(20, Math.max(0, Number(correct) || 0));
    const wrongN = Math.min(20, Math.max(0, Number(wrong) || 0));
    const skippedN = Math.min(20, Math.max(0, Number(skipped) || 0));
    const accuracyN = Math.min(100, Math.max(0, parseFloat(String(accuracy)) || 0));
    const timeTakenN = Math.min(3600, Math.max(0, Number(timeTaken) || 0));

    const newScore = await competitionRepository.createScore({
      username,
      subject: resolvedSubject,
      score: scoreN,
      correct: correctN,
      wrong: wrongN,
      skipped: skippedN,
      accuracy: accuracyN,
      timeTaken: timeTakenN,
    });

    await cacheDel(`competition:lb:${resolvedSubject}`);

    const personalBest = await competitionRepository.findPersonalBest(username, resolvedSubject);
    const betterScores = await competitionRepository.countBetterScores(
      resolvedSubject,
      scoreN,
      timeTakenN,
    );

    return {
      data: {
        savedScore: newScore,
        personalBest,
        rank: betterScores + 1,
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
