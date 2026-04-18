import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { KpiCard } from '../KpiCard'
import type { Mule } from '../../types'

const mule: Mule = {
  id: 'm1',
  name: 'A',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
}

describe('KpiCard', () => {
  it('uses a fixed padding independent of density', () => {
    render(<KpiCard mules={[mule]} onToggleFormat={vi.fn()} />)
    const card = screen.getByTestId('income-card') as HTMLElement
    expect(card.style.padding).toBe('24px')
  })
})
