import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './config/db.config.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environmental parameters
dotenv.config();

// Establish mock DB connection
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(helmet()); // Security headers
app.use(compression()); // GZIP payload compression
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev')); // HTTP request logging

// API Rate Limiting (500 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// API Root Router mounting
app.use('/api', apiRouter);

// Root Hello Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SSC Exam Prep API is active. Access endpoints under /api/prep'
  });
});

// Fallback error middlewares
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Production server boot complete on http://localhost:${PORT}`);
});
