import PrepModel from '../models/prepModel.js';
import { getDBStatus } from '../config/db.config.js';

/**
 * @desc    Get system status & health check
 * @route   GET /api/prep/status
 */
export const getStatus = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      database: getDBStatus() ? 'Connected' : 'Offline',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all preparation notes
 * @route   GET /api/prep/notes
 */
export const getNotes = async (req, res, next) => {
  try {
    const subject = req.query.subject;
    let notes;
    if (subject) {
      notes = await PrepModel.getNotesBySubject(subject);
    } else {
      notes = await PrepModel.getAllNotes();
    }
    res.json({
      status: 'success',
      count: notes.length,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new study note
 * @route   POST /api/prep/notes
 */
export const createNote = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, content } = req.body;

    if (!subject || !topic || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide subject, topic, and content.'
      });
    }

    const newNote = await PrepModel.createNote({
      subject,
      topic,
      difficulty,
      content
    });

    res.status(201).json({
      status: 'success',
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a study note
 * @route   DELETE /api/prep/notes/:id
 */
export const deleteNote = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const success = await PrepModel.deleteNote(id);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: `Note with id ${id} not found.`
      });
    }

    res.json({
      status: 'success',
      message: `Note with id ${id} successfully deleted.`
    });
  } catch (error) {
    next(error);
  }
};
