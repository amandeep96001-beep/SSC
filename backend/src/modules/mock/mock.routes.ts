import express from 'express';
import { createMockTest, getMockTests, getMockTestById, deleteMockTest } from './mock.controller.js';

const router = express.Router();

router.route('/')
  .get(getMockTests)
  .post(createMockTest);

router.route('/:id')
  .get(getMockTestById)
  .delete(deleteMockTest);

export default router;
