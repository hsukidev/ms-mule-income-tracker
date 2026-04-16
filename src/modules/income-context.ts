import { createContext } from 'react'

interface IncomeContextValue {
  abbreviated: boolean
  toggle: () => void
}

export const IncomeContext = createContext<IncomeContextValue | undefined>(undefined)