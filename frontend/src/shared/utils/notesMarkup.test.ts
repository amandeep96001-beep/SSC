import { describe, it, expect } from 'vitest';
import { prepareNotesHtml } from '@/shared/utils/notesMarkup';

describe('notes callouts', () => {
  it('gives formula, example and mistake their own tone', () => {
    const html = prepareNotesHtml(
      ['Formula: x% of N = Nx/100', 'Example: 25% then −20% nets zero.', 'Mistake: 1/9 is not 11⅓%.'].join('\n'),
    );
    expect(html).toContain('notes-callout--formula');
    expect(html).toContain('notes-callout--example');
    expect(html).toContain('notes-callout--caution');
  });
});
