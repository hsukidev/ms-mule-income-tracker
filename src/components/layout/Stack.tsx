import type { HTMLAttributes, ReactNode } from 'react'

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const gapMap: Record<Gap, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gap?: Gap
}

export function Stack({ children, gap, className = '', ...props }: StackProps) {
  const classes = ['flex', 'flex-col', gap ? gapMap[gap] : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}