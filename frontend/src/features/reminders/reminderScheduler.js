import { showAppToast } from '@/shared/utils/appToast';
import {
  loadReminders,
  markReminderFired,
  todayISO,
  notificationPermission,
} from './remindersStorage';

const CHECK_MS = 20000;
let timerId = null;
let started = false;

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowParts(d = new Date()) {
  return {
    dateISO: todayISO(d),
    timeHM: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    weekday: d.getDay(), // 0 Sun … 6 Sat
  };
}

function fireKeyFor(reminder, dateISO) {
  return `${reminder.id}:${dateISO}:${reminder.time}`;
}

function isDue(reminder, { dateISO, timeHM, weekday }) {
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

function showBrowserNotification(reminder) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(reminder.title || 'Study time', {
      body: reminder.message || 'Your study reminder is here. Open ExamPrep and start.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `ssc-reminder-${reminder.id}`,
      renotify: true,
    });
    n.onclick = () => {
      window.focus?.();
      n.close();
    };
  } catch {
    /* ignore — some browsers block without service worker */
  }
}

function fireReminder(reminder, key) {
  markReminderFired(reminder.id, key);
  showBrowserNotification(reminder);
  showAppToast(reminder.message || 'Time to study — you set this reminder.', {
    variant: 'info',
    title: reminder.title || 'Study reminder',
    durationMs: 8000,
  });
  window.dispatchEvent(
    new CustomEvent('ssc-reminder-fired', { detail: { id: reminder.id, title: reminder.title } })
  );
}

export function checkRemindersNow() {
  const parts = nowParts();
  const list = loadReminders();
  for (const reminder of list) {
    if (!isDue(reminder, parts)) continue;
    const key = fireKeyFor(reminder, parts.dateISO);
    if (reminder.lastFiredKey === key) continue;
    fireReminder(reminder, key);
  }
}

export function startReminderScheduler() {
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

export function stopReminderScheduler() {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
  started = false;
}

export async function requestNotificationPermission() {
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
