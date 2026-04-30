export function sanitizeMuleName(raw: string): string {
  // NFC first: \p{Script=Latin} matches composed codepoints (é) but not
  // base-letter + combining-mark sequences, which the regex would strip as marks.
  return raw
    .normalize('NFC')
    .replace(/[^\p{Script=Latin}0-9]/gu, '')
    .slice(0, 12);
}
