class NoteDto {
  subject: unknown;
  topic: unknown;
  difficulty: unknown;
  content: unknown;

  constructor({
    subject,
    topic,
    difficulty,
    content,
  }: {
    subject?: unknown;
    topic?: unknown;
    difficulty?: unknown;
    content?: unknown;
  }) {
    this.subject = subject;
    this.topic = topic;
    this.difficulty = difficulty;
    this.content = content;
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.subject) errors.push('Subject is required.');
    if (!this.topic) errors.push('Topic is required.');
    if (!this.content) errors.push('Content is required.');
    return errors;
  }
}

export default NoteDto;
