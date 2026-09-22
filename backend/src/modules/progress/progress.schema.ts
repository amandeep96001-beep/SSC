import { z } from 'zod';

export const saveProgressSchema = z.object({
  topicId: z.string().trim().min(1).max(128),
  score: z.number().min(0).max(10_000).optional(),
  maxScore: z.number().min(1).max(10_000).optional(),
  correct: z.number().int().min(0).max(500).optional(),
  wrong: z.number().int().min(0).max(500).optional(),
  blank: z.number().int().min(0).max(500).optional(),
  elapsedTime: z.union([z.string(), z.number()]).optional().transform((v) => (v == null ? undefined : String(v))),
  examId: z.string().trim().max(64).optional(),
  subjectName: z.string().trim().max(128).optional(),
});

export const saveMockProgressSchema = z.object({
  mockTestId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(200),
  score: z.number().min(-10_000).max(10_000).optional(),
  correct: z.number().int().min(0).max(500),
  wrong: z.number().int().min(0).max(500),
  blank: z.number().int().min(0).max(500),
  accuracy: z.number().min(0).max(100).optional(),
  elapsedTime: z.union([z.string(), z.number()]).optional().transform((v) => (v == null ? undefined : String(v))),
  sectionTimes: z.record(z.string(), z.unknown()).optional(),
  examId: z.string().trim().max(64).optional(),
});

export type SaveProgressBody = z.infer<typeof saveProgressSchema>;
export type SaveMockProgressBody = z.infer<typeof saveMockProgressSchema>;
