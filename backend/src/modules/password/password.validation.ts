import { body } from 'express-validator';
import { passwordRules } from '../auth/auth.validation.js';

export const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
];

export const verifyPasswordResetOtpValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('code').trim().matches(/^\d{6}$/).withMessage('OTP must be a 6-digit code.'),
];

export const resetPasswordValidation = [
  body('token').trim().isLength({ min: 20 }).withMessage('A valid reset link is required.'),
  passwordRules,
];
