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

export { passwordRules };

export const registerValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  passwordRules,
  usernameRules,
];

export const loginValidation = [
  body('username')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Email or username is required.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Email or username is required.'),
  body().custom((_, { req }) => {
    if (!String(req.body?.username || req.body?.email || '').trim()) {
      throw new Error('Email or username is required.');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required.'),
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

export const updateProfileValidation = [
  body('displayName')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const name = String(value).trim();
      if (name.length > 80) throw new Error('Display name must be at most 80 characters.');
      return true;
    }),
  body('avatarUrl')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (typeof value !== 'string') throw new Error('Invalid avatar.');
      if (value.length > 200_000) throw new Error('Profile photo is too large.');
      return true;
    }),
  body().custom((_, { req }) => {
    const hasName = Object.prototype.hasOwnProperty.call(req.body || {}, 'displayName');
    const hasAvatar = Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarUrl');
    if (!hasName && !hasAvatar) {
      throw new Error('Nothing to update. Send displayName and/or avatarUrl.');
    }
    return true;
  }),
];
