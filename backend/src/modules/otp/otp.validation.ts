import { body } from 'express-validator';

export const otpRequestValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
];

export const otpVerifyValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('code').trim().matches(/^\d{6}$/).withMessage('OTP must be a 6-digit code.'),
];
