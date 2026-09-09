class TopicDto {
  name: unknown;
  syllabus: unknown;
  notes: unknown;
  questions: unknown;

  constructor({
    name,
    syllabus,
    notes,
    questions,
  }: {
    name?: unknown;
    syllabus?: unknown;
    notes?: unknown;
    questions?: unknown;
  }) {
    this.name = name;
    this.syllabus = syllabus;
    this.notes = notes;
    this.questions = questions || [];
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name || typeof this.name !== 'string') {
      errors.push('Topic name is required and must be a string.');
    }
    if (!this.notes || typeof this.notes !== 'string') {
      errors.push('Topic notes are required and must be a string.');
    }
    if (this.questions && !Array.isArray(this.questions)) {
      errors.push('Questions must be an array.');
    }
    return errors;
  }
}

export default TopicDto;
