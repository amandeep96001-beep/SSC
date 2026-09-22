import { describe, it, expect } from 'vitest';
import { parseAppPath, pathForView } from '@/app/paths';

describe('paths', () => {
  it('parses home', () => {
    expect(parseAppPath('/').view).toBe('home');
  });

  it('builds drill path', () => {
    const path = pathForView('drill', {});
    expect(path).toContain('drill');
  });
});
