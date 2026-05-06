import type { Mule } from '../types';
import type { MuleContribution } from '../modules/worldIncome';
import type { SlateKey } from '../data/muleBossSlate';

const EMPTY_DROPPED_KEYS: ReadonlyMap<SlateKey, number> = new Map<SlateKey, number>();

export interface RosterRowMetrics {
  /** Count of `:weekly` slate keys on the mule. Renders as `N/14`. */
  weeklyCount: number;
  /** Count of `:daily` slate keys on the mule. Renders as a bare `N`. */
  dailyCount: number;
  /** Post-cap meso the mule contributed to the world total. */
  postCapMeso: number;
  /** `postCapMeso / worldTotalContributedMeso`, zero-safe. Renders as `9.5% SHARE`. */
  sharePct: number;
  /** Per-slate-key drop counts from the World Cap Cut. Empty when nothing was cut. */
  droppedKeys: ReadonlyMap<SlateKey, number>;
}

/**
 * Pure derivation for one Roster List row. Counting `:weekly`/`:daily`
 * suffixes on `selectedBosses` is cheap and side-effect-free; pulling
 * `contributedMeso` + `droppedKeys` from the per-mule contribution keeps the
 * row consistent with the KPI/pie totals that share the same `useWorldIncome`
 * source. `contribution` is optional because inactive mules (`active === false`)
 * are skipped by `WorldIncome.of` and won't appear in `perMule`; passing
 * `undefined` means "treat as a 0-contribution mule" without forcing the
 * caller to fabricate an empty record.
 */
export function rosterRowMetrics(
  mule: Mule,
  contribution: MuleContribution | undefined,
  worldTotalContributedMeso: number,
): RosterRowMetrics {
  let weeklyCount = 0;
  let dailyCount = 0;
  for (const key of mule.selectedBosses) {
    if (key.endsWith(':weekly')) weeklyCount++;
    else if (key.endsWith(':daily')) dailyCount++;
  }
  const postCapMeso = contribution?.contributedMeso ?? 0;
  const sharePct = worldTotalContributedMeso > 0 ? postCapMeso / worldTotalContributedMeso : 0;
  return {
    weeklyCount,
    dailyCount,
    postCapMeso,
    sharePct,
    droppedKeys: contribution?.droppedKeys ?? EMPTY_DROPPED_KEYS,
  };
}
