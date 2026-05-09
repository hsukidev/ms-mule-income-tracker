import type { Boss, BossCadence, BossDifficulty, BossTier } from '../types';
import { getBossByFamily } from './bosses';

/**
 * **Boss Preset** shortcuts for the **Matrix Toolbar**. Each preset is an
 * ordered list of **Preset Entries**; clicking a **Preset Pill** runs
 * **Conform**, which wipes every non-weekly **Slate Key** plus weekly keys
 * outside the preset, and replaces non-**Accepted Tier** keys with the
 * **Default Tier**. The post-Conform slate is always pure-Canonical.
 *
 * Entry authoring forms:
 * - Bare string — family slug; **Accepted Tiers** = `[hardest]`.
 * - `{ family, tier }` — legacy single-tier pin; desugars to `tiers: [tier]`.
 * - `{ family, tiers }` — **Multi-Tier Entry** (e.g. LOMIEN's Damien and
 *   Lotus `['normal', 'hard']`); `tiers[0]` is the **Default Tier**.
 *
 * **Full-Slate Equality**: a **Canonical Preset** is **Active Preset** iff
 * every **Preset Entry** is satisfied by exactly one weekly key on that
 * family whose tier is in **Accepted Tiers**, no weekly keys exist on
 * families outside the preset's entries, AND the slate carries zero daily
 * and zero monthly keys. Toggling a single non-weekly cell on a CRA-active
 * mule demotes the match to **Custom Preset**.
 *
 * The selection-key grammar itself lives module-private inside
 * `muleBossSlate.ts`; the helpers here duplicate only the string shape,
 * because every key this module produces flows through `MuleBossSlate.from`
 * or `slate.toggle` downstream where the **Selection Invariant** is actually
 * enforced.
 */

/**
 * **Canonical Preset Keys** — the three curated presets that have an entries
 * list, a **Conform** behaviour, and a **Full-Slate Equality** match rule.
 */
export type CanonicalPresetKey = 'CRA' | 'LOMIEN' | 'CTENE';

/**
 * **Preset Key** — any **Preset Pill** that can be the **Active Pill**.
 * `'CUSTOM'` is the reflective fourth pill that lights up when the **Mule's**
 * weekly selection is non-empty but doesn't match any **Canonical Preset**;
 * it has no entries and clicking it is inert.
 */
export type PresetKey = CanonicalPresetKey | 'CUSTOM';

/** Authoring form for a preset entry; normalized via `normalizeEntry`. */
export type PresetFamily =
  | string
  | { family: string; tier: BossTier }
  | { family: string; tiers: readonly BossTier[] };

/** Normalized **Preset Entry**; `tiers[0]` is the **Default Tier**. */
export interface PresetEntry {
  family: string;
  tiers: readonly BossTier[];
}

/** Shallow-parsed segments of a `<bossId>:<tier>:<cadence>` selection key. */
export interface ParsedKey {
  bossId: string;
  tier: string;
  cadence: string;
}

/** Split a selection key on its last two colons; `null` if malformed. */
export function parseKey(key: string): ParsedKey | null {
  const lastColon = key.lastIndexOf(':');
  if (lastColon < 0) return null;
  const tierColon = key.lastIndexOf(':', lastColon - 1);
  if (tierColon < 0) return null;
  return {
    bossId: key.slice(0, tierColon),
    tier: key.slice(tierColon + 1, lastColon),
    cadence: key.slice(lastColon + 1),
  };
}

function buildSelectionKey(bossId: string, tier: BossTier, cadence: BossCadence): string {
  return `${bossId}:${tier}:${cadence}`;
}

/**
 * Hardest-Tier difficulty — biggest `crystalValue` wins, tier name ignored.
 * Compared on the Heroic world price: the Heroic/Interactive ordering is
 * monotonic for every boss in the matrix, so either world yields the same
 * winner.
 */
function pickHardest(boss: Boss): BossDifficulty {
  return boss.difficulty.reduce((best, d) =>
    d.crystalValue.Heroic > best.crystalValue.Heroic ? d : best,
  );
}

/**
 * Desugar an authoring-form entry into a normalized `PresetEntry`. Bare
 * strings resolve **Default Tier** to the boss's **Hardest Tier**; legacy
 * `{ family, tier }` becomes `tiers: [tier]`; `{ family, tiers }` passes
 * through. Returns `null` for unknown families.
 */
export function normalizeEntry(spec: PresetFamily): PresetEntry | null {
  if (typeof spec === 'string') {
    const boss = getBossByFamily(spec);
    if (!boss) return null;
    return { family: spec, tiers: [pickHardest(boss).tier] };
  }
  if ('tiers' in spec) return { family: spec.family, tiers: spec.tiers };
  return { family: spec.family, tiers: [spec.tier] };
}

export const PRESET_FAMILIES = {
  CRA: [
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
  ],
  LOMIEN: [
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
    'akechi-mitsuhide',
    { family: 'lotus', tiers: ['normal', 'hard'] },
    { family: 'damien', tiers: ['normal', 'hard'] },
  ],
  CTENE: [
    'akechi-mitsuhide',
    'princess-no',
    'darknell',
    'verus-hilla',
    'gloom',
    'will',
    'lucid',
    'guardian-angel-slime',
    'damien',
    { family: 'lotus', tier: 'hard' },
    'vellum',
    'crimson-queen',
    'papulatus',
    'magnus',
  ],
} as const satisfies Record<CanonicalPresetKey, readonly PresetFamily[]>;

/** Resolved **Default Tier** selection key for an entry, or `null`. */
export function presetEntryKey(spec: PresetFamily): string | null {
  const entry = normalizeEntry(spec);
  if (!entry) return null;
  return defaultTierKey(entry);
}

/** Family slug for an authoring-form entry. */
export function presetEntryFamily(spec: PresetFamily): string {
  return typeof spec === 'string' ? spec : spec.family;
}

/** Resolved **Default Tier** key for a normalized entry, or `null`. */
function defaultTierKey(entry: PresetEntry): string | null {
  const boss = getBossByFamily(entry.family);
  if (!boss) return null;
  const diff = boss.difficulty.find((d) => d.tier === entry.tiers[0]);
  if (!diff) return null;
  return buildSelectionKey(boss.id, diff.tier, diff.cadence);
}
