export const MULE_NAME_MIN_LENGTH = 2;
export const MULE_NAME_MAX_LENGTH = 12;

// Regex character-class body, embedded into both the strip and full-match
// regexes below via template strings — the `\\p` is a literal backslash
// because `new RegExp` parses the source string.
const ALLOWED_CHAR_CLASS = '\\p{Script=Latin}0-9';
const STRIP_DISALLOWED = new RegExp(`[^${ALLOWED_CHAR_CLASS}]`, 'gu');
const FULL_VALID = new RegExp(
  `^[${ALLOWED_CHAR_CLASS}]{${MULE_NAME_MIN_LENGTH},${MULE_NAME_MAX_LENGTH}}$`,
  'u',
);

export function sanitizeMuleName(raw: string): string {
  // NFC first: \p{Script=Latin} matches composed codepoints (é) but not
  // base-letter + combining-mark sequences, which the regex would strip as marks.
  return raw.normalize('NFC').replace(STRIP_DISALLOWED, '').slice(0, MULE_NAME_MAX_LENGTH);
}

// Pure predicate. Caller is responsible for NFC-normalizing first; an NFD
// input will fail because combining marks aren't in \p{Script=Latin}.
export function isValidMuleName(name: string): boolean {
  return FULL_VALID.test(name);
}
