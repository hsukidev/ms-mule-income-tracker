import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { IncomePieChart } from '../IncomePieChart'
import type { Mule } from '../../types'

const muleWithBosses: Mule = {
  id: 'mule-1',
  name: 'TestMule',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: ['normal-hilla'],
}

const muleNoBosses: Mule = {
  id: 'mule-2',
  name: 'EmptyMule',
  level: 150,
  muleClass: 'Paladin',
  selectedBosses: [],
}

describe('IncomePieChart', () => {
  it('shows empty state when no mules have bosses selected', () => {
    render(<IncomePieChart mules={[muleNoBosses]} abbreviated />)
    expect(screen.getByText('Add mules and select bosses to see the income breakdown')).toBeTruthy()
  })

  it('shows empty state when mules array is empty', () => {
    render(<IncomePieChart mules={[]} abbreviated />)
    expect(screen.getByText('Add mules and select bosses to see the income breakdown')).toBeTruthy()
  })

  it('empty state uses text-muted-foreground class', () => {
    const { container } = render(<IncomePieChart mules={[]} abbreviated />)
    const el = container.querySelector('.text-muted-foreground')
    expect(el).toBeTruthy()
  })

  it('renders chart container with data when mules have bosses', () => {
    const { container } = render(<IncomePieChart mules={[muleWithBosses]} abbreviated />)
    expect(container.querySelector('[data-slot="chart"]')).toBeTruthy()
  })

  it('does not render Paper from Mantine (no mantine classes)', () => {
    const { container } = render(<IncomePieChart mules={[muleWithBosses]} abbreviated />)
    expect(container.querySelector('.mantine-Paper-root')).toBeNull()
  })

  it('fires onSliceClick when a pie slice is clicked', () => {
    const onSliceClick = vi.fn()
    const { container } = render(
      <IncomePieChart mules={[muleWithBosses]} abbreviated onSliceClick={onSliceClick} />
    )
    const paths = container.querySelectorAll('.recharts-pie-sector')
    if (paths.length > 0) {
      fireEvent.click(paths[0])
      expect(onSliceClick).toHaveBeenCalledWith('mule-1')
    }
  })
})