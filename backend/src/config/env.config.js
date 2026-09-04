const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET'];

export function isHostedRuntime() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

export function validateEnv() {
  if (!isHostedRuntime()) return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
}
