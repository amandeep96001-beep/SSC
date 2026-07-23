import { APP_NAME } from '@/shared/brand';

const TOAST_ID = 'examprep-app-toast';
let toastTimer = null;
let hideTimer = null;

const ICONS = {
  success: '✓',
  error: '!',
  warn: '⚠',
  info: 'i',
  reminder: 'EP',
};

const LABELS = {
  success: 'Success',
  error: 'Error',
  warn: 'Notice',
  info: 'Info',
  reminder: APP_NAME,
};

function notificationIconUrl() {
  try {
    return new URL('/notification-icon.png', window.location.origin).href;
  } catch {
    return '/notification-icon.png';
  }
}

function formatReminderBody(title, body) {
  const name = String(title || '').trim();
  const detail = String(body || '').trim();
  const fallback = 'Your study time is here. Open ExamPrep and start.';
  if (name && detail && name.toLowerCase() !== detail.toLowerCase()) {
    return `${name}\n${detail}`;
  }
  if (detail) return detail;
  if (name) return `${name}\n${fallback}`;
  return fallback;
}

/**
 * Lightweight floating toast matching ExamPrep UI.
 * @param {string} message
 * @param {{ variant?: 'info'|'warn'|'error'|'success'|'reminder', durationMs?: number, title?: string }} [opts]
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

/**
 * System notification (OS banner) when permission is granted.
 * Title is always the product name so it doesn't look like a raw site URL.
 */
export function showBrowserNotification({ title, body, tag } = {}) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const icon = notificationIconUrl();
    const n = new Notification(title || APP_NAME, {
      body: body || '',
      icon,
      badge: icon,
      tag: tag || `ssc-notify-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
    });
    n.onclick = () => {
      try {
        window.focus?.();
      } catch { /* ignore */ }
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Reminder alert: OS notification + top toast.
 */
export function notifyReminder({ title, body, tag } = {}) {
  const toastTitle = String(title || '').trim() || 'Study reminder';
  const toastBody = String(body || '').trim()
    || 'Your study time is here. Open ExamPrep and start.';
  const shown = showBrowserNotification({
    title: APP_NAME,
    body: formatReminderBody(toastTitle, toastBody),
    tag: tag || 'ssc-study-reminder',
  });
  showAppToast(toastBody, {
    variant: 'reminder',
    title: toastTitle === 'Study reminder' ? APP_NAME : toastTitle,
    durationMs: 12000,
  });
  return shown;
}
