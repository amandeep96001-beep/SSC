import express from 'express';
import { getStatus, getNotes, createNote, deleteNote } from './prep.controller.js';

const router = express.Router();

// Status route
router.get('/status', getStatus);

// Notes routes
router.route('/notes')
  .get(getNotes)
  .post(createNote);

router.route('/notes/:id')
  .delete(deleteNote);

export default router;
