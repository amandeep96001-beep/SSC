import express from 'express';
import { studyController } from './study.controller.js';
import { requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/subjects', studyController.getSubjects);
router.post('/subjects', studyController.addSubject);
router.delete('/subjects/:subjectName', studyController.deleteSubject);
router.get('/subjects/:subjectName/topics', studyController.getTopics);
router.post('/subjects/:subjectName/topics', studyController.addTopic);

router.get('/topics/:topicId/notes', studyController.getTopicNotes);
router.get('/topics/:topicId/test', studyController.getTopicTest);
router.put('/topics/:topicId', studyController.updateTopic);
router.delete('/topics/:topicId', studyController.deleteTopic);

router.get('/vocab', studyController.getVocab);
router.post('/vocab', requireAdmin, studyController.addVocab);
router.post('/vocab/bulk', requireAdmin, studyController.addVocabBulk);
router.put('/vocab/:vocabId', requireAdmin, studyController.updateVocab);

export default router;
