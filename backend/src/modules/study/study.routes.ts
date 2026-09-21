/**
 * Study routes — subjects, topics, notes, vocab
 */

import express from 'express';
import {
  getSubjects,
  addSubject,
  deleteSubject,
  getTopics,
  getTopicNotes,
  getTopicTest,
  addTopic,
  updateTopic,
  deleteTopic,
  getVocab,
  addVocab,
  updateVocab,
  addVocabBulk,
} from './study.controller.js';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// ___________________________________________ subjects ___________________________________________

router.get('/subjects', getSubjects);
router.post('/subjects', addSubject);
router.delete('/subjects/:subjectName', deleteSubject);
router.get('/subjects/:subjectName/topics', getTopics);
router.post('/subjects/:subjectName/topics', addTopic);

// ___________________________________________ topics ___________________________________________

router.get('/topics/:topicId/notes', getTopicNotes);
router.get('/topics/:topicId/test', getTopicTest);
router.put('/topics/:topicId', updateTopic);
router.delete('/topics/:topicId', deleteTopic);

// ___________________________________________ vocab ___________________________________________

router.get('/vocab', getVocab);
router.post('/vocab', requireAdmin, addVocab);
router.post('/vocab/bulk', requireAdmin, addVocabBulk);
router.put('/vocab/:vocabId', requireAdmin, updateVocab);

export default router;
