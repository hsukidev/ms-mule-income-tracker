import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { usePresetPill } from '../usePresetPill';
import { bosses } from '../../../../data/bosses';
import { PRESET_FAMILIES, presetEntryKey } from '../../../../data/bossPresets';
import { MuleBossSlate } from '../../../../data/muleBossSlate';

const CRA_KEYS = PRESET_FAMILIES.CRA.map((entry) => presetEntryKey(entry)!);
const LOMIEN_KEYS = PRESET_FAMILIES.LOMIEN.map((entry) => presetEntryKey(entry)!);

const BALDRIX_BOSS = bosses.find((b) => b.family === 'baldrix')!;
const BALDRIX_KEY = `${BALDRIX_BOSS.id}:hard:weekly`;

function weeklyCountOf(keys: readonly string[]): number {
  return MuleBossSlate.from(keys).weeklyCount;
}

describe('usePresetPill', () => {
  it('clickCustom lights "CUSTOM" even on empty selection', () => {
    const { result } = renderHook(() =>
      usePresetPill({ muleId: 'mule-1', selectedBosses: [], weeklyCount: 0 }),
    );
    expect(result.current.activePill).toBeNull();

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');
  });

  it('clickCanonical clears the override and lets derivation pick', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        muleId: 'mule-1',
        selectedBosses: CRA_KEYS,
        weeklyCount: weeklyCountOf(CRA_KEYS),
      }),
    );

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');

    act(() => {
      result.current.clickCanonical();
    });
    // Override cleared; derivation picks the canonical match.
    expect(result.current.activePill).toBe('CRA');
  });

  it('notifyWeeklyToggle clears the override', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        muleId: 'mule-1',
        selectedBosses: CRA_KEYS,
        weeklyCount: weeklyCountOf(CRA_KEYS),
      }),
    );

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');

    act(() => {
      result.current.notifyWeeklyToggle();
    });
    // Override cleared; derivation reasserts canonical match.
    expect(result.current.activePill).toBe('CRA');
  });

  it('notifyReset clears the override', () => {
    const { result } = renderHook(() =>
      usePresetPill({ muleId: 'mule-1', selectedBosses: [], weeklyCount: 0 }),
    );

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');

    act(() => {
      result.current.notifyReset();
    });
    expect(result.current.activePill).toBeNull();
  });

  it('Mule Switch (rerender with new muleId) clears the override', () => {
    const { result, rerender } = renderHook(
      ({ muleId }: { muleId: string | null }) =>
        usePresetPill({
          muleId,
          selectedBosses: CRA_KEYS,
          weeklyCount: weeklyCountOf(CRA_KEYS),
        }),
      { initialProps: { muleId: 'mule-1' as string | null } },
    );

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');

    rerender({ muleId: 'mule-2' });
    expect(result.current.activePill).toBe('CRA');
  });

  it('selection-empty transition clears the override', () => {
    const { result, rerender } = renderHook(
      ({ selectedBosses, weeklyCount }: { selectedBosses: string[]; weeklyCount: number }) =>
        usePresetPill({ muleId: 'mule-1', selectedBosses, weeklyCount }),
      {
        initialProps: {
          selectedBosses: CRA_KEYS,
          weeklyCount: weeklyCountOf(CRA_KEYS),
        },
      },
    );

    act(() => {
      result.current.clickCustom();
    });
    expect(result.current.activePill).toBe('CUSTOM');

    rerender({ selectedBosses: [], weeklyCount: 0 });
    // Selection went non-empty → empty: override cleared.
    expect(result.current.activePill).toBeNull();
  });

  it('activePill returns the canonical match when no override is active', () => {
    const { result } = renderHook(() =>
      usePresetPill({
        muleId: 'mule-1',
        selectedBosses: LOMIEN_KEYS,
        weeklyCount: weeklyCountOf(LOMIEN_KEYS),
      }),
    );
    expect(result.current.activePill).toBe('LOMIEN');
  });

  it('activePill returns null on empty weekly with no override', () => {
    const { result } = renderHook(() =>
      usePresetPill({ muleId: 'mule-1', selectedBosses: [], weeklyCount: 0 }),
    );
    expect(result.current.activePill).toBeNull();
  });

  it('activePill returns "CUSTOM" when weekly ≥ 1 but no canonical preset matches', () => {
    // Baldrix is weekly-cadence and outside every canonical preset.
    const { result } = renderHook(() =>
      usePresetPill({
        muleId: 'mule-1',
        selectedBosses: [BALDRIX_KEY],
        weeklyCount: weeklyCountOf([BALDRIX_KEY]),
      }),
    );
    expect(result.current.activePill).toBe('CUSTOM');
  });
});
