import { z } from 'zod';
import { passwordSchema } from '../auth/auth.schema.js';

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const verifyPasswordResetOtpSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit code.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: passwordSchema,
});
