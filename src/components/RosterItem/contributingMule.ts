import type { Mule } from '../../types';

/** Inputs to `isContributingMule` — the cadence-count subset of `RosterRowMetrics`. */
export interface ContributingMuleMetrics {
  weeklyCount: number;
  dailyCount: number;
}

/**
 * Canonical **Contributing Mule** predicate — the one rule behind the income
 * line's accent tint in both **Card View** and **List View**. A mule
 * contributes when it is active **and** its slate carries at least one
 * `:weekly` or `:daily` selection. Monthly-only slates are excluded per
 * **Monthly Income Regression** (a Black-Mage-only mule earns 0 meso this
 * week, so it must render dim).
 */
export function isContributingMule(
  mule: Pick<Mule, 'active'>,
  metrics: ContributingMuleMetrics,
): boolean {
  return mule.active && metrics.weeklyCount + metrics.dailyCount > 0;
}
