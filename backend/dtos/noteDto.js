class NoteDto {
  constructor({ subject, topic, difficulty, content }) {
    this.subject = subject;
    this.topic = topic;
    this.difficulty = difficulty;
    this.content = content;
  }

  validate() {
    const errors = [];
    if (!this.subject) errors.push('Subject is required.');
    if (!this.topic) errors.push('Topic is required.');
    if (!this.content) errors.push('Content is required.');
    return errors;
  }
}

export default NoteDto;
