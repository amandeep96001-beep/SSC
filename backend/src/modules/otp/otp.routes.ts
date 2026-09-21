import express from 'express';
import { otpController } from './otp.controller.js';
import { otpRequestValidation, otpVerifyValidation } from './otp.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireDb } from '../../middleware/db.middleware.js';
import { authLimiter, otpLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();

router.post('/otp/request', otpLimiter, requireDb, otpRequestValidation, validateRequest, otpController.requestOtp);
router.post('/otp/verify', authLimiter, requireDb, otpVerifyValidation, validateRequest, otpController.verifyOtp);

export default router;
