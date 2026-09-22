import { APP_NAME } from '@/shared/brand';
import { HttpError, errorMessage } from '@/types/app';

const TOAST_ID = 'examprep-app-toast';
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export type ToastVariant = 'success' | 'error' | 'warn' | 'info' | 'reminder';

export interface AppToastAction {
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface AppToastOptions {
  variant?: ToastVariant;
  durationMs?: number;
  title?: string;
  actions?: AppToastAction[];
}

export interface BrowserNotificationPayload {
  title?: string;
  body?: string;
  tag?: string;
}

const ICONS: Record<ToastVariant, string> = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/><polyline points="20 6 9 17 4 12" style="display:none"/></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warn: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  reminder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
};

// Fix success icon SVG
ICONS.success = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

const LABELS: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  warn: 'Attention',
  info: 'Information',
  reminder: APP_NAME,
};

function notificationIconUrl(): string {
  try {
    return new URL('/notification-icon.png', window.location.origin).href;
  } catch {
    return '/notification-icon.png';
  }
}

function formatReminderBody(title: unknown, body: unknown): string {
  const name = String(title || '').trim();
  const detail = String(body || '').trim();
  const fallback = `Your study time is here. Open ${APP_NAME} and start.`;
  if (name && detail && name.toLowerCase() !== detail.toLowerCase()) {
    return `${name}\n${detail}`;
  }
  if (detail) return detail;
  if (name) return `${name}\n${fallback}`;
  return fallback;
}

function dismissToast(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove('app-toast--in');
  el.classList.add('app-toast--out');
  setTimeout(() => {
    el.remove();
  }, 280);
}

/**
 * Custom floating toast card matching the user's reference design.
 */
export function showAppToast(message: string, opts: AppToastOptions = {}): void {
  const { variant = 'info', durationMs = 4500, title, actions } = opts;
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

  const hasActions = Array.isArray(actions) && actions.length > 0;
  el.className = `app-toast app-toast--${variant} app-toast--in${hasActions ? ' app-toast--actions' : ''}`;
  el.innerHTML = `
    <div class="app-toast__icon-box">
      ${ICONS[variant] || ICONS.info}
    </div>
    <div class="app-toast__content">
      <div class="app-toast__title">${title || LABELS[variant] || 'Notice'}</div>
      <div class="app-toast__msg"></div>
      ${hasActions ? '<div class="app-toast__actions"></div>' : ''}
    </div>
    <button class="app-toast__close" aria-label="Close notification">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  const msgEl = el.querySelector('.app-toast__msg');
  if (msgEl) msgEl.textContent = message;

  const closeBtn = el.querySelector('.app-toast__close');
  if (closeBtn instanceof HTMLElement) {
    closeBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (toastTimer) clearTimeout(toastTimer);
      dismissToast(el);
    };
  }

  if (hasActions) {
    const row = el.querySelector('.app-toast__actions');
    if (row) {
      for (const action of actions!) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `app-toast__action${action.primary ? ' app-toast__action--primary' : ''}`;
        btn.textContent = action.label;
        btn.onclick = (e: MouseEvent) => {
          e.stopPropagation();
          if (toastTimer) clearTimeout(toastTimer);
          dismissToast(el);
          action.onClick?.();
        };
        row.appendChild(btn);
      }
    }
  }

  toastTimer = setTimeout(() => {
    dismissToast(el);
  }, hasActions ? Math.max(durationMs, 7000) : durationMs);
}

/** Guest gate: please login + Login / Continue browsing actions. */
export function showLoginPromptToast(opts: {
  message?: string;
  onLogin: () => void;
  onContinue?: () => void;
}): void {
  showAppToast(opts.message || 'Please login to use this feature.', {
    variant: 'warn',
    title: 'Login required',
    durationMs: 8000,
    actions: [
      { label: 'Continue browsing', onClick: opts.onContinue },
      { label: 'Login', onClick: opts.onLogin, primary: true },
    ],
  });
}

/**
 * System notification (OS banner) when permission is granted.
 * Title is always the product name so it doesn't look like a raw site URL.
 */
export function showBrowserNotification({ title, body, tag }: BrowserNotificationPayload = {}): boolean {
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
export function notifyReminder({ title, body, tag }: BrowserNotificationPayload = {}): boolean {
  const toastTitle = String(title || '').trim() || 'Study reminder';
  const toastBody = String(body || '').trim()
    || `Your study time is here. Open ${APP_NAME} and start.`;
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

/** Prefer this for API failures — surfaces code + requestId for support. */
export function showApiErrorToast(err: unknown, fallback = 'Something went wrong.'): void {
  const message = errorMessage(err) || fallback;
  let title = 'Error';
  if (err instanceof HttpError && err.code) {
    title = err.code.replace(/_/g, ' ');
  }
  const suffix =
    err instanceof HttpError && err.requestId
      ? ` (ref: ${err.requestId.slice(0, 8)})`
      : '';
  showAppToast(`${message}${suffix}`, { variant: 'error', title, durationMs: 6500 });
}
