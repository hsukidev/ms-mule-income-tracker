import { describe, expect, it } from 'vitest';
import { MuleBossSlate } from '../muleBossSlate';
import { PRESET_FAMILIES, presetEntryFamily, presetEntryKey } from '../bossPresets';
import { bosses, getBossByFamily } from '../bosses';

/**
 * Boundary tests for `MuleBossSlate.applyCanonical` (issue #257).
 *
 * Slate-level absorption of the canonical-preset apply path: runs **Conform**
 * internally and re-validates via `MuleBossSlate.from`, returning
 * `{ slate, changed }` with the no-op short-circuit baked in as a slate
 * invariant under **Full-Slate Equality**.
 */

function buildKey(bossId: string, tier: string, cadence: string): string {
  return `${bossId}:${tier}:${cadence}`;
}

const CRA_KEYS = PRESET_FAMILIES.CRA.map((entry) => presetEntryKey(entry)!);
const LOMIEN_KEYS = PRESET_FAMILIES.LOMIEN.map((entry) => presetEntryKey(entry)!);
const CTENE_KEYS = PRESET_FAMILIES.CTENE.map((entry) => presetEntryKey(entry)!);

describe('MuleBossSlate.applyCanonical', () => {
  describe('non-active preset', () => {
    it('returns changed: true with a slate satisfying Full-Slate Equality (empty → CRA)', () => {
      const empty = MuleBossSlate.from([]);
      const result = empty.applyCanonical('CRA');
      expect(result.changed).toBe(true);
      expect(new Set(result.slate.keys)).toEqual(new Set(CRA_KEYS));
      expect(result.slate.matchedCanonical()).toBe('CRA');
    });

    it('CRA → CTENE swap returns changed: true and lights CTENE', () => {
      const cra = MuleBossSlate.from(CRA_KEYS);
      const result = cra.applyCanonical('CTENE');
      expect(result.changed).toBe(true);
      expect(new Set(result.slate.keys)).toEqual(new Set(CTENE_KEYS));
      expect(result.slate.matchedCanonical()).toBe('CTENE');
    });
  });

  describe('already-matching preset', () => {
    it('returns changed: false on a CRA-active slate', () => {
      const cra = MuleBossSlate.from(CRA_KEYS);
      const result = cra.applyCanonical('CRA');
      expect(result.changed).toBe(false);
      expect(result.slate).toBe(cra);
    });

    it('returns changed: false on a LOMIEN-active slate (multi-tier default)', () => {
      const lomien = MuleBossSlate.from(LOMIEN_KEYS);
      const result = lomien.applyCanonical('LOMIEN');
      expect(result.changed).toBe(false);
      expect(result.slate).toBe(lomien);
    });

    it('returns changed: false on a CTENE-active slate', () => {
      const ctene = MuleBossSlate.from(CTENE_KEYS);
      const result = ctene.applyCanonical('CTENE');
      expect(result.changed).toBe(false);
      expect(result.slate).toBe(ctene);
    });
  });

  describe('Preset Swap (CRA → LOMIEN)', () => {
    it('preserves the CRA-∩-LOMIEN compatible weeklies', () => {
      const cra = MuleBossSlate.from(CRA_KEYS);
      const result = cra.applyCanonical('LOMIEN');
      expect(result.changed).toBe(true);
      // Every CRA family appears in LOMIEN at the same Hardest Tier.
      for (const k of CRA_KEYS) {
        expect(result.slate.keys).toContain(k);
      }
    });

    it('replaces non-accepted-tier keys with the Default Tier', () => {
      const lotus = getBossByFamily('lotus')!;
      const damien = getBossByFamily('damien')!;
      // Extreme Lotus is not in LOMIEN's Accepted Tiers (['normal', 'hard']).
      const extremeLotus = buildKey(lotus.id, 'extreme', 'weekly');
      const start = MuleBossSlate.from([extremeLotus]);
      const result = start.applyCanonical('LOMIEN');
      expect(result.changed).toBe(true);
      // Extreme Lotus is wiped, replaced by Default Tier (Normal Lotus).
      expect(result.slate.keys).not.toContain(extremeLotus);
      expect(result.slate.keys).toContain(buildKey(lotus.id, 'normal', 'weekly'));
      // Damien Default Tier is filled in too.
      expect(result.slate.keys).toContain(buildKey(damien.id, 'normal', 'weekly'));
      expect(result.slate.matchedCanonical()).toBe('LOMIEN');
    });
  });

  describe('Conform wipes non-weekly keys', () => {
    it('wipes daily keys (post-Conform slate is pure-Canonical)', () => {
      const horntail = getBossByFamily('horntail')!;
      const horntailDaily = buildKey(horntail.id, 'chaos', 'daily');
      const start = MuleBossSlate.from([horntailDaily]);
      const result = start.applyCanonical('CRA');
      expect(result.changed).toBe(true);
      expect(result.slate.keys).not.toContain(horntailDaily);
      expect(result.slate.matchedCanonical()).toBe('CRA');
    });

    it('wipes monthly keys (post-Conform slate is pure-Canonical)', () => {
      const blackMage = getBossByFamily('black-mage')!;
      const bmExtreme = buildKey(blackMage.id, 'extreme', 'monthly');
      const start = MuleBossSlate.from([bmExtreme]);
      const result = start.applyCanonical('CRA');
      expect(result.changed).toBe(true);
      expect(result.slate.keys).not.toContain(bmExtreme);
      expect(result.slate.matchedCanonical()).toBe('CRA');
    });
  });

  describe('Weekly Crystal Cap', () => {
    it('a normalised LOMIEN apply is cap-valid (≤ 14 weeklies, all Default Tier)', () => {
      const empty = MuleBossSlate.from([]);
      const result = empty.applyCanonical('LOMIEN');
      expect(result.slate.weeklyCount).toBeLessThanOrEqual(14);
      expect(new Set(result.slate.keys)).toEqual(new Set(LOMIEN_KEYS));
    });

    it('over-cap input prior to apply is trimmed by the Weekly Crystal Cap', () => {
      // Fabricate 15 distinct weeklies on non-CRA families so Conform wipes
      // them and replaces with the 11 CRA Default-Tier keys; the result
      // must be cap-valid.
      const craFamilies: ReadonlySet<string> = new Set(PRESET_FAMILIES.CRA);
      const extras: string[] = [];
      for (const b of bosses) {
        if (craFamilies.has(b.family)) continue;
        const diff = b.difficulty.find((d) => d.cadence === 'weekly');
        if (!diff) continue;
        extras.push(buildKey(b.id, diff.tier, diff.cadence));
        if (extras.length >= 15) break;
      }
      const start = MuleBossSlate.from(extras);
      const result = start.applyCanonical('CRA');
      expect(result.changed).toBe(true);
      expect(result.slate.weeklyCount).toBeLessThanOrEqual(14);
      expect(new Set(result.slate.keys)).toEqual(new Set(CRA_KEYS));
    });
  });

  describe('World Group inheritance', () => {
    it('inherits the receiver world group (slate matches via canonical)', () => {
      // Construct via Interactive group; result should still satisfy
      // matchedCanonical (the canonical match is World-Group-agnostic).
      const interactive = MuleBossSlate.from([], 'Interactive');
      const result = interactive.applyCanonical('CRA');
      expect(result.changed).toBe(true);
      expect(result.slate.matchedCanonical()).toBe('CRA');
    });
  });

  describe('idempotence', () => {
    it('applyCanonical(CRA) on the result of applyCanonical(CRA) is changed: false', () => {
      const empty = MuleBossSlate.from([]);
      const once = empty.applyCanonical('CRA');
      const twice = once.slate.applyCanonical('CRA');
      expect(twice.changed).toBe(false);
      expect(twice.slate).toBe(once.slate);
    });
  });

  describe('result conforms to Full-Slate Equality with the requested preset', () => {
    it.each([
      ['CRA', PRESET_FAMILIES.CRA],
      ['LOMIEN', PRESET_FAMILIES.LOMIEN],
      ['CTENE', PRESET_FAMILIES.CTENE],
    ] as const)('preset %s lights post-apply from empty', (presetKey, families) => {
      const empty = MuleBossSlate.from([]);
      const result = empty.applyCanonical(presetKey);
      expect(result.slate.matchedCanonical()).toBe(presetKey);
      // Every preset entry's family resolves to a key in the slate.
      const keys = new Set(result.slate.keys);
      for (const entry of families) {
        const family = presetEntryFamily(entry);
        const boss = getBossByFamily(family)!;
        // At least one weekly key on this family is present.
        const present = Array.from(keys).some((k) => k.startsWith(`${boss.id}:`));
        expect(present).toBe(true);
      }
      // No daily, no monthly.
      expect(result.slate.dailyCount).toBe(0);
      expect(result.slate.monthlyCount).toBe(0);
    });
  });
});
