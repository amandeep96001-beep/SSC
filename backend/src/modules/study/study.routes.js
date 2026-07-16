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
  addVocabBulk
} from './study.controller.js';

const router = express.Router();

router.get('/subjects', getSubjects);
router.post('/subjects', addSubject);
router.delete('/subjects/:subjectName', deleteSubject);
router.get('/subjects/:subjectName/topics', getTopics);
router.post('/subjects/:subjectName/topics', addTopic);
router.get('/topics/:topicId/notes', getTopicNotes);
router.get('/topics/:topicId/test', getTopicTest);
router.put('/topics/:topicId', updateTopic);
router.delete('/topics/:topicId', deleteTopic);

router.get('/vocab', getVocab);
router.post('/vocab', addVocab);
router.post('/vocab/bulk', addVocabBulk);
router.put('/vocab/:vocabId', updateVocab);

export default router;
