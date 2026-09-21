import express from 'express';
import { prepController } from './prep.controller.js';
import { requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', prepController.getStatus);

router.route('/notes')
  .get(prepController.getNotes)
  .post(requireAdmin, prepController.createNote);

router.route('/notes/:id')
  .delete(requireAdmin, prepController.deleteNote);

export default router;
