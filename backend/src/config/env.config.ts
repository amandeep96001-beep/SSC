const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'] as const;

export function isHostedRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

export function validateEnv(): void {
  if (!isHostedRuntime()) return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (jwtSecret.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }

  const frontend = (process.env.FRONTEND_URL ?? '').trim();
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(frontend)) {
    console.warn(
      '[env] FRONTEND_URL points at localhost on a hosted runtime — CORS/email links will break for real users.'
    );
  }

  if (!process.env.ADMIN_EMAIL?.trim()) {
    console.warn('[env] ADMIN_EMAIL is unset — no account will receive admin role.');
  }
}
