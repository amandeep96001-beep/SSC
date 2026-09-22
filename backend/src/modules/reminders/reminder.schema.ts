import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().max(500).optional(),
  time: z.string().trim().regex(/^\d{1,2}:\d{2}$/, 'time must be HH:MM'),
  timezone: z.string().trim().max(64).optional(),
  repeat: z.enum(['once', 'daily', 'weekdays']).optional(),
  enabled: z.boolean().optional(),
});

export const updateReminderSchema = createReminderSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nothing to update.' },
);

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().min(1)).max(100).optional(),
  all: z.boolean().optional(),
});
