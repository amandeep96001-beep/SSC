import { notifyReminder } from '@/shared/utils/appToast';
import {
  loadReminders,
  markReminderFired,
  todayISO,
  notificationPermission,
  type StudyReminder,
} from './remindersStorage';

const CHECK_MS = 15000;
let timerId: number | null = null;
let started = false;

interface TimeParts {
  dateISO: string;
  timeHM: string;
  weekday: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function nowParts(d: Date = new Date()): TimeParts {
  return {
    dateISO: todayISO(d),
    timeHM: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    weekday: d.getDay(), // 0 Sun … 6 Sat
  };
}

function fireKeyFor(reminder: StudyReminder, dateISO: string): string {
  return `${reminder.id}:${dateISO}:${reminder.time}`;
}

function isDue(reminder: StudyReminder, { dateISO, timeHM, weekday }: TimeParts): boolean {
  if (!reminder?.enabled || !reminder.time) return false;
  if (reminder.time !== timeHM) return false;

  if (reminder.repeat === 'once') {
    return reminder.date === dateISO;
  }
  if (reminder.repeat === 'weekdays') {
    return weekday >= 1 && weekday <= 5;
  }
  // daily
  return true;
}

function fireReminder(reminder: StudyReminder, key: string): void {
  markReminderFired(reminder.id, key);
  notifyReminder({
    title: reminder.title || 'Study session',
    body: reminder.message || 'Your study time is here. Open ExamPrep and start.',
    tag: `ssc-reminder-${reminder.id}`,
  });
  window.dispatchEvent(
    new CustomEvent('ssc-reminder-fired', { detail: { id: reminder.id, title: reminder.title } })
  );
}

export function checkRemindersNow(): void {
  const parts = nowParts();
  const list = loadReminders();
  for (const reminder of list) {
    if (!isDue(reminder, parts)) continue;
    const key = fireKeyFor(reminder, parts.dateISO);
    if (reminder.lastFiredKey === key) continue;
    fireReminder(reminder, key);
  }
}

export function startReminderScheduler(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  checkRemindersNow();
  timerId = window.setInterval(checkRemindersNow, CHECK_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkRemindersNow();
  });
  window.addEventListener('focus', checkRemindersNow);
  window.addEventListener('ssc-reminders-changed', checkRemindersNow);
}

export function stopReminderScheduler(): void {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
  started = false;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return notificationPermission();
  }
}
