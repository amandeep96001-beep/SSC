import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { getDBStatus } from './config/db.config.js';
import { getEnvHealth } from './config/env.config.js';
import { notFound, errorHandler } from './shared/middleware/error.middleware.js';
import { mongoSanitize } from './shared/middleware/sanitize.middleware.js';

function normalizeOrigin(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

/** True for Vercel production + preview hosts (e.g. myapp.vercel.app, myapp-git-main-team.vercel.app) */
function isVercelOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && (hostname === 'vercel.app' || hostname.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}

/** Build allowlist from FRONTEND_URL + optional comma-separated FRONTEND_URLS */
function getAllowedOrigins() {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(String(process.env.FRONTEND_URLS || '').split(',')),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  const bakedIn = [
    // Always allow the known production frontend (Render FRONTEND_URL is often left as localhost)
    'https://myexamprep-theta.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  return [...new Set([...bakedIn, ...fromEnv])];
}

function isOriginAllowed(origin, allowedOrigins) {
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized) || isVercelOrigin(normalized)) return true;

  // Local/LAN phone testing (non-production only)
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const { hostname, protocol } = new URL(normalized);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    // Private network ranges
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
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = getAllowedOrigins();

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Allow Google OAuth popup to talk back to the opener window
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }));
  app.use(compression());

  // Reject disallowed Origin early so OPTIONS never falls through to auth (401 without ACAO).
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();
    if (isOriginAllowed(origin, allowedOrigins)) return next();
    console.warn(`[cors] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ') || '(none)'}`);
    if (req.method === 'OPTIONS') {
      return res.status(403).json({
        status: 'error',
        message: 'CORS origin not allowed. Set FRONTEND_URL on the API host to your deployed frontend origin.',
      });
    }
    return next();
  });

  app.use(cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      // Should rarely hit — blocked above — keep cors from reflecting the origin
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use(mongoSanitize);
  app.use(hpp());
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  // Rate limiting — disabled in local dev (React Strict Mode doubles requests)
  if (isProduction) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      message: { status: 'error', message: 'Too many requests. Please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
  }

  app.use('/api', apiRouter);

  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'SSC Exam Prep API',
      version: '1.0.0',
      corsOrigins: allowedOrigins,
    });
  });

  // Public health check (load balancers, frontend status dot)
  app.get('/health', (req, res) => {
    const dbOk = getDBStatus();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      uptime: process.uptime(),
      db: dbOk ? 'connected' : 'disconnected',
      env: getEnvHealth(),
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
