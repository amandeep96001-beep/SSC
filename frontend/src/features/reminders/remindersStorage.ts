import { apiService } from '@/shared/services/apiService';
import { isRecord, type StudyReminder } from '@/types/app';

export type { StudyReminder };

const LOCAL_KEY = 'ssc_study_reminders_v1';
const PERMISSION_PROMPTED_KEY = 'ssc_reminders_perm_prompted';

export interface ReminderPayload {
  title?: string;
  message?: string;
  time?: string;
  date?: string | null;
  repeat?: string;
  timezone?: string;
  enabled?: boolean;
}

export interface ReminderNotification {
  id?: string;
  title?: string;
  body?: string;
  read?: boolean;
  createdAt?: string;
}

function parseList(raw: string | null): StudyReminder[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as StudyReminder[] : [];
  } catch {
    return [];
  }
}

function asReminder(value: unknown): StudyReminder | null {
  if (!isRecord(value) || value.id == null) return null;
  return value as unknown as StudyReminder;
}

function emitChanged(): void {
  window.dispatchEvent(new CustomEvent('ssc-reminders-changed'));
}

export function loadRemindersLocal(): StudyReminder[] {
  return parseList(localStorage.getItem(LOCAL_KEY));
}

export function saveRemindersLocal(list: StudyReminder[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list || []));
  emitChanged();
}

export async function fetchReminders(): Promise<StudyReminder[]> {
  try {
    const res = await apiService.get('/reminders');
    const rows = Array.isArray(res?.data)
      ? res.data.map(asReminder).filter((r): r is StudyReminder => Boolean(r))
      : [];
    saveRemindersLocal(rows);
    return rows;
  } catch {
    return loadRemindersLocal();
  }
}

export async function createReminderApi(payload: ReminderPayload): Promise<StudyReminder | unknown> {
  const res = await apiService.post('/reminders', {
    title: payload.title,
    message: payload.message || '',
    time: payload.time,
    date: payload.date || null,
    repeat: payload.repeat || 'daily',
    timezone: payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    enabled: true,
  });
  const row = asReminder(res?.data);
  if (row) {
    const next = [row, ...loadRemindersLocal().filter((r) => r.id !== row.id)];
    saveRemindersLocal(next);
  }
  return row || res?.data;
}

export async function updateReminderApi(id: string, patch: Partial<ReminderPayload>): Promise<StudyReminder | unknown> {
  const res = await apiService.patch(`/reminders/${id}`, patch);
  const row = asReminder(res?.data);
  if (row) {
    const next = loadRemindersLocal().map((r) => (r.id === id ? row : r));
    saveRemindersLocal(next);
  }
  return row || res?.data;
}

export async function deleteReminderApi(id: string): Promise<void> {
  await apiService.delete(`/reminders/${id}`);
  saveRemindersLocal(loadRemindersLocal().filter((r) => r.id !== id));
}

export async function toggleReminderApi(id: string, enabled: boolean): Promise<StudyReminder | unknown> {
  return updateReminderApi(id, { enabled });
}

export async function fetchNotifications({ unreadOnly = false }: { unreadOnly?: boolean } = {}): Promise<ReminderNotification[]> {
  const q = unreadOnly ? '?unread=1' : '';
  const res = await apiService.get(`/reminders/notifications/list${q}`);
  return Array.isArray(res?.data) ? res.data as ReminderNotification[] : [];
}

export async function markNotificationsReadApi(ids?: string[]): Promise<void> {
  await apiService.post('/reminders/notifications/read', ids ? { ids } : {});
}

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTimeLabel(time: string | null | undefined): string {
  if (!time) return '';
  const [hh, mm] = String(time).split(':').map(Number);
  if (Number.isNaN(hh)) return time;
  const d = new Date();
  d.setHours(hh, mm || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function repeatLabel(repeat: string | null | undefined): string {
  if (repeat === 'once') return 'Once';
  if (repeat === 'weekdays') return 'Mon–Fri';
  return 'Every day';
}

export function wasPermissionPrompted(): boolean {
  return localStorage.getItem(PERMISSION_PROMPTED_KEY) === '1';
}

export function setPermissionPrompted(): void {
  localStorage.setItem(PERMISSION_PROMPTED_KEY, '1');
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/** @deprecated local-only helpers kept for scheduler fallback */
export function loadReminders(): StudyReminder[] {
  return loadRemindersLocal();
}

export function saveReminders(list: StudyReminder[]): void {
  saveRemindersLocal(list);
}

export function markReminderFired(id: string, key: string): void {
  const next = loadRemindersLocal().map((r) =>
    r.id === id ? { ...r, lastFiredKey: key, lastFiredAt: Date.now() } : r
  );
  saveRemindersLocal(next);
}

export function createReminderId(): string {
  return `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createReminder(payload: ReminderPayload): StudyReminder {
  return {
    id: createReminderId(),
    title: String(payload.title || 'Study time').trim() || 'Study time',
    message: String(payload.message || '').trim(),
    time: payload.time || '09:00',
    date: payload.repeat === 'once' ? (payload.date || todayISO()) : null,
    repeat: ['once', 'daily', 'weekdays'].includes(payload.repeat || '') ? payload.repeat : 'daily',
    enabled: true,
    lastFiredKey: null,
    createdAt: Date.now(),
  };
}
