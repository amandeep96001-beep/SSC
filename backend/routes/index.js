import express from 'express';
import prepRoutes from './prepRoutes.js';
import drillRoutes from './drillRoutes.js';
import studyRoutes from './studyRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Mount modules
router.use('/prep', prepRoutes);
router.use('/drill', drillRoutes);
router.use('/study', studyRoutes);
router.use('/auth', authRoutes);

export default router;
