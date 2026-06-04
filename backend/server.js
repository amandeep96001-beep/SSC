import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
app.use(cors());
app.use(express.json());

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
