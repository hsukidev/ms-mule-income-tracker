import { describe, expect, it } from 'vitest';
import { rosterRowMetrics } from '../rosterRowMetrics';
import type { Mule } from '../../types';
import type { MuleContribution } from '../../modules/worldIncome';
import type { SlateKey } from '../../data/muleBossSlate';

const baseMule = (overrides: Partial<Mule> = {}): Mule => ({
  id: 'm1',
  name: 'M1',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
  active: true,
  ...overrides,
});

const contribution = (overrides: Partial<MuleContribution> = {}): MuleContribution => ({
  potentialMeso: 0,
  contributedMeso: 0,
  droppedMeso: 0,
  droppedSlots: 0,
  droppedKeys: new Map<SlateKey, number>(),
  ...overrides,
});

describe('rosterRowMetrics', () => {
  it('counts weekly slate keys (those ending in :weekly)', () => {
    const mule = baseMule({
      selectedBosses: ['boss-a:hard:weekly', 'boss-b:chaos:weekly', 'boss-c:normal:daily'],
    });
    const m = rosterRowMetrics(mule, contribution(), 0);
    expect(m.weeklyCount).toBe(2);
  });

  it('counts daily slate keys (those ending in :daily)', () => {
    const mule = baseMule({
      selectedBosses: ['boss-a:hard:weekly', 'boss-b:normal:daily', 'boss-c:normal:daily'],
    });
    const m = rosterRowMetrics(mule, contribution(), 0);
    expect(m.dailyCount).toBe(2);
  });

  it('returns zero for empty selectedBosses', () => {
    const mule = baseMule({ selectedBosses: [] });
    const m = rosterRowMetrics(mule, contribution(), 0);
    expect(m.weeklyCount).toBe(0);
    expect(m.dailyCount).toBe(0);
    expect(m.postCapMeso).toBe(0);
    expect(m.sharePct).toBe(0);
    expect(m.droppedKeys.size).toBe(0);
  });

  it('handles full 14 weeklies', () => {
    const keys = Array.from({ length: 14 }, (_, i) => `boss-${i}:hard:weekly`);
    const mule = baseMule({ selectedBosses: keys });
    const m = rosterRowMetrics(mule, contribution(), 0);
    expect(m.weeklyCount).toBe(14);
  });

  it('uses contribution.contributedMeso as postCapMeso', () => {
    const mule = baseMule();
    const c = contribution({ contributedMeso: 1_500_000_000 });
    const m = rosterRowMetrics(mule, c, 6_000_000_000);
    expect(m.postCapMeso).toBe(1_500_000_000);
  });

  it('computes sharePct as contributedMeso / worldTotal', () => {
    const mule = baseMule();
    const c = contribution({ contributedMeso: 1_000_000_000 });
    const m = rosterRowMetrics(mule, c, 4_000_000_000);
    expect(m.sharePct).toBeCloseTo(0.25, 5);
  });

  it('returns 0 sharePct when worldTotal is 0 (no NaN)', () => {
    const mule = baseMule();
    const c = contribution({ contributedMeso: 1_000_000_000 });
    const m = rosterRowMetrics(mule, c, 0);
    expect(m.sharePct).toBe(0);
    expect(Number.isNaN(m.sharePct)).toBe(false);
  });

  it('treats missing contribution as 0 (covers inactive mules absent from perMule)', () => {
    const mule = baseMule({ active: false, selectedBosses: ['boss-a:hard:weekly'] });
    const m = rosterRowMetrics(mule, undefined, 4_000_000_000);
    expect(m.postCapMeso).toBe(0);
    expect(m.sharePct).toBe(0);
    expect(m.droppedKeys.size).toBe(0);
    // Cadence counts still derive from selectedBosses, not from contribution.
    expect(m.weeklyCount).toBe(1);
  });

  it('passes through droppedKeys from the contribution', () => {
    const dk = new Map<SlateKey, number>([['boss-a:hard:weekly', 1]]);
    const mule = baseMule({ selectedBosses: ['boss-a:hard:weekly'] });
    const m = rosterRowMetrics(mule, contribution({ droppedKeys: dk }), 1);
    expect(m.droppedKeys).toBe(dk);
  });

  it('only-daily mule renders zero weeklies', () => {
    const mule = baseMule({ selectedBosses: ['boss-a:normal:daily', 'boss-b:hard:daily'] });
    const m = rosterRowMetrics(mule, contribution(), 0);
    expect(m.weeklyCount).toBe(0);
    expect(m.dailyCount).toBe(2);
  });
});
