import PrepModel from './prep.model.js';
import type { IPrepNote } from './prep.model.js';

class PrepRepository {
  async getAllNotes() {
    return await PrepModel.getAllNotes();
  }

  async getNotesBySubject(subjectName: string) {
    return await PrepModel.getNotesBySubject(subjectName);
  }

  async createNote(noteData: {
    subject: unknown;
    topic: unknown;
    difficulty?: unknown;
    content: unknown;
  }): Promise<IPrepNote> {
    return await PrepModel.createNote(noteData);
  }

  async deleteNote(id: number) {
    return await PrepModel.deleteNote(id);
  }
}

export default new PrepRepository();
