import express from 'express';
import { createMockTest, getMockTests, getMockTestById } from '../controllers/mockTestController.js';

const router = express.Router();

router.route('/')
  .get(getMockTests)
  .post(createMockTest);

router.route('/:id')
  .get(getMockTestById);

export default router;
