import { describe, expect, it } from 'vitest';
import { lensMules, findWorld } from '../worlds';
import type { Mule } from '../../types';

function makeMule(id: string, overrides: Partial<Mule> = {}): Mule {
  return {
    id,
    name: `Mule ${id}`,
    level: 200,
    muleClass: 'Hero',
    selectedBosses: [],
    active: true,
    ...overrides,
  };
}

describe('lensMules', () => {
  it('returns [] when world is null', () => {
    const mules = [
      makeMule('a', { worldId: 'heroic-kronos' }),
      makeMule('b', { worldId: 'interactive-bera' }),
    ];
    expect(lensMules(mules, null)).toEqual([]);
  });

  it('keeps mules whose worldId matches the given world', () => {
    const kronos = findWorld('heroic-kronos')!;
    const m1 = makeMule('a', { worldId: 'heroic-kronos' });
    const m2 = makeMule('b', { worldId: 'heroic-kronos' });
    const result = lensMules([m1, m2], kronos);
    expect(result).toEqual([m1, m2]);
  });

  it('excludes mules whose worldId does not match the given world', () => {
    const kronos = findWorld('heroic-kronos')!;
    const m1 = makeMule('a', { worldId: 'heroic-kronos' });
    const m2 = makeMule('b', { worldId: 'interactive-bera' });
    expect(lensMules([m1, m2], kronos)).toEqual([m1]);
  });

  it('excludes mules that have no worldId', () => {
    const kronos = findWorld('heroic-kronos')!;
    const m1 = makeMule('a', { worldId: 'heroic-kronos' });
    const m2 = makeMule('b');
    expect(lensMules([m1, m2], kronos)).toEqual([m1]);
  });

  it('returns an empty array when no mules match the world', () => {
    const luna = findWorld('interactive-luna')!;
    const mules = [
      makeMule('a', { worldId: 'heroic-kronos' }),
      makeMule('b', { worldId: 'interactive-bera' }),
    ];
    expect(lensMules(mules, luna)).toEqual([]);
  });
});
