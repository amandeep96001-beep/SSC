class VocabDto {
  constructor({ word, pos, definition, synonyms, antonyms, category, createdBy }) {
    this.word = word ? word.trim() : '';
    this.pos = pos ? pos.trim() : 'Noun';
    this.definition = definition ? definition.trim() : '';
    this.synonyms = this._parseArray(synonyms);
    this.antonyms = this._parseArray(antonyms);
    this.category = category;
    this.createdBy = createdBy || 'user';
  }

  _parseArray(input) {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string' && input.trim()) return input.split(',').map(i => i.trim());
    return [];
  }

  validate() {
    const errors = [];
    if (!this.word) errors.push('Word is required.');
    if (!this.definition) errors.push('Definition is required.');
    if (!this.category) errors.push('Category is required.');
    return errors;
  }
}

export default VocabDto;
