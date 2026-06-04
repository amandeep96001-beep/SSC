import prepRepository from '../repositories/prepRepository.js';
import NoteDto from '../dtos/noteDto.js';
import { getDBStatus } from '../config/db.config.js';

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

export const getNotes = async (req, res, next) => {
  try {
    const subject = req.query.subject;
    let notes;
    if (subject) {
      notes = await prepRepository.getNotesBySubject(subject);
    } else {
      notes = await prepRepository.getAllNotes();
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

export const createNote = async (req, res, next) => {
  try {
    const dto = new NoteDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const newNote = await prepRepository.createNote(dto);

    res.status(201).json({
      status: 'success',
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const success = await prepRepository.deleteNote(id);

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
