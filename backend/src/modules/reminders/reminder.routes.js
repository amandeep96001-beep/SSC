import express from 'express';
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  listNotifications,
  markNotificationsRead,
  testNotify,
} from './reminder.controller.js';

const router = express.Router();

router.get('/notifications/list', listNotifications);
router.post('/notifications/read', markNotificationsRead);
router.post('/notifications/test', testNotify);

router.get('/', listReminders);
router.post('/', createReminder);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;
