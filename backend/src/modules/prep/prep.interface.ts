export interface IPrepNote {
  id: number;
  subject: string;
  topic: string;
  difficulty: string;
  content: string;
  createdAt: Date;
}

export interface CreatePrepNoteInput {
  subject: unknown;
  topic: unknown;
  difficulty?: unknown;
  content: unknown;
}
