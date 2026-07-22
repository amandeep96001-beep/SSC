/** Google Identity Services — load once; support ID-token init + auth-code popup. */

let scriptPromise = null;
let initializeStarted = false;
let codeClient = null;

export function loadGsiScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('GSI requires a browser'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }
      scriptPromise = null;
      reject(new Error('Google Identity Services unavailable'));
    };

    const existing = document.querySelector('script[data-examprep-gsi="1"]');
    if (existing) {
      // load may have already fired (HMR / remount) — don't hang waiting for it
      if (window.google?.accounts?.id) {
        finish();
        return;
      }
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => {
        scriptPromise = null;
        reject(new Error('Failed to load Google script'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.examprepGsi = '1';
    script.onload = finish;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google script'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Ensure accounts.id is initialized (used for disableAutoSelect on logout). */
export async function ensureGsiInitialized(clientId) {
  const gsi = await loadGsiScript();
  if (!gsi) throw new Error('Google Identity Services unavailable');

  if (!initializeStarted) {
    initializeStarted = true;
    gsi.initialize({
      client_id: clientId,
      callback: () => {},
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  return gsi;
}

/**
 * Open Google's auth-code popup and resolve with the authorization code.
 * Backend exchanges it via redirect_uri=postmessage.
 */
const codeHandlers = { current: null };

export async function requestGoogleAuthCode(clientId) {
  await loadGsiScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google OAuth unavailable');

  return new Promise((resolve, reject) => {
    codeHandlers.current = { resolve, reject };

    if (!codeClient || codeClient.__clientId !== clientId) {
      codeClient = oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: (response) => {
          const handlers = codeHandlers.current;
          codeHandlers.current = null;
          if (!handlers) return;
          if (response?.error) {
            handlers.reject(new Error(response.error));
            return;
          }
          if (!response?.code) {
            handlers.reject(new Error('Google did not return an auth code.'));
            return;
          }
          handlers.resolve(response.code);
        },
        error_callback: (err) => {
          const handlers = codeHandlers.current;
          codeHandlers.current = null;
          if (!handlers) return;
          const type = err?.type || '';
          if (type === 'popup_closed' || type === 'popup_failed_to_open') {
            handlers.reject(Object.assign(new Error('Google sign-in was cancelled.'), { cancelled: true }));
            return;
          }
          handlers.reject(new Error(err?.message || 'Google sign-in failed.'));
        },
      });
      codeClient.__clientId = clientId;
    }

    codeClient.requestCode();
  });
}

export function disableGsiAutoSelect() {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}
