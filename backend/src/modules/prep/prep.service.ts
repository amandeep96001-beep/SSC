import prepRepository from './prep.repository.js';
import NoteDto from './note.dto.js';
import { getDBStatus } from '../../config/db.config.js';
import { badRequest, notFound } from '../../utils/app-errors.js';

export class PrepService {
  getStatus() {
    return {
      database: getDBStatus() ? 'Connected' : 'Offline',
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }

  async getNotes(subject?: unknown) {
    const notes = subject
      ? await prepRepository.getNotesBySubject(String(subject))
      : await prepRepository.getAllNotes();
    return { count: notes.length, data: notes };
  }

  async createNote(body: unknown) {
    const dto = new NoteDto(body as ConstructorParameters<typeof NoteDto>[0]);
    const errors = dto.validate();
    if (errors.length > 0) throw badRequest(errors.join(' '));
    const newNote = await prepRepository.createNote(dto);
    return { data: newNote };
  }

  async deleteNote(idRaw: string) {
    const id = parseInt(idRaw, 10);
    const success = await prepRepository.deleteNote(id);
    if (!success) throw notFound(`Note with id ${id} not found.`);
    return { message: `Note with id ${id} successfully deleted.` };
  }
}

export const prepService = new PrepService();
