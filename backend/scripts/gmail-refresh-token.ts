/**
 * One-time: obtain GMAIL_REFRESH_TOKEN so production can send OTP over HTTPS
 * (Render free blocks Gmail SMTP ports).
 *
 * Google Cloud Console → this OAuth client → Authorized redirect URIs:
 *   http://127.0.0.1:53682/oauth2callback
 * Enable the Gmail API, then run from backend/: npm run gmail:token
 */
import http from 'node:http';
import { URL } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

if (!clientId || !clientSecret) {
  console.error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in backend/.env');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', REDIRECT);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const err = url.searchParams.get('error');
    const code = url.searchParams.get('code');
    if (err || !code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(`OAuth failed: ${err || 'missing code'}`);
      server.close();
      process.exit(1);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT,
        grant_type: 'authorization_code',
      }),
    });
    const body = await tokenRes.json() as { refresh_token?: string; error?: string };
    if (!body.refresh_token) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`No refresh token. ${body.error || 'Re-run with prompt=consent.'}`);
      server.close();
      process.exit(1);
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Refresh token received. You can close this tab and return to the terminal.');
    console.log('\nGMAIL_REFRESH_TOKEN=' + body.refresh_token);
    console.log('\nAdd this to backend/.env and Render env, then restart the API.\n');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Token exchange failed. See terminal.');
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this URL, approve gmail.send, then copy GMAIL_REFRESH_TOKEN from the terminal:\n');
  console.log(authUrl.toString());
});
