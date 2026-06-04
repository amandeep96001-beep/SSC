class TopicDto {
  constructor({ name, syllabus, notes, questions }) {
    this.name = name;
    this.syllabus = syllabus;
    this.notes = notes;
    this.questions = questions || [];
  }

  validate() {
    const errors = [];
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
