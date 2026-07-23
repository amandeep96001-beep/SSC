/** Google Identity Services — preload once; ID-token (mobile-friendly) + auth-code popup. */

let scriptPromise = null;
let initializeStarted = false;
let codeClient = null;
let credentialHandlers = { current: null };

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

/** Call on auth screen mount so click keeps the user-gesture for popups. */
export function preloadGsi() {
  return loadGsiScript().catch(() => null);
}

function wireIdCallback(clientId) {
  const gsi = window.google?.accounts?.id;
  if (!gsi) throw new Error('Google Identity Services unavailable');

  gsi.initialize({
    client_id: clientId,
    callback: (response) => {
      const handlers = credentialHandlers.current;
      credentialHandlers.current = null;
      if (!handlers) return;
      if (response?.credential) {
        handlers.resolve(response.credential);
        return;
      }
      handlers.reject(new Error('Google sign-in failed.'));
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  initializeStarted = true;
  return gsi;
}

/** Ensure accounts.id is initialized (used for disableAutoSelect on logout). */
export async function ensureGsiInitialized(clientId) {
  await loadGsiScript();
  return wireIdCallback(clientId);
}

/**
 * ID-token via One Tap / FedCM prompt — works better than popups on many phones.
 */
export async function requestGoogleCredential(clientId) {
  await loadGsiScript();
  const gsi = wireIdCallback(clientId);

  return new Promise((resolve, reject) => {
    credentialHandlers.current = { resolve, reject };
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      credentialHandlers.current = null;
      reject(err);
    };

    const ok = (credential) => {
      if (settled) return;
      settled = true;
      credentialHandlers.current = null;
      resolve(credential);
    };

    credentialHandlers.current = {
      resolve: ok,
      reject: fail,
    };

    try {
      gsi.prompt((notification) => {
        if (settled) return;
        const skipped = notification?.isNotDisplayed?.()
          || notification?.isSkippedMoment?.()
          || notification?.isDismissedMoment?.();
        if (skipped) {
          fail(Object.assign(new Error('Google prompt unavailable'), {
            promptUnavailable: true,
            cancelled: notification?.isDismissedMoment?.() === true,
          }));
        }
      });
    } catch (err) {
      fail(err instanceof Error ? err : new Error('Google sign-in failed.'));
    }
  });
}

/**
 * Render official GIS button into `el` (most reliable on mobile).
 * Returns a cleanup function.
 */
export async function mountGoogleButton(el, clientId, { onCredential, onError, width } = {}) {
  if (!el || !clientId) return () => {};
  await loadGsiScript();
  wireIdCallback(clientId);

  credentialHandlers.current = {
    resolve: (credential) => onCredential?.(credential),
    reject: (err) => {
      if (!err?.cancelled) onError?.(err);
    },
  };

  // Re-bind initialize so button uses the same handlers
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response?.credential) {
        onCredential?.(response.credential);
        return;
      }
      onError?.(new Error('Google sign-in failed.'));
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  initializeStarted = true;

  el.innerHTML = '';
  const w = Math.max(240, Math.min(width || el.clientWidth || 320, 400));
  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: w,
    logo_alignment: 'left',
  });

  return () => {
    el.innerHTML = '';
  };
}

/**
 * Open Google's auth-code popup and resolve with the authorization code.
 * Backend exchanges it via redirect_uri=postmessage.
 * Prefer calling after preloadGsi() so the click gesture is preserved.
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

/**
 * Mobile-safe sign-in: try ID credential prompt, then auth-code popup.
 * @returns {Promise<{ code?: string, credential?: string }>}
 */
export async function signInWithGoogle(clientId) {
  const mobile = typeof navigator !== 'undefined'
    && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && window.innerWidth < 900));

  if (mobile) {
    try {
      const credential = await requestGoogleCredential(clientId);
      return { credential };
    } catch (err) {
      if (err?.cancelled) throw err;
      // Fall through to code popup / button
    }
  }

  try {
    const code = await requestGoogleAuthCode(clientId);
    return { code };
  } catch (err) {
    if (!mobile) throw err;
    // Last resort on mobile: credential prompt again after popup fail
    const credential = await requestGoogleCredential(clientId);
    return { credential };
  }
}

export function disableGsiAutoSelect() {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}
