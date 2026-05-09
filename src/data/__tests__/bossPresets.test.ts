import { describe, expect, it } from 'vitest';
import {
  PRESET_FAMILIES,
  normalizeEntry,
  presetEntryFamily,
  presetEntryKey,
  type PresetFamily,
} from '../bossPresets';
import type { Boss, BossDifficulty } from '../../types';
import { bosses, getBossByFamily } from '../bosses';

/**
 * Data-shape tests for `bossPresets.ts`. The semantic rules
 * (**Full-Slate Equality**, **Conform**, **User Preset Match**) live on
 * `MuleBossSlate` — see `MuleBossSlate.applyCanonical.test.ts`,
 * `MuleBossSlate.matchedCanonical.test.ts`, and
 * `MuleBossSlate.matchedUserPreset.test.ts`. This file covers
 * `normalizeEntry` desugaring, **Multi-Tier Entry** handling, and
 * `presetEntryKey` resolution.
 */
function buildKey(
  bossId: string,
  tier: BossDifficulty['tier'],
  cadence: BossDifficulty['cadence'],
): string {
  return `${bossId}:${tier}:${cadence}`;
}

function pickHardest(boss: Boss): BossDifficulty {
  return boss.difficulty.reduce((best, d) =>
    d.crystalValue.Heroic > best.crystalValue.Heroic ? d : best,
  );
}

const CRA_FAMILIES = [
  'cygnus',
  'pink-bean',
  'vellum',
  'crimson-queen',
  'von-bon',
  'pierre',
  'papulatus',
  'hilla',
  'magnus',
  'zakum',
  'princess-no',
] as const;

const CTENE_OVERLAP = ['vellum', 'crimson-queen', 'papulatus', 'magnus', 'princess-no'] as const;

/** Resolved **Default Tier** key for a preset entry. */
function entryKey(entry: PresetFamily): string {
  return presetEntryKey(entry)!;
}

describe('PRESET_FAMILIES membership', () => {
  it('contains exactly the 11 CRA families in spec order', () => {
    expect(PRESET_FAMILIES.CRA).toEqual(CRA_FAMILIES);
  });

  it('every CRA family resolves to a known boss', () => {
    for (const f of PRESET_FAMILIES.CRA) {
      expect(bosses.find((b) => b.family === f)).toBeDefined();
    }
  });

  it('every CTENE family resolves to a known boss', () => {
    for (const entry of PRESET_FAMILIES.CTENE) {
      const family = presetEntryFamily(entry);
      expect(bosses.find((b) => b.family === family)).toBeDefined();
    }
  });

  it('every LOMIEN family resolves to a known boss', () => {
    for (const entry of PRESET_FAMILIES.LOMIEN) {
      const family = presetEntryFamily(entry);
      expect(bosses.find((b) => b.family === family)).toBeDefined();
    }
  });

  it('CRA ∩ CTENE shares Vellum, Crimson Queen, Papulatus, Magnus, Princess No', () => {
    const craSet: ReadonlySet<string> = new Set(PRESET_FAMILIES.CRA);
    const overlap = PRESET_FAMILIES.CTENE.map(presetEntryFamily).filter((f) => craSet.has(f));
    expect(new Set(overlap)).toEqual(new Set(CTENE_OVERLAP));
  });
});

describe('normalizeEntry', () => {
  it('resolves a bare family to Default Tier = Hardest Tier', () => {
    const entry = normalizeEntry('vellum')!;
    const vellum = getBossByFamily('vellum')!;
    expect(entry).toEqual({ family: 'vellum', tiers: [pickHardest(vellum).tier] });
  });

  it('desugars legacy { family, tier } to a single-element tiers list', () => {
    const entry = normalizeEntry({ family: 'lotus', tier: 'hard' })!;
    expect(entry).toEqual({ family: 'lotus', tiers: ['hard'] });
  });

  it('passes { family, tiers } through with tiers[0] as Default Tier', () => {
    const entry = normalizeEntry({ family: 'damien', tiers: ['normal', 'hard'] })!;
    expect(entry.family).toBe('damien');
    expect(entry.tiers).toEqual(['normal', 'hard']);
    expect(entry.tiers[0]).toBe('normal');
  });

  it('returns null for an unknown family', () => {
    expect(normalizeEntry('not-a-real-family')).toBeNull();
  });
});

describe('LOMIEN multi-tier entries', () => {
  it('Lotus and Damien accept both normal and hard', () => {
    const lotusEntry = PRESET_FAMILIES.LOMIEN.find(
      (e) => typeof e === 'object' && e.family === 'lotus',
    );
    const damienEntry = PRESET_FAMILIES.LOMIEN.find(
      (e) => typeof e === 'object' && e.family === 'damien',
    );
    expect(lotusEntry).toBeDefined();
    expect(damienEntry).toBeDefined();
    expect(normalizeEntry(lotusEntry!)!.tiers).toEqual(['normal', 'hard']);
    expect(normalizeEntry(damienEntry!)!.tiers).toEqual(['normal', 'hard']);
  });

  it('non-Lotus-non-Damien LOMIEN entries remain single-tier at Hardest Tier', () => {
    for (const spec of PRESET_FAMILIES.LOMIEN) {
      const family = presetEntryFamily(spec);
      if (family === 'lotus' || family === 'damien') continue;
      const entry = normalizeEntry(spec)!;
      expect(entry.tiers).toHaveLength(1);
      const boss = getBossByFamily(family)!;
      expect(entry.tiers[0]).toBe(pickHardest(boss).tier);
    }
  });

  it('LOMIEN default tier for Lotus and Damien is normal', () => {
    const lotus = getBossByFamily('lotus')!;
    const damien = getBossByFamily('damien')!;
    expect(entryKey({ family: 'lotus', tiers: ['normal', 'hard'] })).toBe(
      buildKey(lotus.id, 'normal', 'weekly'),
    );
    expect(entryKey({ family: 'damien', tiers: ['normal', 'hard'] })).toBe(
      buildKey(damien.id, 'normal', 'weekly'),
    );
  });
});

describe('presetEntryKey', () => {
  it('resolves a bare family slug to the Hardest Tier weekly key', () => {
    const vellum = getBossByFamily('vellum')!;
    const diff = pickHardest(vellum);
    expect(presetEntryKey('vellum')).toBe(buildKey(vellum.id, diff.tier, diff.cadence));
  });

  it('resolves a Multi-Tier Entry to the Default Tier (tiers[0]) key', () => {
    const lotus = getBossByFamily('lotus')!;
    expect(presetEntryKey({ family: 'lotus', tiers: ['normal', 'hard'] })).toBe(
      buildKey(lotus.id, 'normal', 'weekly'),
    );
  });

  it('resolves a legacy { family, tier } entry to that tier', () => {
    const lotus = getBossByFamily('lotus')!;
    expect(presetEntryKey({ family: 'lotus', tier: 'hard' })).toBe(
      buildKey(lotus.id, 'hard', 'weekly'),
    );
  });

  it('returns null for an unknown family', () => {
    expect(presetEntryKey('not-a-real-family')).toBeNull();
  });
});
