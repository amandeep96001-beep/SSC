/**
 * Mock DB Storage for SSC Prep notes & topics.
 * Accessible through standard Model CRUD patterns.
 */

export interface IPrepNote {
  id: number;
  subject: string;
  topic: string;
  difficulty: string;
  content: string;
  createdAt: Date;
}

let notesDb: IPrepNote[] = [
  {
    id: 1,
    subject: 'Quantitative Aptitude',
    topic: 'Percentage Essentials',
    difficulty: 'Easy',
    content: 'Concept: Percentage means per hundred. Key formulas: x% of y = (x * y) / 100. Fractional equivalents: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/8 = 12.5%. Always memorize fractional conversions to solve QA questions rapidly in SSC exams.',
    createdAt: new Date('2026-06-01')
  },
  {
    id: 2,
    subject: 'English Comprehension',
    topic: 'Subject-Verb Agreement Rules',
    difficulty: 'Medium',
    content: 'Rule 1: Two singular subjects connected by "and" usually take a plural verb. Rule 2: When connected by "or" or "nor", the verb agrees with the closer subject. Example: Neither the teacher nor the students were present.',
    createdAt: new Date('2026-06-02')
  },
  {
    id: 3,
    subject: 'General Awareness',
    topic: 'Indian Constitution - Fundamental Rights',
    difficulty: 'Hard',
    content: 'Fundamental Rights are enshrined in Part III (Articles 12 to 35) of the Constitution. Borrowed from USA. Originally 7, now 6 (Right to Property removed by 44th Amendment Act, 1978). Article 32 is called the Heart and Soul of the Constitution by B.R. Ambedkar.',
    createdAt: new Date('2026-06-03')
  }
];

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

  static async createNote(noteData: {
    subject: unknown;
    topic: unknown;
    difficulty?: unknown;
    content: unknown;
  }) {
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
