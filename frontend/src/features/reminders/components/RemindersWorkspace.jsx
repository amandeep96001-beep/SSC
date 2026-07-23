import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  Check,
  X,
} from 'lucide-react';
import { APP_NAME } from '@/shared/brand';
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

const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'once', label: 'Once' },
];

export function RemindersWorkspace() {
  const [reminders, setReminders] = useState(() => loadRemindersLocal());
  const [form, setForm] = useState(EMPTY_FORM);
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
    if (result === 'granted') {
      showAppToast('You’ll get desktop alerts at study time, plus email reminders.', {
        variant: 'success',
        title: 'Notifications enabled',
      });
    } else if (result === 'denied') {
      showAppToast('Desktop alerts are blocked. You’ll still receive email reminders.', {
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
        `Reminder saved for ${formatTimeLabel(form.time)}.`,
        { variant: 'success', title: 'Reminder set' }
      );
      if (notificationPermission() === 'default') enableNotifications();
    } catch {
      showAppToast('Could not save reminder. Please try again.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await toggleReminderApi(id, !enabled);
      setReminders(loadRemindersLocal());
    } catch {
      showAppToast('Could not update reminder.', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminderApi(id);
      setReminders(loadRemindersLocal());
      showAppToast('Reminder removed.', { variant: 'info', durationMs: 1800 });
    } catch {
      showAppToast('Could not delete reminder.', { variant: 'error' });
    }
  };

  const activeCount = reminders.filter((r) => r.enabled).length;
  const isEmpty = !loading && reminders.length === 0 && !showForm;

  return (
    <div className="study-workspace reminders-workspace">
      <div className="workspace-header-sticky">
        <div className="page-header reminders-page-header">
          <div className="page-header__title">
            <p className="today-focus__eyebrow">{APP_NAME} · Reminders</p>
            <h1>Study reminders</h1>
            <p className="section-header-sub">
              We’ll email you at the set time — even when the app is closed.
            </p>
          </div>
          <div className="page-header__actions">
            <button
              type="button"
              className={`btn-add${showForm ? ' btn-add--ghost' : ''}`}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content reminders-scroll">
        {showForm && (
          <form className="reminders-form" onSubmit={handleCreate}>
            <label className="reminders-field">
              <span>Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Morning Quant practice"
                maxLength={80}
                autoFocus
              />
            </label>
            <label className="reminders-field">
              <span>Note <em>optional</em></span>
              <input
                type="text"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="20 min — ratios & percentages"
                maxLength={140}
              />
            </label>

            <div className="reminders-form__grid">
              <label className="reminders-field">
                <span>Time</span>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </label>
              {form.repeat === 'once' && (
                <label className="reminders-field">
                  <span>Date</span>
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

            <div className="reminders-field">
              <span>Repeat</span>
              <div className="reminders-seg" role="group" aria-label="Repeat">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`reminders-seg__btn${form.repeat === opt.value ? ' is-on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, repeat: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-add reminders-save" disabled={saving}>
              <Check size={16} />
              {saving ? 'Saving…' : 'Save reminder'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="reminders-loading" aria-busy="true">
            <div className="reminders-loading__line" />
            <div className="reminders-loading__line" />
            <div className="reminders-loading__line reminders-loading__line--short" />
          </div>
        ) : isEmpty ? (
          <div className="reminders-empty">
            <Clock size={22} strokeWidth={1.75} aria-hidden="true" />
            <h2>No reminders yet</h2>
            <p>Add one study time you can stick to.</p>
            <button type="button" className="btn-add" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add reminder
            </button>
          </div>
        ) : (
          <section className="reminders-agenda" aria-label="Your reminders">
            <div className="reminders-agenda__head">
              <h2>Upcoming</h2>
              <span>{activeCount} on</span>
            </div>
            <ul className="reminders-list">
              {reminders.map((r) => (
                <li key={r.id} className={`reminders-item${r.enabled ? '' : ' is-off'}`}>
                  <div className="reminders-item__when">
                    <time dateTime={r.time}>{formatTimeLabel(r.time)}</time>
                    <span>{repeatLabel(r.repeat)}</span>
                  </div>
                  <div className="reminders-item__main">
                    <h3>{r.title}</h3>
                    {r.message ? <p>{r.message}</p> : null}
                    {r.repeat === 'once' && r.date ? (
                      <span className="reminders-item__date">
                        <CalendarDays size={12} /> {r.date}
                      </span>
                    ) : null}
                    {!r.enabled ? <span className="reminders-item__paused">Paused</span> : null}
                  </div>
                  <div className="reminders-item__side">
                    <button
                      type="button"
                      className={`reminders-switch${r.enabled ? ' is-on' : ''}`}
                      onClick={() => handleToggle(r.id, r.enabled)}
                      aria-pressed={r.enabled}
                      aria-label={r.enabled ? 'Pause reminder' : 'Resume reminder'}
                    >
                      <span className="reminders-switch__knob" />
                    </button>
                    <button
                      type="button"
                      className="reminders-item__del"
                      onClick={() => handleDelete(r.id)}
                      aria-label="Delete reminder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="reminders-note">
          Email + desktop alert at reminder time
        </p>
      </div>
    </div>
  );
}
