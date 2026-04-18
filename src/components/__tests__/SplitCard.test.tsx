import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { SplitCard } from '../SplitCard'

describe('SplitCard', () => {
  it('uses a fixed padding independent of density', () => {
    render(<SplitCard mules={[]} onSliceClick={vi.fn()} />)
    const card = screen.getByTestId('income-chart') as HTMLElement
    expect(card.style.padding).toBe('16px')
  })
})
