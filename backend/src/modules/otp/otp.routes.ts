import express from 'express';
import { otpController } from './otp.controller.js';
import { otpRequestSchema, otpVerifySchema } from './otp.schema.js';
import { validate } from '../../lib/validate.js';
import { requireDb } from '../../middleware/db.middleware.js';
import { authLimiter, otpLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();

router.post('/otp/request', otpLimiter, requireDb, validate(otpRequestSchema), otpController.requestOtp);
router.post('/otp/verify', authLimiter, requireDb, validate(otpVerifySchema), otpController.verifyOtp);

export default router;
