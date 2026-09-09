import express from 'express';
import { createMockTest, getMockTests, getMockTestById, deleteMockTest } from './mock.controller.js';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getMockTests)
  .post(requireAdmin, createMockTest);

router.route('/:id')
  .get(getMockTestById)
  .delete(requireAdmin, deleteMockTest);

export default router;
