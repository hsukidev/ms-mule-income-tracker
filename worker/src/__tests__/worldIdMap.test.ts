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
 * isn't bijective, and the per-bucket uniqueness check guards against
 * accidentally collapsing two worlds onto the same numeric id within a
 * `(region, rebootIndex)` bucket.
 *
 * The supported set is the six worlds: Heroic (Kronos/Hyperion on NA,
 * Solis on EU) at `rebootIndex=1` and Interactive (Bera/Scania on NA,
 * Luna on EU) at `rebootIndex=0`.
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

  it('tags each WorldId with the correct region (Solis + Luna live on EU; the rest on NA)', () => {
    expect(toUpstreamKey('heroic-kronos').region).toBe('na');
    expect(toUpstreamKey('heroic-hyperion').region).toBe('na');
    expect(toUpstreamKey('heroic-solis').region).toBe('eu');
    expect(toUpstreamKey('interactive-bera').region).toBe('na');
    expect(toUpstreamKey('interactive-scania').region).toBe('na');
    expect(toUpstreamKey('interactive-luna').region).toBe('eu');
  });

  it('round-trips every supported WorldId via toUpstreamKey → fromUpstreamKey', () => {
    for (const id of SUPPORTED_WORLD_IDS) {
      const key = toUpstreamKey(id);
      const reverse = fromUpstreamKey(key.region, key.rebootIndex, key.worldID);
      expect(reverse).toBe(id);
    }
  });

  it('round-trips the EU pins explicitly (Solis at eu/1/46, Luna at eu/0/30)', () => {
    expect(fromUpstreamKey('eu', 1, 46)).toBe('heroic-solis');
    expect(fromUpstreamKey('eu', 0, 30)).toBe('interactive-luna');
  });

  it('assigns a unique numeric worldID within each (region, rebootIndex) bucket', () => {
    const keys = SUPPORTED_WORLD_IDS.map(toUpstreamKey);
    const buckets = new Map<string, number[]>();
    for (const key of keys) {
      const bucket = `${key.region}:${key.rebootIndex}`;
      const list = buckets.get(bucket) ?? [];
      list.push(key.worldID);
      buckets.set(bucket, list);
    }
    for (const [, ids] of buckets) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('returns null from fromUpstreamKey for an unknown numeric worldID', () => {
    expect(fromUpstreamKey('na', 1, 9999)).toBeNull();
    expect(fromUpstreamKey('na', 0, 9999)).toBeNull();
    expect(fromUpstreamKey('eu', 1, 9999)).toBeNull();
    expect(fromUpstreamKey('eu', 0, 9999)).toBeNull();
  });

  it('keeps regional buckets disjoint — an NA numeric id queried as EU does not resolve to the NA WorldId', () => {
    // Same numeric id queried in the wrong region must NOT resolve to the
    // NA WorldId. Kronos (na/1/45) queried as eu/1/45 should not collapse
    // to 'heroic-kronos'.
    const kronos = toUpstreamKey('heroic-kronos');
    expect(fromUpstreamKey('eu', kronos.rebootIndex, kronos.worldID)).not.toBe('heroic-kronos');

    const luna = toUpstreamKey('interactive-luna');
    expect(fromUpstreamKey('na', luna.rebootIndex, luna.worldID)).not.toBe('interactive-luna');
  });

  it('keeps Heroic and Interactive buckets disjoint — same numeric id in the wrong reboot bucket does not resolve', () => {
    // A Heroic numeric id queried with rebootIndex=0 must NOT resolve to the
    // Heroic WorldId — and vice versa — even if the numeric values overlap.
    const kronos = toUpstreamKey('heroic-kronos');
    expect(fromUpstreamKey(kronos.region, 0, kronos.worldID)).not.toBe('heroic-kronos');

    const bera = toUpstreamKey('interactive-bera');
    expect(fromUpstreamKey(bera.region, 1, bera.worldID)).not.toBe('interactive-bera');
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
