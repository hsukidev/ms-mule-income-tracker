import { useContext, useMemo } from 'react'
import { IncomeContext } from './income-context'
import { computeMuleIncome, computeTotalIncome, type IncomeDisplay } from './income'

export function useFormatPreference() {
  const context = useContext(IncomeContext)
  if (!context) {
    throw new Error('useFormatPreference must be used within an IncomeProvider')
  }
  return context
}

export function useMuleIncome(mule: { selectedBosses: string[] }): IncomeDisplay {
  const { abbreviated } = useFormatPreference()
  return useMemo(() => computeMuleIncome(mule.selectedBosses, abbreviated), [mule.selectedBosses, abbreviated])
}

export function useTotalIncome(mules: { selectedBosses: string[] }[]): IncomeDisplay {
  const { abbreviated } = useFormatPreference()
  return useMemo(() => computeTotalIncome(mules, abbreviated), [mules, abbreviated])
}