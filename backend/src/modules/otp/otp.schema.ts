import { z } from 'zod';

export const otpRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit code.'),
});
