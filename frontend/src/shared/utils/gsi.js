/** Google Identity Services — load + initialize at most once for the page lifetime. */

const credentialHandler = { current: null };

let scriptPromise = null;
let initializeStarted = false;

export function setGsiCredentialHandler(handler) {
  credentialHandler.current = handler;
}

export function loadGsiScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('GSI requires a browser'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-examprep-gsi="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.accounts.id), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.examprepGsi = '1';
    script.onload = () => resolve(window.google.accounts.id);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google script'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function ensureGsiInitialized(clientId) {
  const gsi = await loadGsiScript();
  if (!gsi) throw new Error('Google Identity Services unavailable');

  // Set the lock before calling initialize to avoid StrictMode / remount races
  if (!initializeStarted) {
    initializeStarted = true;
    gsi.initialize({
      client_id: clientId,
      callback: (response) => {
        credentialHandler.current?.(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  return gsi;
}

export function disableGsiAutoSelect() {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}
