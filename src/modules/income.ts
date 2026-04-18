import { getBossById } from '../data/bosses'
import { parseKey } from '../data/bossSelection'
import { formatMeso } from '../utils/meso'

export interface IncomeDisplay {
  raw: number
  formatted: string
}

/**
 * Sum crystalValues for a list of `<uuid>:<tier>` selection keys.
 *
 * Only keys belonging to bosses with `contentType === 'weekly'` contribute;
 * daily and monthly bosses resolve but sum to 0. All seed data is currently
 * `'weekly'`, so this filter is plumbing that unlocks future daily/monthly
 * boss data without distorting the weekly KPI.
 */
export function sumSelectedKeys(keys: string[]): number {
  let total = 0
  for (const key of keys) {
    const parsed = parseKey(key)
    if (!parsed) continue
    const boss = getBossById(parsed.bossId)
    if (!boss || boss.contentType !== 'weekly') continue
    const diff = boss.difficulty.find((d) => d.tier === parsed.tier)
    if (diff) total += diff.crystalValue
  }
  return total
}

export function computeMuleIncome(selectedBosses: string[], abbreviated: boolean): IncomeDisplay {
  const raw = sumSelectedKeys(selectedBosses)
  return { raw, formatted: formatMeso(raw, abbreviated) }
}

export function computeTotalIncome(
  mules: { selectedBosses: string[] }[],
  abbreviated: boolean,
): IncomeDisplay {
  const raw = mules.reduce((sum, m) => sum + sumSelectedKeys(m.selectedBosses), 0)
  return { raw, formatted: formatMeso(raw, abbreviated) }
}
