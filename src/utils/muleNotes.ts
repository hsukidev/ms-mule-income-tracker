export const MULE_NOTES_MAX_LENGTH = 500;

// C0 controls and DEL, except \t (U+0009), \n (U+000A), and \r (U+000D),
// which are the only control codepoints we keep so multi-line and tab-aligned
// notes survive a round-trip through the sanitizer.
// eslint-disable-next-line no-control-regex
const STRIP_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeMuleNotes(raw: string): string {
  return raw.replace(STRIP_CONTROL, '').slice(0, MULE_NOTES_MAX_LENGTH);
}
