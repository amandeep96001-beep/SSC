import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../infra/rate-limit-store.js';

function intEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: intEnv('RATE_LIMIT_AUTH_MAX', 20),
  message: { status: 'error', message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('auth'),
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: intEnv('RATE_LIMIT_OTP_MAX', 10),
  message: { status: 'error', message: 'Too many OTP requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('otp'),
});
