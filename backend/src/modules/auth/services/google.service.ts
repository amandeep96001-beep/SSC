import { verifyGoogleIdToken, exchangeGoogleAuthCode } from '../google.util.js';
import { upsertUserFromEmail } from '../authIdentity.util.js';
import { buildSessionPayload } from './auth.service.js';
import type { GoogleAuthInput } from '../auth.types.js';
import type { PublicUserPayload } from '../../../types/domain.js';
import {
  badRequest,
  unauthorized,
  serviceUnavailable,
} from '../../../shared/errors/http-error.js';

export interface GoogleLoginResult {
  data: PublicUserPayload;
}

export async function loginWithGoogle(input: GoogleAuthInput): Promise<GoogleLoginResult> {
  if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
    throw serviceUnavailable('Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing).');
  }

  const { code, credential } = input || {};
  if (!code && !credential) {
    throw badRequest('Google code or credential is required.');
  }

  if (code && !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    throw serviceUnavailable('Google code sign-in is unavailable. Use the Google button (ID token) instead.');
  }

  let profile;
  try {
    profile = credential
      ? await verifyGoogleIdToken(String(credential))
      : await exchangeGoogleAuthCode(String(code));
  } catch (err) {
    const detail = err instanceof Error ? err.message : '';
    if (detail.includes('GOOGLE_CLIENT_SECRET')) {
      throw serviceUnavailable('Google code sign-in is unavailable on this server.');
    }
    if (detail.includes('not verified')) {
      throw unauthorized('Your Google email is not verified. Verify it with Google, then try again.');
    }
    throw unauthorized('Google sign-in failed. Try again.');
  }

  const user = await upsertUserFromEmail({
    email: profile.email,
    googleId: profile.googleId,
    displayName: profile.name,
    emailVerified: true,
  });

  return {
    data: await buildSessionPayload(user),
  };
}
