import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { isHostedRuntime } from '../config/env.config.js';
import { badRequest, unauthorized } from '../utils/app-errors.js';

const ALG = 'HS256' as const;
const DRILL_TTL_SEC = Number(process.env.DRILL_CHALLENGE_TTL_SEC || 300);
const COMPETITION_TTL_SEC = Number(process.env.COMPETITION_SESSION_TTL_SEC || 900);

let ephemeral: string | null = null;

function secret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (s) return s;
  if (isHostedRuntime()) throw new Error('JWT_SECRET must be set in production');
  if (!ephemeral) ephemeral = crypto.randomBytes(48).toString('hex');
  return ephemeral;
}

export interface DrillChallengePayload {
  typ: 'drill_challenge';
  userId: string;
  drillType: string;
  /** Authoritative answer (server-only; never send to client). */
  answer: string;
  questionId?: string;
  question?: string;
  subject?: string;
}

export interface CompetitionSessionPayload {
  typ: 'competition_session';
  userId: string;
  subject: string;
  /** Parallel arrays: question id + correct option index. */
  qids: string[];
  keys: number[];
}

export function signDrillChallenge(
  payload: Omit<DrillChallengePayload, 'typ'>,
): string {
  return jwt.sign(
    { ...payload, typ: 'drill_challenge' },
    secret(),
    { expiresIn: DRILL_TTL_SEC, algorithm: ALG } satisfies SignOptions,
  );
}

export function verifyDrillChallenge(token: string, userId: string): DrillChallengePayload {
  try {
    const payload = jwt.verify(token, secret(), { algorithms: [ALG] });
    if (
      typeof payload === 'string'
      || !payload
      || typeof payload !== 'object'
      || (payload as DrillChallengePayload).typ !== 'drill_challenge'
      || typeof (payload as DrillChallengePayload).answer !== 'string'
    ) {
      throw badRequest('Invalid drill challenge.');
    }
    const typed = payload as DrillChallengePayload;
    if (typed.userId !== userId) {
      throw unauthorized('Drill challenge does not belong to this session.');
    }
    return typed;
  } catch (err) {
    if (err instanceof Error && (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')) {
      throw badRequest('Drill challenge expired. Load a new question.');
    }
    throw err;
  }
}

export function signCompetitionSession(
  payload: Omit<CompetitionSessionPayload, 'typ'>,
): string {
  return jwt.sign(
    { ...payload, typ: 'competition_session' },
    secret(),
    { expiresIn: COMPETITION_TTL_SEC, algorithm: ALG } satisfies SignOptions,
  );
}

export function verifyCompetitionSession(
  token: string,
  userId: string,
): CompetitionSessionPayload {
  try {
    const payload = jwt.verify(token, secret(), { algorithms: [ALG] });
    if (
      typeof payload === 'string'
      || !payload
      || typeof payload !== 'object'
      || (payload as CompetitionSessionPayload).typ !== 'competition_session'
      || !Array.isArray((payload as CompetitionSessionPayload).qids)
      || !Array.isArray((payload as CompetitionSessionPayload).keys)
    ) {
      throw badRequest('Invalid competition session.');
    }
    const typed = payload as CompetitionSessionPayload;
    if (typed.userId !== userId) {
      throw unauthorized('Competition session does not belong to this user.');
    }
    return typed;
  } catch (err) {
    if (err instanceof Error && (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')) {
      throw badRequest('Competition session expired. Start a new battle.');
    }
    throw err;
  }
}
