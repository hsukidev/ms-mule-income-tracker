import { describe, expect, it } from 'vitest';
import { WORLDS, WORLD_IDS, findWorld, type WorldId } from '../worlds';

describe('worlds data module', () => {
  it('contains exactly the six PRD-specified worlds in order', () => {
    expect(WORLDS).toHaveLength(6);
    expect(WORLDS.map((w) => w.id)).toEqual([
      'heroic-kronos',
      'heroic-hyperion',
      'heroic-solis',
      'interactive-scania',
      'interactive-bera',
      'interactive-luna',
    ] satisfies WorldId[]);
  });

  it('every World id is distinct', () => {
    const ids = new Set(WORLDS.map((w) => w.id));
    expect(ids.size).toBe(WORLDS.length);
  });

  it('every World id is present in WORLD_IDS', () => {
    for (const world of WORLDS) {
      expect(WORLD_IDS.has(world.id)).toBe(true);
    }
    expect(WORLD_IDS.size).toBe(WORLDS.length);
  });

  it('WORLD_IDS contains exactly the six ids', () => {
    expect(WORLD_IDS.size).toBe(6);
    expect([...WORLD_IDS].sort()).toEqual(
      [
        'heroic-kronos',
        'heroic-hyperion',
        'heroic-solis',
        'interactive-scania',
        'interactive-bera',
        'interactive-luna',
      ].sort(),
    );
  });

  it('Heroic worlds have group "Heroic"', () => {
    const heroic = WORLDS.filter((w) => w.id.startsWith('heroic-'));
    expect(heroic).toHaveLength(3);
    for (const world of heroic) {
      expect(world.group).toBe('Heroic');
    }
  });

  it('Interactive worlds have group "Interactive"', () => {
    const interactive = WORLDS.filter((w) => w.id.startsWith('interactive-'));
    expect(interactive).toHaveLength(3);
    for (const world of interactive) {
      expect(world.group).toBe('Interactive');
    }
  });

  it('world labels match expected display names', () => {
    expect(WORLDS.find((w) => w.id === 'heroic-kronos')?.label).toBe('Kronos');
    expect(WORLDS.find((w) => w.id === 'heroic-hyperion')?.label).toBe('Hyperion');
    expect(WORLDS.find((w) => w.id === 'heroic-solis')?.label).toBe('Solis');
    expect(WORLDS.find((w) => w.id === 'interactive-scania')?.label).toBe('Scania');
    expect(WORLDS.find((w) => w.id === 'interactive-bera')?.label).toBe('Bera');
    expect(WORLDS.find((w) => w.id === 'interactive-luna')?.label).toBe('Luna');
  });
});

describe('findWorld', () => {
  it('returns the matching World for every valid id', () => {
    for (const world of WORLDS) {
      expect(findWorld(world.id)).toBe(world);
    }
  });

  it('returns null for null', () => {
    expect(findWorld(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(findWorld('')).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(findWorld('not-a-world')).toBeNull();
    expect(findWorld('heroic-unknown')).toBeNull();
  });
});
