import { describe, it, expect } from 'vitest';
import { parseAppPath, pathForView } from '@/app/paths';

describe('paths', () => {
  it('parses app home off the marketing root', () => {
    expect(parseAppPath('/home').view).toBe('home');
    expect(pathForView('home', {})).toBe('/home');
  });

  it('builds drill path', () => {
    const path = pathForView('drill', {});
    expect(path).toContain('drill');
  });
});
