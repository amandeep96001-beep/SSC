import type { Server } from 'node:http';
import { logger } from '../lib/logger.js';
import { closeRedis } from './redis.js';
import { disconnectDB } from '../config/db.config.js';

const FORCE_EXIT_MS = 15_000;

export function installProcessShutdown(opts: { server?: Server } = {}): void {
  let stopping = false;

  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info({ signal, msg: 'shutdown started' });

    const killer = setTimeout(() => {
      logger.error('shutdown timed out');
      process.exit(1);
    }, FORCE_EXIT_MS);
    killer.unref();

    try {
      if (opts.server) {
        await new Promise<void>((resolve, reject) => {
          opts.server!.close((err) => (err ? reject(err) : resolve()));
        });
      }
      const { stopReminderRuntime } = await import('../modules/reminders/reminder.runtime.js');
      await stopReminderRuntime();
      await closeRedis();
      await disconnectDB();
    } catch (err) {
      logger.error({ err, msg: 'shutdown failed' });
      process.exit(1);
      return;
    }

    process.exit(0);
  };

  process.once('SIGTERM', () => {
    void stop('SIGTERM');
  });
  process.once('SIGINT', () => {
    void stop('SIGINT');
  });
}
