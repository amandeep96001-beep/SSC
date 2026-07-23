import Reminder from './reminder.model.js';
import AppNotification from './notification.model.js';
import { normalizeTime } from './reminder.time.js';
import User from '../auth/user.model.js';

function toClient(doc) {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(r._id),
    title: r.title,
    message: r.message || '',
    time: r.time,
    date: r.date || null,
    repeat: r.repeat,
    timezone: r.timezone || 'Asia/Kolkata',
    enabled: Boolean(r.enabled),
    lastFiredKey: r.lastFiredKey || null,
    lastFiredAt: r.lastFiredAt || null,
    createdAt: r.createdAt,
  };
}

export async function listReminders(req, res, next) {
  try {
    const rows = await Reminder.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', count: rows.length, data: rows.map(toClient) });
  } catch (error) {
    next(error);
  }
}

export async function createReminder(req, res, next) {
  try {
    const time = normalizeTime(req.body.time);
    if (!time) {
      return res.status(400).json({ status: 'error', message: 'Valid time (HH:mm) is required.' });
    }
    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Title is required.' });
    }
    const repeat = ['once', 'daily', 'weekdays'].includes(req.body.repeat) ? req.body.repeat : 'daily';
    const date = repeat === 'once' ? (req.body.date || null) : null;
    if (repeat === 'once' && !date) {
      return res.status(400).json({ status: 'error', message: 'Date is required for one-time reminders.' });
    }

    let email = req.user.email;
    if (!email) {
      const u = await User.findById(req.user.id).select('email').lean();
      email = u?.email || null;
    }

    const row = await Reminder.create({
      userId: req.user.id,
      username: req.user.username,
      email: email || undefined,
      title,
      message: String(req.body.message || '').trim().slice(0, 200),
      time,
      date,
      repeat,
      timezone: req.body.timezone || 'Asia/Kolkata',
      enabled: req.body.enabled !== false,
    });

    res.status(201).json({ status: 'success', data: toClient(row) });
  } catch (error) {
    next(error);
  }
}

export async function updateReminder(req, res, next) {
  try {
    const row = await Reminder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!row) {
      return res.status(404).json({ status: 'error', message: 'Reminder not found.' });
    }

    if (req.body.title != null) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ status: 'error', message: 'Title cannot be empty.' });
      row.title = title;
    }
    if (req.body.message != null) row.message = String(req.body.message).trim().slice(0, 200);
    if (req.body.time != null) {
      const time = normalizeTime(req.body.time);
      if (!time) return res.status(400).json({ status: 'error', message: 'Invalid time.' });
      row.time = time;
      row.lastFiredKey = null;
    }
    if (req.body.repeat != null && ['once', 'daily', 'weekdays'].includes(req.body.repeat)) {
      row.repeat = req.body.repeat;
      if (row.repeat !== 'once') row.date = null;
      row.lastFiredKey = null;
    }
    if (req.body.date != null) row.date = row.repeat === 'once' ? req.body.date : null;
    if (typeof req.body.enabled === 'boolean') row.enabled = req.body.enabled;
    if (req.body.timezone) row.timezone = req.body.timezone;

    await row.save();
    res.json({ status: 'success', data: toClient(row) });
  } catch (error) {
    next(error);
  }
}

export async function deleteReminder(req, res, next) {
  try {
    const result = await Reminder.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (!result.deletedCount) {
      return res.status(404).json({ status: 'error', message: 'Reminder not found.' });
    }
    res.json({ status: 'success', message: 'Reminder deleted.' });
  } catch (error) {
    next(error);
  }
}

export async function listNotifications(req, res, next) {
  try {
    const unreadOnly = String(req.query.unread || '') === '1';
    const filter = { userId: req.user.id };
    if (unreadOnly) filter.read = false;
    const rows = await AppNotification.find(filter).sort({ createdAt: -1 }).limit(40).lean();
    res.json({
      status: 'success',
      count: rows.length,
      data: rows.map((n) => ({
        id: String(n._id),
        title: n.title,
        body: n.body || '',
        kind: n.kind,
        read: Boolean(n.read),
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationsRead(req, res, next) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : null;
    const filter = { userId: req.user.id, read: false };
    if (ids?.length) filter._id = { $in: ids };
    const result = await AppNotification.updateMany(filter, { $set: { read: true } });
    res.json({ status: 'success', modified: result.modifiedCount || 0 });
  } catch (error) {
    next(error);
  }
}
5