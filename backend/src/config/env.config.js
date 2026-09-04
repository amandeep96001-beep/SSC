const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET'];

export function isHostedRuntime() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

export function validateEnv() {
  const isProduction = isHostedRuntime();
  if (!isProduction) return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Set them in the Render dashboard → Environment → Environment Variables.');
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }

  const nodeEnv = process.env.NODE_ENV?.trim();
  if (nodeEnv !== 'production') {
    console.warn(
      `⚠️ NODE_ENV is "${nodeEnv || '(unset)'}". On Render set NODE_ENV=production.`,
    );
  }
}

export function getEnvHealth() {
  const frontendUrl = process.env.FRONTEND_URL?.trim() || '';
  const isLocalFrontend =
    !frontendUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(frontendUrl);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGODB_URI?.trim()),
    hasJwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
    hasFrontendUrl: Boolean(frontendUrl),
    // true only when FRONTEND_URL looks like a real deployed origin (not localhost)
    hasDeployedFrontendUrl: Boolean(frontendUrl) && !isLocalFrontend,
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
  };
}
