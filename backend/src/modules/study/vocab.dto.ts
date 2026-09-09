class VocabDto {
  word: string;
  pos: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  options: string[];
  category: unknown;
  createdBy: string;

  constructor({
    word,
    pos,
    definition,
    synonyms,
    antonyms,
    options,
    category,
    createdBy,
  }: {
    word?: unknown;
    pos?: unknown;
    definition?: unknown;
    synonyms?: unknown;
    antonyms?: unknown;
    options?: unknown;
    category?: unknown;
    createdBy?: unknown;
  }) {
    this.word = word ? String(word).trim() : '';
    this.pos = pos ? String(pos).trim() : 'Noun';
    this.definition = definition ? String(definition).trim() : '';
    this.synonyms = this._parseArray(synonyms);
    this.antonyms = this._parseArray(antonyms);
    this.options = this._parseArray(options);
    this.category = category;
    this.createdBy = createdBy ? String(createdBy) : 'user';
  }

  _parseArray(input: unknown): string[] {
    if (Array.isArray(input)) return input.map((i) => String(i));
    if (typeof input === 'string' && input.trim()) return input.split(',').map((i) => i.trim());
    return [];
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.word) errors.push('Word is required.');
    if (!this.definition) errors.push('Definition is required.');
    if (!this.category) errors.push('Category is required.');
    return errors;
  }
}

export default VocabDto;
