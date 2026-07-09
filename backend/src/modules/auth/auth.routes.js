import express from 'express';
import { register, login, saveProgress, saveMockProgress } from './auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/progress', saveProgress);
router.post('/mock-progress', saveMockProgress);

export default router;
