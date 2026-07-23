import { apiService } from '@/shared/services/apiService';

const LOCAL_KEY = 'ssc_study_reminders_v1';
const PERMISSION_PROMPTED_KEY = 'ssc_reminders_perm_prompted';

function parseList(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emitChanged() {
  window.dispatchEvent(new CustomEvent('ssc-reminders-changed'));
}

export function loadRemindersLocal() {
  return parseList(localStorage.getItem(LOCAL_KEY));
}

export function saveRemindersLocal(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list || []));
  emitChanged();
}

export async function fetchReminders() {
  try {
    const res = await apiService.get('/reminders');
    const rows = Array.isArray(res?.data) ? res.data : [];
    saveRemindersLocal(rows);
    return rows;
  } catch {
    return loadRemindersLocal();
  }
}

export async function createReminderApi(payload) {
  const res = await apiService.post('/reminders', {
    title: payload.title,
    message: payload.message || '',
    time: payload.time,
    date: payload.date || null,
    repeat: payload.repeat || 'daily',
    timezone: payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    enabled: true,
  });
  const row = res?.data;
  if (row) {
    const next = [row, ...loadRemindersLocal().filter((r) => r.id !== row.id)];
    saveRemindersLocal(next);
  }
  return row;
}

export async function updateReminderApi(id, patch) {
  const res = await apiService.patch(`/reminders/${id}`, patch);
  const row = res?.data;
  if (row) {
    const next = loadRemindersLocal().map((r) => (r.id === id ? row : r));
    saveRemindersLocal(next);
  }
  return row;
}

export async function deleteReminderApi(id) {
  await apiService.delete(`/reminders/${id}`);
  saveRemindersLocal(loadRemindersLocal().filter((r) => r.id !== id));
}

export async function toggleReminderApi(id, enabled) {
  return updateReminderApi(id, { enabled });
}

export async function fetchNotifications({ unreadOnly = false } = {}) {
  const q = unreadOnly ? '?unread=1' : '';
  const res = await apiService.get(`/reminders/notifications/list${q}`);
  return Array.isArray(res?.data) ? res.data : [];
}

export async function markNotificationsReadApi(ids) {
  await apiService.post('/reminders/notifications/read', ids ? { ids } : {});
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

/** @deprecated local-only helpers kept for scheduler fallback */
export function loadReminders() {
  return loadRemindersLocal();
}

export function saveReminders(list) {
  saveRemindersLocal(list);
}

export function createReminderId() {
  return `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createReminder(payload) {
  return {
    id: createReminderId(),
    title: String(payload.title || 'Study time').trim() || 'Study time',
    message: String(payload.message || '').trim(),
    time: payload.time || '09:00',
    date: payload.repeat === 'once' ? (payload.date || todayISO()) : null,
    repeat: ['once', 'daily', 'weekdays'].includes(payload.repeat) ? payload.repeat : 'daily',
    enabled: true,
    lastFiredKey: null,
    createdAt: Date.now(),
  };
}
