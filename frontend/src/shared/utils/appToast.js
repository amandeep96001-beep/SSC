const TOAST_ID = 'examprep-app-toast';
let toastTimer = null;
let hideTimer = null;

const ICONS = {
  success: '✓',
  error: '!',
  warn: '⚠',
  info: 'i',
};

const LABELS = {
  success: 'Success',
  error: 'Error',
  warn: 'Notice',
  info: 'Info',
};

/**
 * Lightweight floating toast matching ExamPrep UI.
 * @param {string} message
 * @param {{ variant?: 'info'|'warn'|'error'|'success', durationMs?: number, title?: string }} [opts]
 */
export function showAppToast(message, opts = {}) {
  const { variant = 'warn', durationMs = 4200, title } = opts;
  let el = document.getElementById(TOAST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOAST_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }

  if (toastTimer) clearTimeout(toastTimer);
  if (hideTimer) clearTimeout(hideTimer);

  el.className = `app-toast app-toast--${variant} app-toast--in`;
  el.innerHTML = `
    <span class="app-toast__icon" aria-hidden="true">${ICONS[variant] || ICONS.info}</span>
    <span class="app-toast__body">
      <span class="app-toast__title">${title || LABELS[variant] || 'Notice'}</span>
      <span class="app-toast__msg"></span>
    </span>
  `;
  el.querySelector('.app-toast__msg').textContent = message;

  toastTimer = setTimeout(() => {
    el.classList.remove('app-toast--in');
    el.classList.add('app-toast--out');
    hideTimer = setTimeout(() => {
      document.getElementById(TOAST_ID)?.remove();
    }, 280);
  }, durationMs);
}
