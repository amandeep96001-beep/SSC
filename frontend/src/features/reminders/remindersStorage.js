const STORAGE_KEY = 'ssc_study_reminders_v1';
const PERMISSION_PROMPTED_KEY = 'ssc_reminders_perm_prompted';

function parseList(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadReminders() {
  return parseList(localStorage.getItem(STORAGE_KEY));
}

export function saveReminders(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
  window.dispatchEvent(new CustomEvent('ssc-reminders-changed'));
}

export function createReminderId() {
  return `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createReminder({
  title,
  message = '',
  time,
  date = null,
  repeat = 'daily',
  enabled = true,
}) {
  return {
    id: createReminderId(),
    title: String(title || 'Study time').trim() || 'Study time',
    message: String(message || '').trim(),
    time: time || '09:00',
    date: repeat === 'once' ? (date || todayISO()) : null,
    repeat: ['once', 'daily', 'weekdays'].includes(repeat) ? repeat : 'daily',
    enabled: Boolean(enabled),
    lastFiredKey: null,
    createdAt: Date.now(),
  };
}

export function upsertReminder(reminder) {
  const list = loadReminders();
  const idx = list.findIndex((r) => r.id === reminder.id);
  if (idx >= 0) list[idx] = reminder;
  else list.unshift(reminder);
  saveReminders(list);
  return list;
}

export function deleteReminder(id) {
  const list = loadReminders().filter((r) => r.id !== id);
  saveReminders(list);
  return list;
}

export function toggleReminder(id, enabled) {
  const list = loadReminders().map((r) =>
    r.id === id ? { ...r, enabled: enabled ?? !r.enabled } : r
  );
  saveReminders(list);
  return list;
}

export function markReminderFired(id, fireKey) {
  const list = loadReminders().map((r) =>
    r.id === id ? { ...r, lastFiredKey: fireKey } : r
  );
  saveReminders(list);
  return list;
}

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTimeLabel(time) {
  if (!time) return '';
  const [hh, mm] = String(time).split(':').map(Number);
  if (Number.isNaN(hh)) return time;
  const d = new Date();
  d.setHours(hh, mm || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function repeatLabel(repeat) {
  if (repeat === 'once') return 'Once';
  if (repeat === 'weekdays') return 'Mon–Fri';
  return 'Every day';
}

export function wasPermissionPrompted() {
  return localStorage.getItem(PERMISSION_PROMPTED_KEY) === '1';
}

export function setPermissionPrompted() {
  localStorage.setItem(PERMISSION_PROMPTED_KEY, '1');
}

export function notificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
