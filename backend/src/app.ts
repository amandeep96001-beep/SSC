/**
 * Express application factory
 *
 * Order matters: security headers → CORS → body parsers → sanitize → rate limit → routes.
 * Keep this file boring and explicit — every middleware here is intentional.
 */

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
import { notFound, errorHandler } from './shared/middleware/error.middleware.js';
import { mongoSanitize } from './shared/middleware/sanitize.middleware.js';

// ___________________________________________ cors helpers ___________________________________________

function normalizeOrigin(url: unknown): string {
  return String(url || '').trim().replace(/\/+$/, '');
}

/** Allowlist from FRONTEND_URL + optional comma-separated FRONTEND_URLS. */
function getAllowedOrigins() {
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

  // Local / LAN phone testing only — never on Render.
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

// ___________________________________________ app factory ___________________________________________

export function createApp() {
  const app = express();
  const hosted = isHostedRuntime();
  const allowedOrigins = getAllowedOrigins();

  if (hosted) {
    app.set('trust proxy', 1);
  }

  // ___________________________________________ security ___________________________________________

  app.use(helmet({
    contentSecurityPolicy: hosted ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
  }));

  // Helmet 8 skips Permissions-Policy; FedCM / Google GIS needs this allowlist.
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), identity-credentials-get=(self "https://accounts.google.com")',
    );
    next();
  });

  app.use(compression());

  // ___________________________________________ cors ___________________________________________

  // Reject bad Origin early so OPTIONS never falls through to auth (401 without ACAO).
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
      // curl / server-to-server send no Origin
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

  // ___________________________________________ parsers + harden ___________________________________________

  // Notes / question payloads can be large; keep well under a DoS-friendly ceiling.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(mongoSanitize);
  app.use(hpp());
  app.use(morgan(hosted ? 'combined' : 'dev'));

  // ___________________________________________ rate limit ___________________________________________

  // Skip in local dev — React Strict Mode doubles requests and trips the limiter.
  if (hosted) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      message: { status: 'error', message: 'Too many requests. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
  }

  // ___________________________________________ api + health ___________________________________________

  app.use('/api', apiRouter);

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'SSC Exam Prep API',
      version: '1.0.0',
    });
  });

  // Readiness — 503 when Mongo is down so the host does not route healthy traffic to a dead DB.
  app.get('/health', (_req, res) => {
    const dbOk = getDBStatus();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      uptime: process.uptime(),
      db: dbOk ? 'connected' : 'disconnected',
    });
  });

  // Liveness / free-tier ping — always 200 while the process is up.
  app.get('/keepalive', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // ___________________________________________ errors ___________________________________________

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
