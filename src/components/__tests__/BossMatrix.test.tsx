import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { BossMatrix } from '../BossMatrix'
import { bosses } from '../../data/bosses'
import { makeKey, TIER_ORDER } from '../../data/bossSelection'

const LUCID = bosses.find((b) => b.family === 'lucid')!.id
const HARD_LUCID = makeKey(LUCID, 'hard')
const NORMAL_LUCID = makeKey(LUCID, 'normal')

const BLACK_MAGE = bosses.find((b) => b.family === 'black-mage')!.id
const AKECHI = bosses.find((b) => b.family === 'akechi-mitsuhide')!.id

function renderMatrix(
  selectedKeys: string[] = [],
  onToggleKey = vi.fn(),
) {
  return {
    ...render(<BossMatrix selectedKeys={selectedKeys} onToggleKey={onToggleKey} />),
    onToggleKey,
  }
}

describe('BossMatrix', () => {
  describe('structure', () => {
    it('renders one row per family', () => {
      renderMatrix()
      const rows = screen.getAllByRole('row')
      // One header row + one row per family (bosses.length families).
      expect(rows).toHaveLength(bosses.length + 1)
    })

    it('renders a header row with a Boss Family label and 5 tier columns', () => {
      renderMatrix()
      expect(screen.getByText('Boss Family')).toBeTruthy()
      for (const tier of TIER_ORDER) {
        const header = screen.getByRole('columnheader', {
          name: new RegExp(tier, 'i'),
        })
        expect(header).toBeTruthy()
      }
    })

    it('renders one DiffPip color strip per tier column in the header', () => {
      renderMatrix()
      for (const tier of TIER_ORDER) {
        const pip = document.querySelector(`[data-difficulty-pip="${tier}"]`)
        expect(pip).toBeTruthy()
      }
    })

    it('renders each family row with its display name in the leftmost cell', () => {
      renderMatrix()
      expect(screen.getByRole('rowheader', { name: 'Black Mage' })).toBeTruthy()
      expect(screen.getByRole('rowheader', { name: 'Lucid' })).toBeTruthy()
      expect(screen.getByRole('rowheader', { name: 'Akechi Mitsuhide' })).toBeTruthy()
    })

    it('sorts family rows by top-tier crystalValue descending (Black Mage first)', () => {
      renderMatrix()
      const rowHeaders = screen.getAllByRole('rowheader')
      expect(rowHeaders[0].textContent).toBe('Black Mage')
    })

    it('renders the caption "Tap a cell to pick difficulty."', () => {
      renderMatrix()
      expect(screen.getByText('Tap a cell to pick difficulty.')).toBeTruthy()
    })
  })

  describe('empty cells', () => {
    it('renders a dashed — for a tier the family does not offer', () => {
      renderMatrix()
      // Black Mage has no easy / normal / chaos tiers.
      const cell = screen.getByTestId(`matrix-cell-${BLACK_MAGE}-easy`)
      expect(cell.textContent).toBe('—')
    })

    it('empty cells are non-interactive (no click handler fires)', () => {
      const onToggleKey = vi.fn()
      renderMatrix([], onToggleKey)
      const cell = screen.getByTestId(`matrix-cell-${BLACK_MAGE}-easy`)
      fireEvent.click(cell)
      expect(onToggleKey).not.toHaveBeenCalled()
    })
  })

  describe('populated cells', () => {
    it('renders formatMeso(crystalValue, true) as the cell value', () => {
      renderMatrix()
      const cell = screen.getByTestId(`matrix-cell-${BLACK_MAGE}-extreme`)
      // 18,000,000,000 → "18B"
      expect(cell.textContent).toContain('18B')
    })

    it('clicking a populated cell calls onToggleKey with <uuid>:<tier>', () => {
      const onToggleKey = vi.fn()
      renderMatrix([], onToggleKey)
      const cell = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      fireEvent.click(cell)
      expect(onToggleKey).toHaveBeenCalledWith(HARD_LUCID)
    })

    it('tier-less families (Akechi) render a single populated cell at normal', () => {
      const onToggleKey = vi.fn()
      renderMatrix([], onToggleKey)
      const normalCell = screen.getByTestId(`matrix-cell-${AKECHI}-normal`)
      fireEvent.click(normalCell)
      expect(onToggleKey).toHaveBeenCalledWith(makeKey(AKECHI, 'normal'))
    })
  })

  describe('selected styling', () => {
    it('marks the selected cell with data-state="on"', () => {
      renderMatrix([HARD_LUCID])
      const cell = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      expect(cell.getAttribute('data-state')).toBe('on')
    })

    it('does not mark other families as selected', () => {
      renderMatrix([HARD_LUCID])
      const cell = screen.getByTestId(`matrix-cell-${BLACK_MAGE}-extreme`)
      expect(cell.getAttribute('data-state')).not.toBe('on')
    })
  })

  describe('dim sibling styling', () => {
    it('marks other populated tier cells in the same family with data-dim="true"', () => {
      renderMatrix([HARD_LUCID])
      const normalCell = screen.getByTestId(`matrix-cell-${LUCID}-normal`)
      const easyCell = screen.getByTestId(`matrix-cell-${LUCID}-easy`)
      expect(normalCell.getAttribute('data-dim')).toBe('true')
      expect(easyCell.getAttribute('data-dim')).toBe('true')
    })

    it('does not dim cells in other families', () => {
      renderMatrix([HARD_LUCID])
      const blackMageHard = screen.getByTestId(`matrix-cell-${BLACK_MAGE}-hard`)
      expect(blackMageHard.getAttribute('data-dim')).not.toBe('true')
    })

    it('does not dim the selected cell itself', () => {
      renderMatrix([HARD_LUCID])
      const selected = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      expect(selected.getAttribute('data-dim')).not.toBe('true')
    })

    it('does not dim any cells when nothing is selected', () => {
      renderMatrix([])
      const cell = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      expect(cell.getAttribute('data-dim')).not.toBe('true')
    })
  })

  describe('interaction regression', () => {
    it('clicking a sibling tier sends the new key (swap is handled upstream)', () => {
      const onToggleKey = vi.fn()
      renderMatrix([NORMAL_LUCID], onToggleKey)
      const hardCell = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      fireEvent.click(hardCell)
      expect(onToggleKey).toHaveBeenCalledWith(HARD_LUCID)
    })

    it('clicking the currently-selected cell again sends the same key (clear handled upstream)', () => {
      const onToggleKey = vi.fn()
      renderMatrix([HARD_LUCID], onToggleKey)
      const hardCell = screen.getByTestId(`matrix-cell-${LUCID}-hard`)
      fireEvent.click(hardCell)
      expect(onToggleKey).toHaveBeenCalledWith(HARD_LUCID)
    })
  })
})
