import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_WORLD_IDS,
  isSupportedWorldId,
  toUpstreamKey,
  fromUpstreamKey,
  type SupportedWorldId,
} from '../worldIdMap';

/**
 * Round-trip tests for the World ID map. The numeric `worldID` values are
 * reverse-engineered empirically and a typo here would silently misroute
 * lookups to the wrong world — the round-trip catches any mapping that
 * isn't bijective, and the per-id checks guard against accidentally
 * collapsing two worlds onto the same numeric id within a reboot bucket.
 *
 * The supported set is the six worlds: Heroic (Kronos/Hyperion/Solis) at
 * `rebootIndex=1` and Interactive (Bera/Scania/Luna) at `rebootIndex=0`.
 */

describe('worldIdMap', () => {
  it('exposes the six supported worlds (3 Heroic + 3 Interactive)', () => {
    expect(new Set(SUPPORTED_WORLD_IDS)).toEqual(
      new Set<SupportedWorldId>([
        'heroic-kronos',
        'heroic-hyperion',
        'heroic-solis',
        'interactive-bera',
        'interactive-scania',
        'interactive-luna',
      ]),
    );
  });

  it('maps every Heroic WorldId to a `{ rebootIndex: 1, worldID }` tuple', () => {
    const heroic: SupportedWorldId[] = ['heroic-kronos', 'heroic-hyperion', 'heroic-solis'];
    for (const id of heroic) {
      const key = toUpstreamKey(id);
      expect(key.rebootIndex).toBe(1);
      expect(typeof key.worldID).toBe('number');
      expect(Number.isInteger(key.worldID)).toBe(true);
    }
  });

  it('maps every Interactive WorldId to a `{ rebootIndex: 0, worldID }` tuple', () => {
    const interactive: SupportedWorldId[] = [
      'interactive-bera',
      'interactive-scania',
      'interactive-luna',
    ];
    for (const id of interactive) {
      const key = toUpstreamKey(id);
      expect(key.rebootIndex).toBe(0);
      expect(typeof key.worldID).toBe('number');
      expect(Number.isInteger(key.worldID)).toBe(true);
    }
  });

  it('round-trips every supported WorldId via toUpstreamKey → fromUpstreamKey', () => {
    for (const id of SUPPORTED_WORLD_IDS) {
      const key = toUpstreamKey(id);
      const reverse = fromUpstreamKey(key.rebootIndex, key.worldID);
      expect(reverse).toBe(id);
    }
  });

  it('assigns a unique numeric worldID within each reboot bucket', () => {
    const keys = SUPPORTED_WORLD_IDS.map(toUpstreamKey);
    const heroicIds = keys.filter((k) => k.rebootIndex === 1).map((k) => k.worldID);
    const interactiveIds = keys.filter((k) => k.rebootIndex === 0).map((k) => k.worldID);
    expect(new Set(heroicIds).size).toBe(heroicIds.length);
    expect(new Set(interactiveIds).size).toBe(interactiveIds.length);
  });

  it('returns null from fromUpstreamKey for an unknown numeric worldID', () => {
    expect(fromUpstreamKey(1, 9999)).toBeNull();
    expect(fromUpstreamKey(0, 9999)).toBeNull();
  });

  it('keeps Heroic and Interactive buckets disjoint — same numeric id in the wrong bucket does not resolve', () => {
    // A Heroic numeric id queried with rebootIndex=0 must NOT resolve to the
    // Heroic WorldId — and vice versa — even if the numeric values overlap.
    const kronos = toUpstreamKey('heroic-kronos');
    expect(fromUpstreamKey(0, kronos.worldID)).not.toBe('heroic-kronos');

    const bera = toUpstreamKey('interactive-bera');
    expect(fromUpstreamKey(1, bera.worldID)).not.toBe('interactive-bera');
  });

  it('narrows isSupportedWorldId to the six supported worlds', () => {
    expect(isSupportedWorldId('heroic-kronos')).toBe(true);
    expect(isSupportedWorldId('heroic-hyperion')).toBe(true);
    expect(isSupportedWorldId('heroic-solis')).toBe(true);
    expect(isSupportedWorldId('interactive-bera')).toBe(true);
    expect(isSupportedWorldId('interactive-scania')).toBe(true);
    expect(isSupportedWorldId('interactive-luna')).toBe(true);
  });

  it('rejects unknown garbage values', () => {
    expect(isSupportedWorldId('not-a-world')).toBe(false);
    expect(isSupportedWorldId('')).toBe(false);
    expect(isSupportedWorldId(null)).toBe(false);
    expect(isSupportedWorldId(undefined)).toBe(false);
    expect(isSupportedWorldId(45)).toBe(false);
  });
});
