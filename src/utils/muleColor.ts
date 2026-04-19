/**
 * Palette of CSS custom-property references used for pie-chart slice fills.
 * The order is significant: indexes here align with `colorIndexForMuleId`'s
 * output so that a given mule id consistently maps to the same palette slot.
 *
 * When the roster exceeds the palette size, mule ids hash modulo the palette
 * length; collisions are expected and stable — the same two mules share a
 * color before and after any reorder.
 */
export const MULE_PALETTE: readonly string[] = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
];

/**
 * Deterministic, stateless string hash (FNV-1a 32-bit). Identical across
 * renders, independent of roster membership or order — which is exactly the
 * property the pie chart's slice colors need.
 */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // Multiply by the FNV 32-bit prime and fold to 32 bits.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Map a mule id to a palette slot. Pure function of the id alone — no
 * dependence on current roster order, size, or any other mule's presence.
 */
export function colorIndexForMuleId(muleId: string): number {
  return hashString(muleId) % MULE_PALETTE.length;
}

/** Convenience wrapper that returns the CSS color token directly. */
export function colorForMuleId(muleId: string): string {
  return MULE_PALETTE[colorIndexForMuleId(muleId)];
}
