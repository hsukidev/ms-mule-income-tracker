import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTheme } from '@/context/ThemeProvider'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  totalWeeklyIncome: string
  muleCount: number
}

export function Header({ totalWeeklyIncome, muleCount }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center justify-between py-3 px-6">
      <div>
        <h1 className="text-xl font-bold">Mule Crystal Tracker</h1>
        <p className="text-sm text-muted-foreground">
          {muleCount} mule{muleCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-lg font-semibold">
          Weekly: {totalWeeklyIncome} mesos
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle color scheme"
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </Button>
      </div>
    </div>
  )
}