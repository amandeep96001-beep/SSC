/**
 * Prep routes — status + sticky notes
 */

import express from 'express';
import { getStatus, getNotes, createNote, deleteNote } from './prep.controller.js';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// ___________________________________________ prep ___________________________________________

router.get('/status', getStatus);

router.route('/notes')
  .get(getNotes)
  .post(requireAdmin, createNote);

router.route('/notes/:id')
  .delete(requireAdmin, deleteNote);

export default router;
