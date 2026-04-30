import { describe, expect, it } from 'vitest';
import { isValidMuleName, sanitizeMuleName } from '../muleName';

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

  it('preserves accented Latin letters', () => {
    expect(sanitizeMuleName('Renée')).toBe('Renée');
  });

  it('strips non-Latin scripts', () => {
    expect(sanitizeMuleName('Hero日本')).toBe('Hero');
    expect(sanitizeMuleName('Привет')).toBe('');
  });

  it('normalizes decomposed (NFD) input to composed form', () => {
    const nfd = 'Rene\u0301e';
    expect(sanitizeMuleName(nfd)).toBe('Renée');
  });
});

describe('isValidMuleName', () => {
  it('accepts ASCII letters and digits', () => {
    expect(isValidMuleName('Hero')).toBe(true);
    expect(isValidMuleName('Hero123')).toBe(true);
  });

  it('accepts accented Latin letters', () => {
    expect(isValidMuleName('Zahîra')).toBe(true);
    expect(isValidMuleName('Renée')).toBe(true);
    expect(isValidMuleName('Núñez')).toBe(true);
  });

  it('rejects NFD input — caller must normalize first', () => {
    const nfd = 'Rene\u0301e';
    expect(isValidMuleName(nfd)).toBe(false);
    expect(isValidMuleName(nfd.normalize('NFC'))).toBe(true);
  });

  it('rejects names with non-Latin scripts', () => {
    expect(isValidMuleName('Hero日本')).toBe(false);
    expect(isValidMuleName('Привет')).toBe(false);
  });

  it('rejects names with symbols or whitespace', () => {
    expect(isValidMuleName('He-ro')).toBe(false);
    expect(isValidMuleName('Alice!')).toBe(false);
    expect(isValidMuleName('Two words')).toBe(false);
  });

  it('rejects names shorter than 2 chars', () => {
    expect(isValidMuleName('A')).toBe(false);
    expect(isValidMuleName('')).toBe(false);
  });

  it('rejects names longer than 12 chars', () => {
    expect(isValidMuleName('Abcdefghijklm')).toBe(false);
    expect(isValidMuleName('Abcdefghijkl')).toBe(true);
  });
});
