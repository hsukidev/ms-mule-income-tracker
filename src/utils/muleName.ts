export function sanitizeMuleName(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
}
