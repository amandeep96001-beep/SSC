import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { getDBStatus } from './config/db.config.js';
import { isHostedRuntime } from './config/env.config.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { mongoSanitize } from './middleware/sanitize.middleware.js';
import { createRateLimitStore } from './infra/rate-limit-store.js';
import { getRedis, isRedisReady } from './infra/redis.js';

function normalizeOrigin(url: unknown): string {
  return String(url || '').trim().replace(/\/+$/, '');
}

function getAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(String(process.env.FRONTEND_URLS || '').split(',')),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  const productionFrontends = [
    'https://myexamprep-theta.vercel.app',
  ];

  const localFrontends = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  if (isHostedRuntime()) {
    return [...new Set([...productionFrontends, ...fromEnv])];
  }

  return [...new Set([...localFrontends, ...fromEnv])];
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;

  if (isHostedRuntime()) return false;
  try {
    const { hostname, protocol } = new URL(normalized);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  } catch {
    return false;
  }
  return false;
}

export function createApp() {
  const app = express();
  const hosted = isHostedRuntime();
  const allowedOrigins = getAllowedOrigins();

  if (hosted) {
    app.set('trust proxy', 1);
  }

  app.use(helmet({
    contentSecurityPolicy: hosted ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
  }));

  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), identity-credentials-get=(self "https://accounts.google.com")',
    );
    next();
  });

  app.use(compression());

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();
    if (isOriginAllowed(origin, allowedOrigins)) return next();

    console.warn(`[cors] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ') || '(none)'}`);

    if (req.method === 'OPTIONS') {
      return res.status(403).json({
        status: 'error',
        message: 'CORS origin not allowed. Set FRONTEND_URL / FRONTEND_URLS on the API host.',
      });
    }
    return next();
  });

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(mongoSanitize);
  app.use(hpp());
  app.use(morgan(hosted ? 'combined' : 'dev'));

  if (hosted) {
    const max = Number(process.env.RATE_LIMIT_API_MAX || 1200);
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number.isFinite(max) && max > 0 ? Math.floor(max) : 1200,
      message: { status: 'error', message: 'Too many requests. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
      store: createRateLimitStore('api'),
    });
    app.use('/api', limiter);
  }

  app.use('/api', apiRouter);

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'CrackuEx API',
      version: '1.1.0',
    });
  });

  // Eager Redis client (no-op when REDIS_URL unset)
  getRedis();

  app.get('/health', (_req, res) => {
    const dbOk = getDBStatus();
    const redisConfigured = Boolean(process.env.REDIS_URL?.trim());
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      uptime: process.uptime(),
      db: dbOk ? 'connected' : 'disconnected',
      redis: redisConfigured ? (isRedisReady() ? 'connected' : 'connecting') : 'disabled',
    });
  });

  app.get('/keepalive', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
