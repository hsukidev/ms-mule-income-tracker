import { describe, expect, it } from 'vitest';
import { sanitizeMuleName } from '../muleName';

describe('sanitizeMuleName', () => {
  it('passes letters through unchanged', () => {
    expect(sanitizeMuleName('Hero')).toBe('Hero');
  });

  it('preserves digits', () => {
    expect(sanitizeMuleName('Hero1')).toBe('Hero1');
  });

  it('strips symbols and whitespace', () => {
    expect(sanitizeMuleName('He-ro! ')).toBe('Hero');
  });

  it('caps at 12 characters', () => {
    expect(sanitizeMuleName('Abcdefghijklmn')).toBe('Abcdefghijkl');
  });

  it('strips symbols before applying the cap', () => {
    expect(sanitizeMuleName('H1ero@WorldTooLong')).toBe('H1eroWorldTo');
  });
});
