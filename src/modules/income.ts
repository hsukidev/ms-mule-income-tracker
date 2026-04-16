import { calculatePotentialIncome } from '../data/bosses'
import { formatMeso } from '../utils/meso'

export interface IncomeDisplay {
  raw: number
  formatted: string
}

export function computeMuleIncome(selectedBosses: string[], abbreviated: boolean): IncomeDisplay {
  const raw = calculatePotentialIncome(selectedBosses)
  return { raw, formatted: formatMeso(raw, abbreviated) }
}

export function computeTotalIncome(mules: { selectedBosses: string[] }[], abbreviated: boolean): IncomeDisplay {
  const raw = mules.reduce((sum, m) => sum + calculatePotentialIncome(m.selectedBosses), 0)
  return { raw, formatted: formatMeso(raw, abbreviated) }
}
