import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { IncomeContext } from './income-context'

export function IncomeProvider({ children, defaultAbbreviated = true }: { children: ReactNode; defaultAbbreviated?: boolean }) {
  const [abbreviated, setAbbreviated] = useState(defaultAbbreviated)
  const toggle = useCallback(() => setAbbreviated(a => !a), [])
  const value = useMemo(() => ({ abbreviated, toggle }), [abbreviated, toggle])

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  )
}