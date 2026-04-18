import type { BossTier } from '../types';
import { bosses, getBossById, TIER_LESS_FAMILIES } from './bosses';
import { formatMeso } from '../utils/meso';

/**
 * Selection-key format (slice 1B): `<bossUuid>:<tier>`.
 *
 * Each mule's `selectedBosses` is an array of these keys. Use `makeKey` and
 * `parseKey` to construct / decode rather than string arithmetic.
 */

/** Tier order used by the Matrix component (columns, easy → extreme). */
export const TIER_ORDER: BossTier[] = ['easy', 'normal', 'hard', 'chaos', 'extreme'];

const TIER_SET: ReadonlySet<BossTier> = new Set(TIER_ORDER);

/**
 * Capitalized difficulty labels used by the pre-1A UI (renders "Hard Lucid",
 * difficulty pip colors, etc.). Distinct from the `BossDifficulty` *interface*
 * in `../types` that holds the `{ tier, crystalValue, contentType }` shape.
 */
export type BossDifficultyLabel = 'Extreme' | 'Chaos' | 'Hard' | 'Normal' | 'Easy';

const TIER_LABEL: Record<BossTier, BossDifficultyLabel> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  chaos: 'Chaos',
  extreme: 'Extreme',
};

const DIFFICULTY_PREFIX = /^(Extreme|Chaos|Hard|Normal|Easy) /;

export function getDifficulty(name: string): BossDifficultyLabel | null {
  const m = name.match(DIFFICULTY_PREFIX);
  return (m?.[1] as BossDifficultyLabel) ?? null;
}

/** Build a native selection key from a boss id and tier. */
export function makeKey(bossId: string, tier: BossTier): string {
  return `${bossId}:${tier}`;
}

/** Parse a selection key. Returns null if malformed, unknown boss, or tier not offered. */
export function parseKey(key: string): { bossId: string; tier: BossTier } | null {
  const colon = key.lastIndexOf(':');
  if (colon < 0) return null;
  const bossId = key.slice(0, colon);
  const tierStr = key.slice(colon + 1);
  if (!TIER_SET.has(tierStr as BossTier)) return null;
  const boss = getBossById(bossId);
  if (!boss) return null;
  const tier = tierStr as BossTier;
  if (!boss.difficulty.some((d) => d.tier === tier)) return null;
  return { bossId, tier };
}

/** Resolve a selection key to its boss + tier difficulty entry, or null. */
function resolveKey(key: string) {
  const parsed = parseKey(key);
  if (!parsed) return null;
  const boss = getBossById(parsed.bossId)!;
  const diff = boss.difficulty.find((d) => d.tier === parsed.tier)!;
  return { boss, diff, tier: parsed.tier };
}

/**
 * Row shape for both the existing BossCheckboxList (uses `id`, `name`,
 * `crystalValue`, `formattedValue`, `difficulty`, `selected`) and the future
 * Matrix (uses `bossId`, `tier`, `key`, `crystalValue`, `selected`).
 */
export interface FamilyRow {
  bossId: string;
  tier: BossTier;
  key: string;
  /** Alias of `key` so existing CheckboxList code (boss.id) keeps working. */
  id: string;
  /** Display label — "<Tier> <Family>" for tiered families, bare family name otherwise. */
  name: string;
  crystalValue: number;
  formattedValue: string;
  /** Capitalized label for the pip color (null for tier-less families). */
  difficulty: BossDifficultyLabel | null;
  selected: boolean;
}

export interface FamilyView {
  family: string;
  displayName: string;
  bosses: FamilyRow[];
}

function rowLabel(family: string, tier: BossTier, familyName: string): string {
  return TIER_LESS_FAMILIES.has(family) ? familyName : `${TIER_LABEL[tier]} ${familyName}`;
}

export function validateBossSelection(keys: string[]): string[] {
  const valid = keys.filter((k) => parseKey(k) !== null);
  const familyWinners = new Map<string, string>();
  for (const key of valid) {
    const { bossId } = parseKey(key)!;
    const current = familyWinners.get(bossId);
    const currentValue = current ? resolveKey(current)!.diff.crystalValue : -Infinity;
    const incoming = resolveKey(key)!.diff.crystalValue;
    if (incoming > currentValue) familyWinners.set(bossId, key);
  }
  const winnerKeys = new Set(familyWinners.values());
  return valid.filter((k) => winnerKeys.has(k));
}

export function toggleBoss(keys: string[], bossId: string, tier: BossTier): string[] {
  const boss = getBossById(bossId);
  if (!boss) return keys;
  if (!boss.difficulty.some((d) => d.tier === tier)) return keys;

  const target = makeKey(bossId, tier);
  const existingKey = keys.find((k) => parseKey(k)?.bossId === bossId);
  if (existingKey === target) return keys.filter((k) => k !== target);
  if (existingKey) return keys.map((k) => (k === existingKey ? target : k));
  return [...keys, target];
}

// Precomputed top crystalValue per family → sort comparator stays O(1) lookup.
const familyTopCrystal = new Map<string, number>(
  bosses.map((b) => [b.family, Math.max(...b.difficulty.map((d) => d.crystalValue))]),
);

export function getFamilies(
  keys: string[],
  search: string,
  { abbreviated = true }: { abbreviated?: boolean } = {},
): FamilyView[] {
  const selectedSet = new Set(keys);

  const families: FamilyView[] = bosses
    .slice()
    .sort((a, b) => familyTopCrystal.get(b.family)! - familyTopCrystal.get(a.family)!)
    .map((boss) => ({
      family: boss.family,
      displayName: boss.name,
      bosses: boss.difficulty
        .slice()
        .sort((a, b) => b.crystalValue - a.crystalValue)
        .map((diff): FamilyRow => {
          const key = makeKey(boss.id, diff.tier);
          return {
            bossId: boss.id,
            tier: diff.tier,
            key,
            id: key,
            name: rowLabel(boss.family, diff.tier, boss.name),
            crystalValue: diff.crystalValue,
            formattedValue: formatMeso(diff.crystalValue, abbreviated),
            difficulty: TIER_LESS_FAMILIES.has(boss.family) ? null : TIER_LABEL[diff.tier],
            selected: selectedSet.has(key),
          };
        }),
    }));

  if (!search) return families;

  const lower = search.toLowerCase();
  return families.filter(
    (f) =>
      f.family.toLowerCase().includes(lower) ||
      f.displayName.toLowerCase().includes(lower) ||
      f.bosses.some((b) => b.name.toLowerCase().includes(lower)),
  );
}
