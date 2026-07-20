import { OAuth2Client } from 'google-auth-library';

let client = null;

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.');
  }
  if (!client) client = new OAuth2Client(clientId);
  return client;
}

/**
 * Verify Google Identity Services ID token (credential from GIS button).
 * @returns {{ email: string, googleId: string, name?: string, picture?: string }}
 */
export async function verifyGoogleIdToken(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.');
  }
  if (!credential || typeof credential !== 'string') {
    throw new Error('Missing Google credential.');
  }

  const ticket = await getClient().verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw new Error('Invalid Google token payload.');
  }
  if (payload.email_verified === false) {
    throw new Error('Google email is not verified.');
  }

  return {
    email: String(payload.email).toLowerCase().trim(),
    googleId: String(payload.sub),
    name: payload.name || payload.given_name || undefined,
    picture: payload.picture || undefined,
  };
}
