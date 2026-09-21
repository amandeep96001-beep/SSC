import type { IPrepNote, CreatePrepNoteInput } from './prep.interface.js';

let notesDb: IPrepNote[] = [];

class PrepModel {
  static async getAllNotes() {
    return notesDb;
  }

  static async getNotesBySubject(subjectName: string) {
    return notesDb.filter(n => n.subject.toLowerCase() === subjectName.toLowerCase());
  }

  static async getNoteById(id: number) {
    return notesDb.find(n => n.id === id);
  }

  static async createNote(noteData: CreatePrepNoteInput) {
    const { subject, topic, difficulty, content } = noteData;
    const newNote: IPrepNote = {
      id: notesDb.length ? Math.max(...notesDb.map(n => n.id)) + 1 : 1,
      subject: String(subject),
      topic: String(topic),
      difficulty: difficulty ? String(difficulty) : 'Medium',
      content: String(content),
      createdAt: new Date()
    };
    notesDb.push(newNote);
    return newNote;
  }

  static async deleteNote(id: number) {
    const exists = notesDb.some(n => n.id === id);
    if (!exists) return false;
    notesDb = notesDb.filter(n => n.id !== id);
    return true;
  }
}

export default PrepModel;
