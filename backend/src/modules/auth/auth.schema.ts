import { z } from 'zod';

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username may only contain letters, numbers, dots, underscores, and hyphens.');

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
  username: usernameSchema.optional(),
});

export const loginSchema = z
  .object({
    username: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    password: z.string().min(1),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: 'Email or username is required.',
    path: ['username'],
  });

export const googleAuthSchema = z
  .object({
    code: z.string().trim().optional(),
    credential: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.code || data.credential), {
    message: 'Google code or credential is required.',
  });

export const updateProfileSchema = z
  .object({
    displayName: z.union([z.string().max(80), z.null()]).optional(),
    avatarUrl: z.union([z.string().max(200_000), z.null()]).optional(),
  })
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: 'Nothing to update. Send displayName and/or avatarUrl.',
  });

export { passwordSchema };
