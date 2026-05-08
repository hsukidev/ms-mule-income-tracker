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
 *
 * The library is global — not scoped to **Mule**, **World**, or **World
 * Group**. Persisted by `UserPresetStore` under its own `localStorage`
 * key with an independent **Storage Lineage**.
 */
export interface UserPreset {
  id: string;
  name: string;
  slateKeys: readonly string[];
}

/**
 * **User Preset Match** — return the **User Preset** whose `slateKeys`
 * exactly equals `slateKeys` as a set, or `null` when none matches.
 *
 * Order-insensitive: `['a', 'b']` matches `['b', 'a']`. The
 * **Selection Invariant** rules out duplicate keys upstream so a plain
 * `Set` comparison is sufficient (no multiset gymnastics required).
 *
 * Empty-vs-empty matches: a saved preset with `slateKeys: []` is the
 * **User Preset Match** for an empty slate. (Out-of-scope for this
 * slice's UI: empty presets can't be saved through the popover, but the
 * helper's contract stays honest.)
 */
export function userPresetMatch(
  slateKeys: readonly string[],
  userPresets: readonly UserPreset[],
): UserPreset | null {
  const target = new Set(slateKeys);
  for (const preset of userPresets) {
    if (preset.slateKeys.length !== target.size) continue;
    let allFound = true;
    for (const key of preset.slateKeys) {
      if (!target.has(key)) {
        allFound = false;
        break;
      }
    }
    if (allFound) return preset;
  }
  return null;
}
