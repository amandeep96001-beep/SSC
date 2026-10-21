import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Vite can abort the first dynamic import after a lockfile re-optimize.
 * Retry a couple of times before surfacing the error boundary.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      await wait(350);
      try {
        return await factory();
      } catch {
        await wait(700);
        return factory();
      }
    }
  });
}
