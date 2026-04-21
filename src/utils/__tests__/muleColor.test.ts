import { describe, expect, it } from 'vitest';
import { MULE_PALETTE, colorForMulePosition } from '../muleColor';

describe('muleColor', () => {
  it('returns a palette slot for any non-negative index', () => {
    for (const i of [0, 1, 4, 5, 99, 12345]) {
      expect(MULE_PALETTE).toContain(colorForMulePosition(i));
    }
  });

  it('cycles through the palette in order', () => {
    for (let i = 0; i < MULE_PALETTE.length * 3; i++) {
      expect(colorForMulePosition(i)).toBe(MULE_PALETTE[i % MULE_PALETTE.length]);
    }
  });

  it('covers every palette slot before repeating any', () => {
    const firstCycle = Array.from({ length: MULE_PALETTE.length }, (_, i) =>
      colorForMulePosition(i),
    );
    expect(new Set(firstCycle).size).toBe(MULE_PALETTE.length);
  });

  it('keeps palette usage balanced within 1 at every roster size', () => {
    for (let n = 0; n <= MULE_PALETTE.length * 4; n++) {
      const counts = new Map<string, number>();
      for (let i = 0; i < n; i++) {
        const c = colorForMulePosition(i);
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      const values = [...counts.values()];
      if (values.length === 0) continue;
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    }
  });
});
