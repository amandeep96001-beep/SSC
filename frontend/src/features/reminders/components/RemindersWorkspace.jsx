import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  Repeat,
  Check,
  BellOff,
  Sparkles,
  Mail,
} from 'lucide-react';
import {
  fetchReminders,
  createReminderApi,
  deleteReminderApi,
  toggleReminderApi,
  formatTimeLabel,
  repeatLabel,
  todayISO,
  notificationPermission,
  setPermissionPrompted,
  loadRemindersLocal,
} from '../remindersStorage';
import { requestNotificationPermission } from '../reminderScheduler';
import { showAppToast } from '@/shared/utils/appToast';
import '../reminders.css';

const EMPTY_FORM = {
  title: '',
  message: '',
  time: '07:00',
  date: todayISO(),
  repeat: 'daily',
};

export function RemindersWorkspace() {
  const [reminders, setReminders] = useState(() => loadRemindersLocal());
  const [form, setForm] = useState(EMPTY_FORM);
  const [perm, setPerm] = useState(() => notificationPermission());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchReminders();
      setReminders(rows);
    } finally {
      setLoading(false);
      setPerm(notificationPermission());
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => setReminders(loadRemindersLocal());
    window.addEventListener('ssc-reminders-changed', onChange);
    window.addEventListener('ssc-reminder-fired', onChange);
    return () => {
      window.removeEventListener('ssc-reminders-changed', onChange);
      window.removeEventListener('ssc-reminder-fired', onChange);
    };
  }, [refresh]);

  const enableNotifications = async () => {
    setPermissionPrompted();
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === 'granted') {
      showAppToast('Browser alerts on. Server cron will also email you at study time.', {
        variant: 'success',
        title: 'Reminders ready',
      });
    } else if (result === 'denied') {
      showAppToast('Browser blocked. Email reminders still work if SMTP is set.', {
        variant: 'warn',
        title: 'Permission denied',
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showAppToast('Give your reminder a short title.', { variant: 'warn' });
      return;
    }
    if (form.repeat === 'once' && !form.date) {
      showAppToast('Pick a date for a one-time reminder.', { variant: 'warn' });
      return;
    }
    setSaving(true);
    try {
      await createReminderApi(form);
      setReminders(loadRemindersLocal());
      setForm({ ...EMPTY_FORM, date: todayISO() });
      setShowForm(false);
      showAppToast(
        `Saved. Cron will notify you at ${formatTimeLabel(form.time)} (email + in-app).`,
        { variant: 'success', title: 'Reminder set' }
      );
      if (notificationPermission() === 'default') enableNotifications();
    } catch (err) {
      showAppToast(err.message || 'Could not save reminder.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await toggleReminderApi(id, !enabled);
      setReminders(loadRemindersLocal());
    } catch (err) {
      showAppToast(err.message || 'Update failed.', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminderApi(id);
      setReminders(loadRemindersLocal());
      showAppToast('Reminder removed.', { variant: 'info', durationMs: 1800 });
    } catch (err) {
      showAppToast(err.message || 'Delete failed.', { variant: 'error' });
    }
  };

  const activeCount = reminders.filter((r) => r.enabled).length;
  const upcoming = reminders.filter((r) => r.enabled);

  return (
    <div className="study-workspace reminders-workspace">
      <header className="reminders-hero">
        <div className="reminders-hero__copy">
          <p className="reminders-eyebrow">
            <Sparkles size={14} /> Study rhythm
          </p>
          <h1>Reminders</h1>
          <p className="reminders-lede">
            Set a study time. Our server cron checks every minute and notifies you by email — even if the app is closed.
          </p>
        </div>
        <div className="reminders-hero__status">
          <div className={`reminders-perm reminders-perm--${perm}`}>
            {perm === 'granted' ? <BellRing size={18} /> : <BellOff size={18} />}
            <div>
              <strong>
                {perm === 'granted' && 'Browser alerts on'}
                {perm === 'denied' && 'Browser alerts blocked'}
                {perm === 'default' && 'Browser alerts off'}
                {perm === 'unsupported' && 'Browser alerts N/A'}
              </strong>
              <span>
                <Mail size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Server cron emails you at reminder time (needs SMTP + account email).
              </span>
            </div>
            {perm !== 'granted' && perm !== 'unsupported' && (
              <button type="button" className="reminders-perm__btn" onClick={enableNotifications}>
                Enable
              </button>
            )}
          </div>
          <p className="reminders-count">
            <Bell size={14} />
            {activeCount} active · {reminders.length} total
          </p>
        </div>
      </header>

      <div className="reminders-toolbar">
        <button
          type="button"
          className={`reminders-add-toggle${showForm ? ' is-open' : ''}`}
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus size={18} />
          {showForm ? 'Close' : 'New reminder'}
        </button>
      </div>

      {showForm && (
        <form className="reminders-form" onSubmit={handleCreate}>
          <label className="reminders-field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Morning Quant practice"
              maxLength={80}
              autoFocus
            />
          </label>
          <label className="reminders-field">
            <span>Note (optional)</span>
            <input
              type="text"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="20 min — ratios & percentages"
              maxLength={140}
            />
          </label>
          <div className="reminders-form__row">
            <label className="reminders-field">
              <span>
                <Clock size={13} /> Time
              </span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
              />
            </label>
            <label className="reminders-field">
              <span>
                <Repeat size={13} /> Repeat
              </span>
              <select
                value={form.repeat}
                onChange={(e) => setForm((f) => ({ ...f, repeat: e.target.value }))}
              >
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays</option>
                <option value="once">Once</option>
              </select>
            </label>
            {form.repeat === 'once' && (
              <label className="reminders-field">
                <span>
                  <CalendarDays size={13} /> Date
                </span>
                <input
                  type="date"
                  value={form.date}
                  min={todayISO()}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </label>
            )}
          </div>
          <button type="submit" className="reminders-submit" disabled={saving}>
            <Check size={16} />
            {saving ? 'Saving…' : 'Save reminder'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="reminders-empty">
          <Bell size={28} strokeWidth={1.5} />
          <h2>Loading reminders…</h2>
        </div>
      ) : upcoming.length === 0 && reminders.length === 0 && !showForm ? (
        <div className="reminders-empty">
          <Bell size={28} strokeWidth={1.5} />
          <h2>No study reminders yet</h2>
          <p>Pick a time you can keep. The server will email you when it is time.</p>
          <button type="button" className="reminders-submit" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Create your first reminder
          </button>
        </div>
      ) : (
        <ul className="reminders-list">
          {reminders.map((r) => (
            <li key={r.id} className={`reminders-card${r.enabled ? '' : ' is-off'}`}>
              <button
                type="button"
                className={`reminders-card__toggle${r.enabled ? ' is-on' : ''}`}
                onClick={() => handleToggle(r.id, r.enabled)}
                aria-pressed={r.enabled}
                title={r.enabled ? 'Pause reminder' : 'Resume reminder'}
              >
                {r.enabled ? <BellRing size={16} /> : <BellOff size={16} />}
              </button>
              <div className="reminders-card__body">
                <div className="reminders-card__top">
                  <h3>{r.title}</h3>
                  <time dateTime={r.time}>{formatTimeLabel(r.time)}</time>
                </div>
                {r.message && <p className="reminders-card__msg">{r.message}</p>}
                <div className="reminders-card__meta">
                  <span>{repeatLabel(r.repeat)}</span>
                  {r.repeat === 'once' && r.date && <span>{r.date}</span>}
                  {!r.enabled && <span className="reminders-card__paused">Paused</span>}
                </div>
              </div>
              <button
                type="button"
                className="reminders-card__delete"
                onClick={() => handleDelete(r.id)}
                aria-label="Delete reminder"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="reminders-footnote">
        Cron runs every minute on the server. You get an email at reminder time (account email + SMTP required), plus an in-app notification when you open ExamPrep.
      </p>
    </div>
  );
}
