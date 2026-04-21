/**
 * Palette of CSS custom-property references used for pie-chart slice fills.
 * Colors are assigned by roster position, cycling through the palette, so the
 * counts of any two palette slots differ by at most 1 for any roster size.
 */
export const MULE_PALETTE: readonly string[] = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
];

/**
 * Map a roster position to a palette slot by cycling through the palette.
 * Keeps color counts balanced (max difference of 1) at every roster size.
 */
export function colorForMulePosition(index: number): string {
  return MULE_PALETTE[index % MULE_PALETTE.length];
}
