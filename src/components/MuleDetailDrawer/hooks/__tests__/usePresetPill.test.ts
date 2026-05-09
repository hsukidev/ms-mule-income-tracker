import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { usePresetPill } from '../usePresetPill';
import { bosses } from '../../../../data/bosses';
import { PRESET_FAMILIES, presetEntryKey } from '../../../../data/bossPresets';
import { MuleBossSlate } from '../../../../data/muleBossSlate';
import type { UserPreset } from '../../../../data/userPresets';

const CRA_KEYS = PRESET_FAMILIES.CRA.map((entry) => presetEntryKey(entry)!);
const LOMIEN_KEYS = PRESET_FAMILIES.LOMIEN.map((entry) => presetEntryKey(entry)!);

const BALDRIX_BOSS = bosses.find((b) => b.family === 'baldrix')!;
const BALDRIX_KEY = `${BALDRIX_BOSS.id}:hard:weekly`;

const HORNTAIL_BOSS = bosses.find((b) => b.family === 'horntail')!;
const HORNTAIL_DAILY = `${HORNTAIL_BOSS.id}:chaos:daily`;

function preset(
  id: string,
  name: string,
  slateKeys: readonly string[],
  partySizes: Record<string, number> = {},
): UserPreset {
  return { id, name, slateKeys, partySizes };
}

describe('usePresetPill', () => {
  it('returns null on empty selection with no presets', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from([]),
        selectedBosses: [],
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBeNull();
    expect(result.current.matchedUserPreset).toBeNull();
  });

  it('returns the canonical match when no User Preset matches', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from(LOMIEN_KEYS),
        selectedBosses: LOMIEN_KEYS,
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBe('LOMIEN');
    expect(result.current.matchedUserPreset).toBeNull();
  });

  it('returns CUSTOM when a User Preset Match exists, even on a CRA-equal slate', () => {
    const userPreset = preset('p1', 'My CRA', CRA_KEYS);
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from(CRA_KEYS),
        selectedBosses: CRA_KEYS,
        partySizes: {},
        userPresets: [userPreset],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
    expect(result.current.matchedUserPreset).toBe(userPreset);
  });

  it('returns matchedUserPreset when slate matches saved preset (custom keys)', () => {
    const customKeys = [BALDRIX_KEY, HORNTAIL_DAILY];
    const userPreset = preset('p1', 'Mine', customKeys);
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from(customKeys),
        selectedBosses: customKeys,
        partySizes: {},
        userPresets: [userPreset],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
    expect(result.current.matchedUserPreset).toBe(userPreset);
  });

  it('returns CUSTOM (no match) when ≥1 slate key but no User Preset Match and no canonical match', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from([BALDRIX_KEY]),
        selectedBosses: [BALDRIX_KEY],
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
    expect(result.current.matchedUserPreset).toBeNull();
  });

  it('demotes a CRA-equal slate to CUSTOM when a daily key is present (Full-Slate Equality)', () => {
    const keys = [...CRA_KEYS, HORNTAIL_DAILY];
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from(keys),
        selectedBosses: keys,
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
  });

  it('demotes a CRA-equal slate to CUSTOM when a monthly key is present', () => {
    const blackMage = bosses.find((b) => b.family === 'black-mage')!;
    const bmExtreme = `${blackMage.id}:extreme:monthly`;
    const keys = [...CRA_KEYS, bmExtreme];
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from(keys),
        selectedBosses: keys,
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
  });

  it('lights CUSTOM on a daily-only slate', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        slate: MuleBossSlate.from([HORNTAIL_DAILY]),
        selectedBosses: [HORNTAIL_DAILY],
        partySizes: {},
        userPresets: [],
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
  });

  it('returned object identity is stable across rerenders that do not change inputs', () => {
    const stableSelected: string[] = CRA_KEYS as string[];
    const stableSlate = MuleBossSlate.from(stableSelected);
    const stablePartySizes: Record<string, number> = {};
    const stableUserPresets: UserPreset[] = [];
    const { result, rerender } = renderHook(
      ({
        slate,
        selectedBosses,
        partySizes,
        userPresets,
      }: {
        slate: MuleBossSlate;
        selectedBosses: string[];
        partySizes: Record<string, number>;
        userPresets: UserPreset[];
      }) => usePresetPill({ slate, selectedBosses, partySizes, userPresets }),
      {
        initialProps: {
          slate: stableSlate,
          selectedBosses: stableSelected,
          partySizes: stablePartySizes,
          userPresets: stableUserPresets,
        },
      },
    );

    const first = result.current;
    expect(first.activePill).toBe('CRA');

    // Rerender with the same input references — memo should preserve identity.
    rerender({
      slate: stableSlate,
      selectedBosses: stableSelected,
      partySizes: stablePartySizes,
      userPresets: stableUserPresets,
    });
    expect(Object.is(result.current, first)).toBe(true);
  });

  it('returned object identity changes when selectedBosses changes', () => {
    const { result, rerender } = renderHook(
      ({ selectedBosses }: { selectedBosses: string[] }) =>
        usePresetPill({
          slate: MuleBossSlate.from(selectedBosses),
          selectedBosses,
          partySizes: {},
          userPresets: [],
        }),
      { initialProps: { selectedBosses: [] as string[] } },
    );

    const before = result.current;
    expect(before.activePill).toBeNull();

    rerender({ selectedBosses: CRA_KEYS as string[] });
    expect(result.current.activePill).toBe('CRA');
    expect(Object.is(result.current, before)).toBe(false);
  });
});
