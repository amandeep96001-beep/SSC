import pino from 'pino';
import { isHostedRuntime } from '../config/env.config.js';

const level = process.env.LOG_LEVEL || (isHostedRuntime() ? 'info' : 'debug');

export const logger = pino({
  level,
  base: { service: 'crackuex-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isHostedRuntime()
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
});

export type AppLogger = typeof logger;
