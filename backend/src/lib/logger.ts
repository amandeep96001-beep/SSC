import pino from 'pino';
import { isHostedRuntime } from '../config/env.config.js';

const level = process.env.LOG_LEVEL || (isHostedRuntime() ? 'info' : 'debug');

export const logger = pino({
  level,
  base: { service: 'crackuex-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'otp',
      'REDIS_URL',
      'err.config.headers.Authorization',
    ],
    censor: '[redacted]',
  },
  ...(!isHostedRuntime() && process.env.NODE_ENV !== 'test'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
});

export type AppLogger = typeof logger;
