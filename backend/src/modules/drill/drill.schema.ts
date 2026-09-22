import { z } from 'zod';

export const verifyDrillSchema = z.object({
  challengeToken: z.string().min(20),
  userAnswer: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

export type VerifyDrillBody = z.infer<typeof verifyDrillSchema>;

export const upsertWrongLogSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  correctAnswer: z.string().max(500).optional(),
  userAnswer: z.string().max(500).optional(),
  options: z.array(z.string()).max(8).nullable().optional(),
  placeholder: z.string().max(200).nullable().optional(),
  explanation: z.string().max(4000).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  type: z.string().max(40).optional(),
  word: z.string().max(200).nullable().optional(),
  revealDefinition: z.string().max(2000).nullable().optional(),
  revealSynonyms: z.array(z.string()).max(12).nullable().optional(),
  revealAntonyms: z.array(z.string()).max(12).nullable().optional(),
  pos: z.string().max(80).nullable().optional(),
});

export const migrateWrongLogSchema = z.object({
  items: z.array(upsertWrongLogSchema).max(50),
});

export type UpsertWrongLogBody = z.infer<typeof upsertWrongLogSchema>;
export type MigrateWrongLogBody = z.infer<typeof migrateWrongLogSchema>;
