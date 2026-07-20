import { OAuth2Client } from 'google-auth-library';

let idClient = null;

function getClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.');
  }
  return clientId;
}

function getIdClient() {
  if (!idClient) idClient = new OAuth2Client(getClientId());
  return idClient;
}

function profileFromPayload(payload) {
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

/**
 * Verify Google Identity Services ID token (credential from GIS button).
 */
export async function verifyGoogleIdToken(credential) {
  if (!credential || typeof credential !== 'string') {
    throw new Error('Missing Google credential.');
  }
  const clientId = getClientId();
  const ticket = await getIdClient().verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  return profileFromPayload(ticket.getPayload());
}

/**
 * Exchange GIS popup auth code for profile.
 * redirect_uri must be 'postmessage' for @react-oauth/google popup code flow.
 */
export async function exchangeGoogleAuthCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Missing Google auth code.');
  }
  const clientId = getClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is required for Google code sign-in.');
  }

  const client = new OAuth2Client(clientId, clientSecret, 'postmessage');
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token.');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: clientId,
  });
  return profileFromPayload(ticket.getPayload());
}
