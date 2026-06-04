import PrepModel from '../models/prepModel.js';

class PrepRepository {
  async getAllNotes() {
    return await PrepModel.getAllNotes();
  }

  async getNotesBySubject(subjectName) {
    return await PrepModel.getNotesBySubject(subjectName);
  }

  async createNote(noteData) {
    return await PrepModel.createNote(noteData);
  }

  async deleteNote(id) {
    return await PrepModel.deleteNote(id);
  }
}

export default new PrepRepository();
