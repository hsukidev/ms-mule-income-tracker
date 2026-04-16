import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import { computeMuleIncome, computeTotalIncome, type IncomeDisplay } from './income'

interface IncomeContextValue {
  abbreviated: boolean
  toggle: () => void
}

const IncomeContext = createContext<IncomeContextValue | undefined>(undefined)

interface IncomeProviderProps {
  children: ReactNode
  defaultAbbreviated?: boolean
}

export function IncomeProvider({ children, defaultAbbreviated = true }: IncomeProviderProps) {
  const [abbreviated, setAbbreviated] = useState(defaultAbbreviated)
  const toggle = useCallback(() => setAbbreviated(a => !a), [])
  const value = useMemo(() => ({ abbreviated, toggle }), [abbreviated, toggle])

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFormatPreference() {
  const context = useContext(IncomeContext)
  if (!context) {
    throw new Error('useFormatPreference must be used within an IncomeProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMuleIncome(mule: { selectedBosses: string[] }): IncomeDisplay {
  const { abbreviated } = useFormatPreference()
  return useMemo(() => computeMuleIncome(mule.selectedBosses, abbreviated), [mule.selectedBosses, abbreviated])
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTotalIncome(mules: { selectedBosses: string[] }[]): IncomeDisplay {
  const { abbreviated } = useFormatPreference()
  return useMemo(() => computeTotalIncome(mules, abbreviated), [mules, abbreviated])
}