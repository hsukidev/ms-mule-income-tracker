import { describe, expect, it } from 'vitest';
import { MuleBossSlate } from '../muleBossSlate';
import { PRESET_FAMILIES, presetEntryKey } from '../bossPresets';
import { getBossByFamily } from '../bosses';

/**
 * Boundary tests for `MuleBossSlate.matchedCanonical` (issue #257).
 *
 * Slate-level absorption of **Full-Slate Equality**: returns the first
 * **Canonical Preset** whose every **Preset Entry** is satisfied by exactly
 * one weekly key on that family at an **Accepted Tier**, with no extraneous
 * weeklies and zero non-weekly keys. Searches in declaration order
 * (`CRA → LOMIEN → CTENE`).
 */

function buildKey(bossId: string, tier: string, cadence: string): string {
  return `${bossId}:${tier}:${cadence}`;
}

const CRA_KEYS = PRESET_FAMILIES.CRA.map((entry) => presetEntryKey(entry)!);
const LOMIEN_KEYS = PRESET_FAMILIES.LOMIEN.map((entry) => presetEntryKey(entry)!);
const CTENE_KEYS = PRESET_FAMILIES.CTENE.map((entry) => presetEntryKey(entry)!);

describe('MuleBossSlate.matchedCanonical', () => {
  it('empty slate returns null', () => {
    expect(MuleBossSlate.from([]).matchedCanonical()).toBeNull();
  });

  it('Default Tier match: CRA-equal slate returns CRA', () => {
    expect(MuleBossSlate.from(CRA_KEYS).matchedCanonical()).toBe('CRA');
  });

  it('Default Tier match: LOMIEN-equal slate returns LOMIEN', () => {
    expect(MuleBossSlate.from(LOMIEN_KEYS).matchedCanonical()).toBe('LOMIEN');
  });

  it('Default Tier match: CTENE-equal slate returns CTENE', () => {
    expect(MuleBossSlate.from(CTENE_KEYS).matchedCanonical()).toBe('CTENE');
  });

  it('Multi-Tier Entry match: LOMIEN with Hard Lotus + Hard Damien returns LOMIEN', () => {
    const lotus = getBossByFamily('lotus')!;
    const damien = getBossByFamily('damien')!;
    const swapped = LOMIEN_KEYS.filter(
      (k) => !k.startsWith(`${lotus.id}:`) && !k.startsWith(`${damien.id}:`),
    ).concat([buildKey(lotus.id, 'hard', 'weekly'), buildKey(damien.id, 'hard', 'weekly')]);
    expect(MuleBossSlate.from(swapped).matchedCanonical()).toBe('LOMIEN');
  });

  it('Multi-Tier Entry match: LOMIEN with Normal Lotus + Hard Damien returns LOMIEN', () => {
    const damien = getBossByFamily('damien')!;
    const swapped = LOMIEN_KEYS.filter((k) => !k.startsWith(`${damien.id}:`)).concat([
      buildKey(damien.id, 'hard', 'weekly'),
    ]);
    expect(MuleBossSlate.from(swapped).matchedCanonical()).toBe('LOMIEN');
  });

  it('demote on extraneous weekly key: CRA + extra Baldrix → null', () => {
    const baldrix = getBossByFamily('baldrix')!;
    const baldrixWeekly = buildKey(baldrix.id, 'hard', 'weekly');
    const slate = MuleBossSlate.from([...CRA_KEYS, baldrixWeekly]);
    expect(slate.matchedCanonical()).toBeNull();
  });

  it('demote on any daily key: CRA + Horntail Chaos daily → null', () => {
    const horntail = getBossByFamily('horntail')!;
    const horntailDaily = buildKey(horntail.id, 'chaos', 'daily');
    const slate = MuleBossSlate.from([...CRA_KEYS, horntailDaily]);
    expect(slate.matchedCanonical()).toBeNull();
  });

  it('demote on any monthly key: CRA + Black Mage Extreme monthly → null', () => {
    const blackMage = getBossByFamily('black-mage')!;
    const bmExtreme = buildKey(blackMage.id, 'extreme', 'monthly');
    const slate = MuleBossSlate.from([...CRA_KEYS, bmExtreme]);
    expect(slate.matchedCanonical()).toBeNull();
  });

  it('demote on any monthly key: LOMIEN + Black Mage Hard monthly → null', () => {
    const blackMage = getBossByFamily('black-mage')!;
    const bmHard = buildKey(blackMage.id, 'hard', 'monthly');
    const slate = MuleBossSlate.from([...LOMIEN_KEYS, bmHard]);
    expect(slate.matchedCanonical()).toBeNull();
  });

  it('demote on any daily key: CTENE + Horntail Chaos daily → null', () => {
    const horntail = getBossByFamily('horntail')!;
    const horntailDaily = buildKey(horntail.id, 'chaos', 'daily');
    const slate = MuleBossSlate.from([...CTENE_KEYS, horntailDaily]);
    expect(slate.matchedCanonical()).toBeNull();
  });

  it('demote on subset: CRA missing one family → null', () => {
    const magnus = getBossByFamily('magnus')!;
    const subset = CRA_KEYS.filter((k) => !k.startsWith(`${magnus.id}:`));
    expect(MuleBossSlate.from(subset).matchedCanonical()).toBeNull();
  });

  it('demote on non-accepted tier: LOMIEN with Extreme Lotus → null', () => {
    const lotus = getBossByFamily('lotus')!;
    const extremeLotus = buildKey(lotus.id, 'extreme', 'weekly');
    const swapped = LOMIEN_KEYS.filter((k) => !k.startsWith(`${lotus.id}:`)).concat([extremeLotus]);
    expect(MuleBossSlate.from(swapped).matchedCanonical()).toBeNull();
  });

  it('daily-only slate returns null', () => {
    const horntail = getBossByFamily('horntail')!;
    const horntailDaily = buildKey(horntail.id, 'chaos', 'daily');
    expect(MuleBossSlate.from([horntailDaily]).matchedCanonical()).toBeNull();
  });
});
