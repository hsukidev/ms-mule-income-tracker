import type { HTMLAttributes, ReactNode } from 'react'

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'

const gapMap: Record<Gap, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const justifyMap: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
  stretch: 'justify-stretch',
}

const alignMap: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

interface GroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gap?: Gap
  justify?: Justify
  align?: Align
  wrap?: boolean
}

export function Group({ children, gap, justify, align, wrap, className = '', ...props }: GroupProps) {
  const classes = [
    'flex',
    'flex-row',
    gap ? gapMap[gap] : '',
    justify ? justifyMap[justify] : '',
    align ? alignMap[align] : '',
    wrap === true ? 'flex-wrap' : wrap === false ? 'flex-nowrap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}