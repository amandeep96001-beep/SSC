import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './shared/middleware/error.middleware.js';

export function createApp() {
  const app = express();

  const frontendUrl = process.env.FRONTEND_URL;

  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: frontendUrl
      ? ['http://localhost:5173', 'http://localhost:4173', frontendUrl]
      : true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  app.use('/api', apiRouter);

  app.get('/', (req, res) => {
    res.json({
      message: 'SSC Exam Prep API is active. Access endpoints under /api'
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
