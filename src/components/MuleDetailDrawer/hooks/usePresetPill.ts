import { useMemo } from 'react';
import { isPresetActive, type CanonicalPresetKey } from '../../../data/bossPresets';
import { userPresetMatch, type UserPreset } from '../../../data/userPresets';
import type { PresetKey } from '../../MatrixToolbar';

const CANONICAL_PRESETS: readonly CanonicalPresetKey[] = ['CRA', 'LOMIEN', 'CTENE'];

/**
 * Owns the **Active Pill** derivation. Pure now that the **User Preset
 * Popover** owns the click-state for the **Custom Preset** pill — there's
 * no transient override and no notify channels.
 *
 * Derivation order (highest priority first):
 * 1. **User Preset Match** → `'CUSTOM'`. A saved **User Preset** whose
 *    `slateKeys` set-equals the current slate beats every Canonical
 *    match.
 * 2. **Full-Slate Equality** with a **Canonical Preset** → that preset.
 * 3. ≥ 1 **Slate Key** of any cadence → `'CUSTOM'` (fallthrough).
 * 4. Empty slate → `null`.
 *
 * Pure derivation: no `customClicked` override, no auto-clear effects,
 * no `clickCustom` / `clickCanonical` / `notifyWeeklyToggle` /
 * `notifyReset`. The popover (and a saved-preset match) is the
 * authoritative way for the **Custom Preset** pill to light.
 */
export function usePresetPill({
  selectedBosses,
  partySizes,
  userPresets,
}: {
  selectedBosses: readonly string[];
  partySizes: Record<string, number>;
  userPresets: readonly UserPreset[];
}): {
  activePill: PresetKey | null;
  matchedUserPreset: UserPreset | null;
} {
  return useMemo(() => {
    const matchedUserPreset = userPresetMatch(
      { slateKeys: selectedBosses, partySizes },
      userPresets,
    );
    if (matchedUserPreset) return { activePill: 'CUSTOM', matchedUserPreset };
    if (selectedBosses.length === 0) return { activePill: null, matchedUserPreset: null };
    const canonical = CANONICAL_PRESETS.find((p) => isPresetActive(p, selectedBosses));
    if (canonical) return { activePill: canonical, matchedUserPreset: null };
    return { activePill: 'CUSTOM', matchedUserPreset: null };
  }, [selectedBosses, partySizes, userPresets]);
}
