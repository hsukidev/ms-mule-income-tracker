/**
 * **User Preset** — a player-authored, persisted snapshot of a **Mule's**
 * **Boss Slate**. Fields:
 *
 * - `id` — opaque identifier (uuid), stable across the preset's lifetime.
 * - `name` — display name. Trimmed, non-empty, ≤ 40 chars,
 *   case-insensitive unique within the global library. Validation lives
 *   in `useUserPresets`; this type is the on-disk shape only.
 * - `slateKeys` — the captured **Slate Keys** at save time. Order is not
 *   meaningful (set semantics); `userPresetMatch` compares as a set.
 * - `partySizes` — captured **Party Sizes** at save time, restricted to
 *   families that appear in `slateKeys` (capture-only-snapshot-families).
 *   Default-aware: absent and `1` are equivalent at match time.
 *
 * The library is global — not scoped to **Mule**, **World**, or **World
 * Group**. Persisted by `UserPresetStore` under its own `localStorage`
 * key with an independent **Storage Lineage**.
 */
export interface UserPreset {
  id: string;
  name: string;
  slateKeys: readonly string[];
  partySizes: Record<string, number>;
}

/**
 * **User Preset Match** — return the **User Preset** whose snapshot
 * exactly equals the current state, or `null` when none matches.
 *
 * Slate-key equality is order-insensitive: `['a', 'b']` matches
 * `['b', 'a']`. The **Selection Invariant** rules out duplicate keys
 * upstream so a plain `Set` comparison is sufficient (no multiset
 * gymnastics required).
 *
 * **Party Sizes** equality is default-aware: for every family present in
 * `snapshot.partySizes`, `(current.partySizes[family] ?? 1) === (snapshot.partySizes[family] ?? 1)`.
 * Extraneous entries on the live mule for families not present in the
 * snapshot's `partySizes` are ignored — under capture-only-snapshot-families,
 * the snapshot's `partySizes` keys are exactly the families the snapshot
 * cares about. Legacy presets persisted before this rule shipped have
 * `partySizes: {}` and therefore match any current party-size state for
 * a slate-key-equal slate.
 *
 * Empty-vs-empty matches: a saved preset with `slateKeys: []` is the
 * **User Preset Match** for an empty slate.
 */
export function userPresetMatch(
  current: { slateKeys: readonly string[]; partySizes: Record<string, number> },
  userPresets: readonly UserPreset[],
): UserPreset | null {
  const targetKeys = new Set(current.slateKeys);
  for (const preset of userPresets) {
    if (preset.slateKeys.length !== targetKeys.size) continue;
    if (!preset.slateKeys.every((key) => targetKeys.has(key))) continue;
    if (!partySizesMatch(preset.partySizes, current.partySizes)) continue;
    return preset;
  }
  return null;
}

function partySizesMatch(
  snapshot: Record<string, number>,
  current: Record<string, number>,
): boolean {
  for (const family of Object.keys(snapshot)) {
    if ((snapshot[family] ?? 1) !== (current[family] ?? 1)) return false;
  }
  return true;
}
