import express from 'express';
import { reminderController } from './reminder.controller.js';

const router = express.Router();

router.get('/notifications/list', reminderController.listNotifications);
router.post('/notifications/read', reminderController.markNotificationsRead);
router.post('/notifications/test', reminderController.testNotify);

router.get('/', reminderController.listReminders);
router.post('/', reminderController.createReminder);
router.patch('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

export default router;
