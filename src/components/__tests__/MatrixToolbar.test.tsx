import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'

import { MatrixToolbar } from '../MatrixToolbar'

const noop = () => {}
const EMPTY_PRESETS: ReadonlySet<'CRA' | 'CTENE'> = new Set()

function renderToolbar(
  overrides: Partial<Parameters<typeof MatrixToolbar>[0]> = {},
) {
  const props = {
    filter: 'All' as const,
    onFilterChange: vi.fn(),
    activePresets: EMPTY_PRESETS,
    onTogglePreset: vi.fn(),
    weeklyCount: 0,
    onReset: vi.fn(),
    ...overrides,
  }
  return {
    ...render(<MatrixToolbar {...props} />),
    props,
  }
}

describe('MatrixToolbar', () => {
  it('renders three cadence buttons labelled All, Weekly, Daily', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /^all$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^weekly$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^daily$/i })).toBeTruthy()
  })

  it('wraps the cadence buttons in a .d-c-toggle container', () => {
    const { container } = renderToolbar()
    const toggle = container.querySelector('.d-c-toggle')
    expect(toggle).toBeTruthy()
    expect(toggle?.querySelectorAll('button')).toHaveLength(3)
  })

  it('applies the .on class to the active cadence button (All by default)', () => {
    renderToolbar({ filter: 'All' })
    const allBtn = screen.getByRole('button', { name: /^all$/i })
    const weeklyBtn = screen.getByRole('button', { name: /^weekly$/i })
    const dailyBtn = screen.getByRole('button', { name: /^daily$/i })
    expect(allBtn.classList.contains('on')).toBe(true)
    expect(weeklyBtn.classList.contains('on')).toBe(false)
    expect(dailyBtn.classList.contains('on')).toBe(false)
  })

  it('moves the .on class when filter=Weekly', () => {
    renderToolbar({ filter: 'Weekly' })
    expect(
      screen.getByRole('button', { name: /^weekly$/i }).classList.contains('on'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: /^all$/i }).classList.contains('on'),
    ).toBe(false)
  })

  it('moves the .on class when filter=Daily', () => {
    renderToolbar({ filter: 'Daily' })
    expect(
      screen.getByRole('button', { name: /^daily$/i }).classList.contains('on'),
    ).toBe(true)
  })

  it('calls onFilterChange with "Weekly" when the Weekly button is clicked', () => {
    const onFilterChange = vi.fn()
    renderToolbar({ onFilterChange })
    fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))
    expect(onFilterChange).toHaveBeenCalledWith('Weekly')
  })

  it('calls onFilterChange with "Daily" when the Daily button is clicked', () => {
    const onFilterChange = vi.fn()
    renderToolbar({ onFilterChange })
    fireEvent.click(screen.getByRole('button', { name: /^daily$/i }))
    expect(onFilterChange).toHaveBeenCalledWith('Daily')
  })

  it('calls onFilterChange with "All" when the All button is clicked', () => {
    const onFilterChange = vi.fn()
    renderToolbar({ filter: 'Weekly', onFilterChange })
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }))
    expect(onFilterChange).toHaveBeenCalledWith('All')
  })

  it('renders a calendar SVG inside the Weekly button', () => {
    renderToolbar()
    const weeklyBtn = screen.getByRole('button', { name: /^weekly$/i })
    const svg = weeklyBtn.querySelector('svg')
    expect(svg).toBeTruthy()
    // Calendar shape: rect + 2 lines for tabs + 1 horizontal line
    expect(svg?.querySelector('rect')).toBeTruthy()
    expect(svg?.querySelectorAll('line').length).toBeGreaterThanOrEqual(3)
  })

  it('renders a clock SVG inside the Daily button', () => {
    renderToolbar()
    const dailyBtn = screen.getByRole('button', { name: /^daily$/i })
    const svg = dailyBtn.querySelector('svg')
    expect(svg).toBeTruthy()
    // Clock shape: circle + polyline for the hands
    expect(svg?.querySelector('circle')).toBeTruthy()
    expect(svg?.querySelector('polyline')).toBeTruthy()
  })

  it('does not render an icon inside the All button', () => {
    renderToolbar()
    const allBtn = screen.getByRole('button', { name: /^all$/i })
    expect(allBtn.querySelector('svg')).toBeNull()
  })

  it('accepts the unused preset / count / reset props without crashing', () => {
    // Smoke test: full prop surface is declared up front so future slices
    // can add right-side controls without churning the API.
    renderToolbar({
      activePresets: new Set(['CRA']),
      onTogglePreset: noop,
      weeklyCount: 5,
      onReset: noop,
    })
    expect(screen.getByRole('button', { name: /^all$/i })).toBeTruthy()
  })

  describe('weekly count display', () => {
    it('renders "{weeklyCount}/14" with the Weekly-selections aria-label', () => {
      renderToolbar({ weeklyCount: 5 })
      const count = screen.getByLabelText(/weekly boss selections/i)
      expect(count.textContent).toBe('5/14')
    })

    it('shows "0/14" when weeklyCount is 0', () => {
      renderToolbar({ weeklyCount: 0 })
      const count = screen.getByLabelText(/weekly boss selections/i)
      expect(count.textContent).toBe('0/14')
    })

    it('does not clamp and can display values greater than 14', () => {
      renderToolbar({ weeklyCount: 16 })
      const count = screen.getByLabelText(/weekly boss selections/i)
      expect(count.textContent).toBe('16/14')
    })

    it('uses var(--muted-foreground) color when weeklyCount is 0', () => {
      renderToolbar({ weeklyCount: 0 })
      const count = screen.getByLabelText(/weekly boss selections/i) as HTMLElement
      expect(count.style.color).toContain('var(--muted-foreground)')
    })

    it('uses var(--accent) color when weeklyCount > 0', () => {
      renderToolbar({ weeklyCount: 1 })
      const count = screen.getByLabelText(/weekly boss selections/i) as HTMLElement
      expect(count.style.color).toContain('var(--accent)')
    })

    it('uses JetBrains Mono at 11px for the count text', () => {
      renderToolbar({ weeklyCount: 3 })
      const count = screen.getByLabelText(/weekly boss selections/i) as HTMLElement
      // Either inline font-family or font-mono-nums class satisfies monospaced
      // numerics; inline font-size must be 11px per the design spec.
      const hasMonoClass = count.classList.contains('font-mono-nums')
      const hasMonoInline = /JetBrains Mono/i.test(count.style.fontFamily ?? '')
      expect(hasMonoClass || hasMonoInline).toBe(true)
      expect(count.style.fontSize).toBe('11px')
    })
  })

  describe('Reset button', () => {
    it('renders a button labelled "Reset"', () => {
      renderToolbar()
      expect(screen.getByRole('button', { name: /^reset$/i })).toBeTruthy()
    })

    it('calls onReset when clicked', () => {
      const onReset = vi.fn()
      renderToolbar({ onReset })
      fireEvent.click(screen.getByRole('button', { name: /^reset$/i }))
      expect(onReset).toHaveBeenCalledTimes(1)
    })

    it('renders no icon (flat text button)', () => {
      renderToolbar()
      const resetBtn = screen.getByRole('button', { name: /^reset$/i })
      expect(resetBtn.querySelector('svg')).toBeNull()
    })
  })

  describe('toolbar separator', () => {
    it('renders a .d-toolbar-sep element between the count and the reset button', () => {
      const { container } = renderToolbar()
      const sep = container.querySelector('.d-toolbar-sep')
      expect(sep).toBeTruthy()
      const count = screen.getByLabelText(/weekly boss selections/i)
      const resetBtn = screen.getByRole('button', { name: /^reset$/i })
      // Count comes before separator which comes before Reset, in document order.
      const countVsSep = count.compareDocumentPosition(sep!)
      const sepVsReset = sep!.compareDocumentPosition(resetBtn)
      expect(countVsSep & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(sepVsReset & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})
