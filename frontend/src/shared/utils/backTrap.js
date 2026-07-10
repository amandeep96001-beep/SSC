/**
 * Keeps Android/browser Back inside the SPA.
 * Install once at app boot — before React — so the first Back never leaves the page.
 */

let installed = false;
let handler = null;
let lastExitPromptAt = 0;

const TOAST_ID = 'ssc-exit-back-toast';
let toastTimer = null;

function showToast(msg) {
  let el = document.getElementById(TOAST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOAST_ID;
    el.className = 'exit-back-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    document.getElementById(TOAST_ID)?.remove();
    lastExitPromptAt = 0;
  }, 2200);
}

export function trapHistory() {
  try {
    window.history.pushState({ appTrap: true, t: Date.now() }, '', window.location.href);
  } catch {
    /* ignore quota / security errors */
  }
}

function onPopState() {
  // Re-arm FIRST — never let the document unload / leave the app
  trapHistory();

  if (typeof handler === 'function') {
    const consumed = handler();
    if (consumed) {
      lastExitPromptAt = 0;
      document.getElementById(TOAST_ID)?.remove();
      return;
    }
  }

  // Root of app — prompt only; still do NOT leave the page
  const now = Date.now();
  if (now - lastExitPromptAt < 2000) {
    lastExitPromptAt = 0;
    showToast('Press home to leave the app');
    return;
  }

  lastExitPromptAt = now;
  showToast('Press back again to exit');
}

/**
 * Call once from main.jsx
 */
export function installBackTrap() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Two entries so the first system Back always hits popstate inside this page
  trapHistory();
  trapHistory();

  window.addEventListener('popstate', onPopState);

  // Re-arm if the tab/WebView becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      trapHistory();
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) trapHistory();
  });
}

/**
 * Dashboard registers how to handle in-app back.
 * Return true if back was handled (section change / close sidebar / etc).
 */
export function setBackHandler(fn) {
  handler = typeof fn === 'function' ? fn : null;
}
