import { describe, expect, it } from 'vitest';
import { userPresetMatch, type UserPreset } from '../userPresets';

function preset(
  id: string,
  name: string,
  slateKeys: readonly string[],
  partySizes: Record<string, number> = {},
): UserPreset {
  return { id, name, slateKeys, partySizes };
}

describe('userPresetMatch', () => {
  it('returns the preset whose slateKeys equal the slate as a set', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    const b = preset('b', 'B', ['k3']);
    expect(userPresetMatch({ slateKeys: ['k1', 'k2'], partySizes: {} }, [a, b])).toBe(a);
  });

  it('matches order-insensitively', () => {
    const a = preset('a', 'A', ['k1', 'k2', 'k3']);
    expect(userPresetMatch({ slateKeys: ['k3', 'k1', 'k2'], partySizes: {} }, [a])).toBe(a);
  });

  it('returns null when a key is missing from the slate', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    expect(userPresetMatch({ slateKeys: ['k1'], partySizes: {} }, [a])).toBeNull();
  });

  it('returns null when the slate has an extra key', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    expect(userPresetMatch({ slateKeys: ['k1', 'k2', 'k3'], partySizes: {} }, [a])).toBeNull();
  });

  it('matches empty slate against empty preset', () => {
    const a = preset('a', 'A', []);
    expect(userPresetMatch({ slateKeys: [], partySizes: {} }, [a])).toBe(a);
  });

  it('returns null on empty slate when all presets have keys', () => {
    const a = preset('a', 'A', ['k1']);
    expect(userPresetMatch({ slateKeys: [], partySizes: {} }, [a])).toBeNull();
  });

  it('returns null on non-empty slate when the only preset is empty', () => {
    const a = preset('a', 'A', []);
    expect(userPresetMatch({ slateKeys: ['k1'], partySizes: {} }, [a])).toBeNull();
  });

  it('returns null with no presets', () => {
    expect(userPresetMatch({ slateKeys: ['k1'], partySizes: {} }, [])).toBeNull();
  });

  it('selects the first matching preset from a list of many', () => {
    const a = preset('a', 'A', ['k1']);
    const b = preset('b', 'B', ['k1', 'k2']);
    const c = preset('c', 'C', ['k3', 'k4']);
    expect(userPresetMatch({ slateKeys: ['k2', 'k1'], partySizes: {} }, [a, b, c])).toBe(b);
  });

  it('returns null when slate keys match but party sizes differ', () => {
    const a = preset('a', 'A', ['fam:hard:weekly'], { fam: 3 });
    expect(
      userPresetMatch({ slateKeys: ['fam:hard:weekly'], partySizes: { fam: 1 } }, [a]),
    ).toBeNull();
  });

  it('matches when snapshot has explicit 1 and current is absent (default-aware)', () => {
    const a = preset('a', 'A', ['fam:hard:weekly'], { fam: 1 });
    expect(userPresetMatch({ slateKeys: ['fam:hard:weekly'], partySizes: {} }, [a])).toBe(a);
  });

  it('returns null when snapshot has explicit non-default value and current is absent', () => {
    const a = preset('a', 'A', ['fam:hard:weekly'], { fam: 3 });
    expect(userPresetMatch({ slateKeys: ['fam:hard:weekly'], partySizes: {} }, [a])).toBeNull();
  });

  it('ignores extraneous current.partySizes entries for families not in the snapshot', () => {
    const a = preset('a', 'A', ['fam:hard:weekly'], { fam: 2 });
    expect(
      userPresetMatch({ slateKeys: ['fam:hard:weekly'], partySizes: { fam: 2, residual: 6 } }, [a]),
    ).toBe(a);
  });
});
