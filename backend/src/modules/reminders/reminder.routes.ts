import express from 'express';
import { reminderController } from './reminder.controller.js';
import {
  createReminderSchema,
  updateReminderSchema,
  markNotificationsReadSchema,
} from './reminder.schema.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

router.get('/notifications/list', reminderController.listNotifications);
router.post(
  '/notifications/read',
  validate(markNotificationsReadSchema),
  reminderController.markNotificationsRead,
);
router.post('/notifications/test', reminderController.testNotify);

router.get('/', reminderController.listReminders);
router.post('/', validate(createReminderSchema), reminderController.createReminder);
router.patch('/:id', validate(updateReminderSchema), reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

export default router;
