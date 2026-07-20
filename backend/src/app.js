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

/** Build allowlist from FRONTEND_URL + optional comma-separated FRONTEND_URLS */
function getAllowedOrigins() {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(String(process.env.FRONTEND_URLS || '').split(',')),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  const localDev = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  return [...new Set([...localDev, ...fromEnv])];
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
  app.use(cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      console.warn(`[cors] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ') || '(none)'}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
