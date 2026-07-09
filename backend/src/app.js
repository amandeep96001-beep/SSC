import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './shared/middleware/error.middleware.js';
import { mongoSanitize } from './shared/middleware/sanitize.middleware.js';

export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  const frontendUrl = process.env.FRONTEND_URL;

  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(compression());
  app.use(cors({
    origin: frontendUrl
      ? ['http://localhost:5173', 'http://localhost:4173', frontendUrl]
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
      version: '1.0.0'
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
