import { useCallback, useMemo, useState } from 'react';
import type { Mule } from '../../../types';
import { MuleBossSlate, type SlateFamily } from '../../../data/muleBossSlate';
import { conform, isPresetActive } from '../../../data/bossPresets';
import { resolveWorldGroup } from '../../../data/worlds';
import type { CadenceFilter, PresetKey } from '../../MatrixToolbar';
import { usePresetPill } from './usePresetPill';

const PARTY_SIZE_MIN = 1;
const PARTY_SIZE_MAX = 6;

/**
 * Narrow `SlateFamily[]` to families whose rows include at least one row with
 * the requested cadence. Applied post-`slate.view(search)` so the cadence
 * filter composes with the search filter without reshaping slate internals.
 */
function filterFamiliesByCadence(families: SlateFamily[], filter: CadenceFilter): SlateFamily[] {
  if (filter === 'All') return families;
  const cadence = filter === 'Weekly' ? 'weekly' : 'daily';
  return families.filter((f) => f.rows.some((r) => r.cadence === cadence));
}

/**
 * Owns the Boss Matrix view state for the drawer:
 *
 * - Search + cadence-filter composition with the `MuleBossSlate.view`
 *   projection.
 * - **Preset Pill** semantics — delegated to `usePresetPill`. The hook
 *   owns the `customClicked` override, the `activePill` derivation, the
 *   **Mule Switch** auto-reset, and the selection-empty auto-reset.
 *   `useBossMatrixView` only routes user actions: `applyPreset('CUSTOM')`
 *   → `pill.clickCustom()`; canonical clicks → `pill.clickCanonical()`
 *   followed by **Conform** (when not already the **Active Pill**); a
 *   `toggleKey` whose `next.weeklyCount` differs from the current
 *   `slate.weeklyCount` → `pill.notifyWeeklyToggle()` (daily toggles leave
 *   the override intact since they can't change canonical match status);
 *   `resetBosses` → `pill.notifyReset()`.
 * - Party-Size Clamp to [1, 6] on write.
 * - Toggle / reset dispatches routed through `onUpdate`. All dispatchers
 *   no-op when `muleId === null`.
 * - `search` and `filter` auto-reset on Mule Switch (render-time pattern).
 * - `stablePartySizes` keeps identity stable across renders when the
 *   `partySizes` prop does not change, matching the prior drawer-local
 *   `useMemo` so `BossMatrix` can rely on referential equality.
 */
export function useBossMatrixView({
  muleId,
  selectedBosses,
  partySizes,
  worldId,
  onUpdate,
}: {
  muleId: string | null;
  selectedBosses: readonly string[];
  partySizes: Mule['partySizes'];
  /**
   * Edited mule's **World Id**. Resolved to a **World Group** so BossMatrix
   * cells and Crystal Tally totals reflect the prices this mule actually
   * earns. Unset / unrecognized → Heroic (matches pre-World-Pricing).
   */
  worldId?: Mule['worldId'];
  onUpdate: (id: string, patch: Partial<Omit<Mule, 'id'>>) => void;
}): {
  search: string;
  setSearch: (s: string) => void;
  filter: CadenceFilter;
  setFilter: (f: CadenceFilter) => void;
  visibleBosses: SlateFamily[];
  weeklyCount: number;
  dailyCount: number;
  monthlyCount: number;
  activePill: PresetKey | null;
  stablePartySizes: Record<string, number>;
  toggleKey: (key: string) => void;
  applyPreset: (preset: PresetKey) => void;
  setPartySize: (family: string, n: number) => void;
  resetBosses: () => void;
} {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CadenceFilter>('All');

  // Reset search + filter on Mule Switch via the render-time pattern (same
  // shape as useMuleIdentityDraft's Draft Source Resync). The preset-pill side
  // of the Mule Switch reset lives in usePresetPill.
  const [lastMuleId, setLastMuleId] = useState<string | null>(muleId);
  if (lastMuleId !== muleId) {
    setLastMuleId(muleId);
    setSearch('');
    setFilter('All');
  }

  const worldGroup = resolveWorldGroup(worldId);

  const slate = useMemo(
    () => MuleBossSlate.from(selectedBosses, worldGroup),
    [selectedBosses, worldGroup],
  );

  const visibleBosses = useMemo(
    () =>
      filterFamiliesByCadence(slate.view(search), filter).filter((f) => f.family !== 'black-mage'),
    [slate, search, filter],
  );

  const pill = usePresetPill({
    muleId,
    selectedBosses,
    weeklyCount: slate.weeklyCount,
  });

  const stablePartySizes = useMemo(() => partySizes ?? {}, [partySizes]);

  const toggleKey = useCallback(
    (key: string) => {
      if (!muleId) return;
      const next = slate.toggle(key);
      // A weekly toggle can change canonical match status, so the Custom
      // override (which only exists to confirm a click) is no longer
      // needed — let the derivation decide which pill lights. Daily
      // toggles never change match status, so the override persists.
      if (next.weeklyCount !== slate.weeklyCount) pill.notifyWeeklyToggle();
      onUpdate(muleId, { selectedBosses: next.keys as string[] });
    },
    [muleId, slate, onUpdate, pill],
  );

  const applyPreset = useCallback(
    (preset: PresetKey) => {
      if (!muleId) return;
      if (preset === 'CUSTOM') {
        // **Custom Preset** has no entries — the click doesn't touch the
        // selection, but it flips the override so the pill confirms the
        // click (visually winning over any canonical match).
        pill.clickCustom();
        return;
      }
      // Canonical click clears the override; the derivation takes over.
      pill.clickCanonical();
      // Already conforms: no state churn, no persist fire. Use
      // `isPresetActive` directly since the CUSTOM override would otherwise
      // hide a real canonical match from `activePill`.
      if (isPresetActive(preset, selectedBosses)) return;
      const next = conform(slate.keys, preset);
      onUpdate(muleId, {
        selectedBosses: MuleBossSlate.from(next).keys as string[],
      });
    },
    [muleId, slate, selectedBosses, onUpdate, pill],
  );

  const setPartySize = useCallback(
    (family: string, n: number) => {
      if (!muleId) return;
      const clamped = Math.max(PARTY_SIZE_MIN, Math.min(PARTY_SIZE_MAX, n));
      onUpdate(muleId, {
        partySizes: { ...stablePartySizes, [family]: clamped },
      });
    },
    [muleId, stablePartySizes, onUpdate],
  );

  const resetBosses = useCallback(() => {
    if (!muleId) return;
    // Reset is authoritative: always clear the Custom override, even when the
    // selection is already empty (the transition effect wouldn't fire).
    pill.notifyReset();
    onUpdate(muleId, { selectedBosses: [], partySizes: {} });
  }, [muleId, onUpdate, pill]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    visibleBosses,
    weeklyCount: slate.weeklyCount,
    dailyCount: slate.dailyCount,
    monthlyCount: slate.monthlyCount,
    activePill: pill.activePill,
    stablePartySizes,
    toggleKey,
    applyPreset,
    setPartySize,
    resetBosses,
  };
}
