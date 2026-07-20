import { body } from 'express-validator';

const usernameRules = body('username')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ min: 3, max: 32 })
  .withMessage('Username must be 3–32 characters.')
  .matches(/^[a-zA-Z0-9._-]+$/)
  .withMessage('Username may only contain letters, numbers, dots, underscores, and hyphens.');

const passwordRules = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be at least 8 characters.')
  .matches(/[A-Za-z]/)
  .withMessage('Password must include at least one letter.')
  .matches(/[0-9]/)
  .withMessage('Password must include at least one number.');

export const registerValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  passwordRules,
  usernameRules,
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Email or username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

export const otpRequestValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
];

export const otpVerifyValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit code.'),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit code.'),
  passwordRules,
];

export const googleAuthValidation = [
  body('code').optional({ values: 'falsy' }).trim().isString(),
  body('credential').optional({ values: 'falsy' }).trim().isString(),
  body().custom((_, { req }) => {
    if (!req.body?.code && !req.body?.credential) {
      throw new Error('Google code or credential is required.');
    }
    return true;
  }),
];

export const progressValidation = [
  body('topicId').trim().notEmpty().withMessage('Topic ID is required.'),
  body('score').isNumeric().withMessage('Score must be a number.')
];

export const mockProgressValidation = [
  body('mockTestId').trim().notEmpty().withMessage('Mock test ID is required.'),
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('score').isNumeric().withMessage('Score must be a number.'),
  body('correct').isInt({ min: 0 }).withMessage('Correct count is required.'),
  body('wrong').isInt({ min: 0 }).withMessage('Wrong count is required.'),
  body('blank').isInt({ min: 0 }).withMessage('Blank count is required.'),
  body('accuracy').isNumeric().withMessage('Accuracy is required.')
];
