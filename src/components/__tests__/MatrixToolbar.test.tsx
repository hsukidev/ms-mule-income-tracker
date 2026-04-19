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
})
