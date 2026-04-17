import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeProvider'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  totalWeeklyIncome: string
  muleCount: number
}

function LeafMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6 text-[var(--leaf)] drop-shadow-[0_0_8px_var(--leaf)]"
      fill="currentColor"
    >
      <path d="M12 2c3.2 2.4 5.4 5.5 5.4 9.2 0 3.9-2.5 7-6.4 8.6a.8.8 0 0 1-1.1-.7v-5.9c0-.3.2-.6.5-.7l2.7-1.1-3.3.4a.8.8 0 0 1-.8-.5l-1.6-4.5C7.7 4.3 9.5 3 12 2Z" />
      <path d="M12 22v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Header({ totalWeeklyIncome, muleCount }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/50">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-6 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <LeafMark />
          <div className="min-w-0">
            <h1 className="font-display text-[1.55rem] leading-none font-black tracking-tight">
              Mule<span className="text-[var(--maple)]">.</span>Income
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex flex-col items-end">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              This Week
            </span>
            <span className="font-mono-nums text-sm text-[var(--gold)] mt-0.5">
              {totalWeeklyIncome}
              <span className="text-muted-foreground/70 ml-1 font-sans normal-case tracking-normal">mesos</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle color scheme"
            className="rounded-full border border-border/60 hover:border-[var(--maple)]/70 hover:bg-[var(--maple)]/5 hover:text-[var(--maple)] transition-[color,background-color,border-color,box-shadow] hover:shadow-[0_0_20px_-6px_var(--maple)]"
          >
            {isDark ? <Sun size={18} aria-label="Sun" /> : <Moon size={18} aria-label="Moon" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
