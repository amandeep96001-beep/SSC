import express from 'express';
import { mockController } from './mock.controller.js';
import { requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(mockController.getMockTests)
  .post(requireAdmin, mockController.createMockTest);

router.route('/:id')
  .get(mockController.getMockTestById)
  .delete(requireAdmin, mockController.deleteMockTest);

export default router;
