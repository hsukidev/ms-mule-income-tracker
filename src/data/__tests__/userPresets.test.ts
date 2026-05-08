import { describe, expect, it } from 'vitest';
import { userPresetMatch, type UserPreset } from '../userPresets';

function preset(id: string, name: string, slateKeys: readonly string[]): UserPreset {
  return { id, name, slateKeys };
}

describe('userPresetMatch', () => {
  it('returns the preset whose slateKeys equal the slate as a set', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    const b = preset('b', 'B', ['k3']);
    expect(userPresetMatch(['k1', 'k2'], [a, b])).toBe(a);
  });

  it('matches order-insensitively', () => {
    const a = preset('a', 'A', ['k1', 'k2', 'k3']);
    expect(userPresetMatch(['k3', 'k1', 'k2'], [a])).toBe(a);
  });

  it('returns null when a key is missing from the slate', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    expect(userPresetMatch(['k1'], [a])).toBeNull();
  });

  it('returns null when the slate has an extra key', () => {
    const a = preset('a', 'A', ['k1', 'k2']);
    expect(userPresetMatch(['k1', 'k2', 'k3'], [a])).toBeNull();
  });

  it('matches empty slate against empty preset', () => {
    const a = preset('a', 'A', []);
    expect(userPresetMatch([], [a])).toBe(a);
  });

  it('returns null on empty slate when all presets have keys', () => {
    const a = preset('a', 'A', ['k1']);
    expect(userPresetMatch([], [a])).toBeNull();
  });

  it('returns null on non-empty slate when the only preset is empty', () => {
    const a = preset('a', 'A', []);
    expect(userPresetMatch(['k1'], [a])).toBeNull();
  });

  it('returns null with no presets', () => {
    expect(userPresetMatch(['k1'], [])).toBeNull();
  });

  it('selects the first matching preset from a list of many', () => {
    const a = preset('a', 'A', ['k1']);
    const b = preset('b', 'B', ['k1', 'k2']);
    const c = preset('c', 'C', ['k3', 'k4']);
    expect(userPresetMatch(['k2', 'k1'], [a, b, c])).toBe(b);
  });
});
