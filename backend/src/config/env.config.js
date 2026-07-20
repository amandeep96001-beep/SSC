const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET'];

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
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
}

export function getEnvHealth() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGODB_URI?.trim()),
    hasJwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
    hasFrontendUrl: Boolean(process.env.FRONTEND_URL?.trim()),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
  };
}
