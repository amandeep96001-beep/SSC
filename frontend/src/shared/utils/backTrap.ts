let installed = false;
let handler: (() => boolean | void) | null = null;
let lastExitPromptAt = 0;

const TOAST_ID = 'ssc-exit-back-toast';
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
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

export function trapHistory(): void {
  try {
    window.history.pushState({ appTrap: true, t: Date.now() }, '', window.location.href);
  } catch {
    /* ignore quota / security errors */
  }
}

function onPopState(): void {
  trapHistory();

  if (typeof handler === 'function') {
    const consumed = handler();
    if (consumed) {
      lastExitPromptAt = 0;
      document.getElementById(TOAST_ID)?.remove();
      return;
    }
  }

  const now = Date.now();
  if (now - lastExitPromptAt < 2000) {
    lastExitPromptAt = 0;
    showToast('Press home to leave the app');
    return;
  }

  lastExitPromptAt = now;
  showToast('Press back again to exit');
}

export function installBackTrap(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  trapHistory();
  trapHistory();

  window.addEventListener('popstate', onPopState);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      trapHistory();
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) trapHistory();
  });
}

export function setBackHandler(fn?: (() => boolean | void) | null): void {
  handler = typeof fn === 'function' ? fn : null;
}
