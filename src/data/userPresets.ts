/**
 * **User Preset** — a player-authored, persisted snapshot of a **Mule's**
 * **Boss Slate**. Fields:
 *
 * - `id` — opaque identifier (uuid), stable across the preset's lifetime.
 * - `name` — display name. Trimmed, non-empty, ≤ 40 chars,
 *   case-insensitive unique within the global library. Validation lives
 *   in `useUserPresets`; this type is the on-disk shape only.
 * - `slateKeys` — the captured **Slate Keys** at save time. Order is not
 *   meaningful (set semantics); `MuleBossSlate.matchedUserPreset` compares
 *   as a set.
 * - `partySizes` — captured **Party Sizes** at save time, restricted to
 *   families that appear in `slateKeys` (capture-only-snapshot-families).
 *   Default-aware: absent and `1` are equivalent at match time.
 *
 * The library is global — not scoped to **Mule**, **World**, or **World
 * Group**. Persisted by `UserPresetStore` under its own `localStorage`
 * key with an independent **Storage Lineage**.
 *
 * The **User Preset Match** rule itself lives module-private inside
 * `muleBossSlate.ts`; callers reach it via `slate.matchedUserPreset(...)`.
 */
export interface UserPreset {
  id: string;
  name: string;
  slateKeys: readonly string[];
  partySizes: Record<string, number>;
}
