import { describe, expect, it } from 'vitest';
import { MULE_NOTES_MAX_LENGTH, sanitizeMuleNotes } from '../muleNotes';

describe('sanitizeMuleNotes', () => {
  it('passes printable ASCII through unchanged', () => {
    expect(sanitizeMuleNotes('Main mule, owes legion levels')).toBe(
      'Main mule, owes legion levels',
    );
  });

  it('strips C0 control chars except newline, tab, and carriage return', () => {
    // \u0001 SOH, \u0007 BEL, \u001F US — all must be stripped.
    // \n \t \r must be preserved (multi-line notes + tabular content).
    const input = 'a\u0001\nb\u0007\tc\u001Fdefg\r';
    expect(sanitizeMuleNotes(input)).toBe('a\nb\tcdefg\r');
  });

  it('truncates input over MULE_NOTES_MAX_LENGTH to exactly the cap', () => {
    const input = 'x'.repeat(MULE_NOTES_MAX_LENGTH + 100);
    const out = sanitizeMuleNotes(input);
    expect(out.length).toBe(MULE_NOTES_MAX_LENGTH);
    expect(out).toBe('x'.repeat(MULE_NOTES_MAX_LENGTH));
  });

  it('exposes MULE_NOTES_MAX_LENGTH as 500', () => {
    expect(MULE_NOTES_MAX_LENGTH).toBe(500);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeMuleNotes('')).toBe('');
  });
});
