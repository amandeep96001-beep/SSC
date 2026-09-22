import { z } from 'zod';

export const verifyDrillSchema = z.object({
  challengeToken: z.string().min(20),
  userAnswer: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

export type VerifyDrillBody = z.infer<typeof verifyDrillSchema>;
