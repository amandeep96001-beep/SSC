import { z } from 'zod';

export const submitCompetitionSchema = z.object({
  sessionToken: z.string().min(20),
  answers: z.array(z.union([z.number().int().min(0).max(3), z.null()])).min(1).max(20),
  timeTaken: z.number().min(0).max(3600),
  subject: z.string().trim().max(32).optional(),
});

export type SubmitCompetitionBody = z.infer<typeof submitCompetitionSchema>;
