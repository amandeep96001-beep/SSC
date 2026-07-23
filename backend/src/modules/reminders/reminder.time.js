/**
 * Timezone helpers for reminder cron (no extra date libs).
 */

export function getZonedParts(date = new Date(), timeZone = 'Asia/Kolkata') {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const map = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = Number(map.hour);
  // Some engines use 24:00 for midnight
  if (hour === 24) hour = 0;
  return {
    dateISO: `${map.year}-${map.month}-${map.day}`,
    timeHM: `${String(hour).padStart(2, '0')}:${map.minute}`,
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

export function isReminderDue(reminder, parts) {
  if (!reminder?.enabled || !reminder.time) return false;
  if (reminder.time !== parts.timeHM) return false;

  if (reminder.repeat === 'once') {
    return reminder.date === parts.dateISO;
  }
  if (reminder.repeat === 'weekdays') {
    return parts.weekday >= 1 && parts.weekday <= 5;
  }
  return true;
}

export function fireKeyFor(reminder, dateISO) {
  return `${dateISO}:${reminder.time}`;
}

export function normalizeTime(time) {
  const m = String(time || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
