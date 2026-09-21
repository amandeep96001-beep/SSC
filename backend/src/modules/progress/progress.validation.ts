import { body } from 'express-validator';

export const progressValidation = [
  body('topicId').trim().notEmpty().isLength({ max: 128 }).withMessage('Topic ID is required.'),
  body('score').isFloat({ min: 0, max: 10000 }).withMessage('Score must be a number.'),
  body('maxScore').optional({ values: 'falsy' }).isFloat({ min: 1, max: 10000 }),
  body('examId').optional({ values: 'falsy' }).trim().isLength({ max: 64 }),
];

export const mockProgressValidation = [
  body('mockTestId').trim().notEmpty().isLength({ max: 128 }).withMessage('Mock test ID is required.'),
  body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title is required.'),
  body('score').isFloat({ min: -10000, max: 10000 }).withMessage('Score must be a number.'),
  body('correct').isInt({ min: 0, max: 500 }).withMessage('Correct count is required.'),
  body('wrong').isInt({ min: 0, max: 500 }).withMessage('Wrong count is required.'),
  body('blank').isInt({ min: 0, max: 500 }).withMessage('Blank count is required.'),
  body('accuracy').isFloat({ min: 0, max: 100 }).withMessage('Accuracy is required.'),
];
