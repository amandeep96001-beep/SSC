import { body } from 'express-validator';

const usernameRules = body('username')
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

export const registerValidation = [usernameRules, passwordRules];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.')
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
