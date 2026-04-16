import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import { MuleCharacterCard } from '../MuleCharacterCard'
import type { Mule } from '../../types'

const baseMule: Mule = {
  id: 'test-mule-1',
  name: 'TestMule',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
}

function renderCard(overrides: Partial<Mule> = {}) {
  const onClick = vi.fn()
  const mule = { ...baseMule, ...overrides }
  return {
    ...render(<MuleCharacterCard mule={mule} onClick={onClick} />),
    onClick,
  }
}

describe('MuleCharacterCard', () => {
  it('renders the mule name', () => {
    renderCard()
    expect(screen.getByText('TestMule')).toBeTruthy()
  })

  it('renders "Unnamed Mule" when name is empty', () => {
    renderCard({ name: '' })
    expect(screen.getByText('Unnamed Mule')).toBeTruthy()
  })

  it('renders level badge when level > 0', () => {
    renderCard()
    expect(screen.getByText('Lv. 200')).toBeTruthy()
  })

  it('hides level badge when level is 0', () => {
    renderCard({ level: 0 })
    expect(screen.queryByText(/Lv\./)).toBeNull()
  })

  it('renders class badge when muleClass is set', () => {
    renderCard({ muleClass: 'Hero' })
    expect(screen.getByText('Hero')).toBeTruthy()
  })

  it('hides class badge when muleClass is empty', () => {
    renderCard({ muleClass: '' })
    expect(screen.queryByText('Hero')).toBeNull()
  })

  it('calls onClick when card is clicked', () => {
    const { onClick, container } = renderCard()
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toBeTruthy()
    fireEvent.click(card!)
    expect(onClick).toHaveBeenCalled()
  })

  it('renders income text', () => {
    renderCard()
    expect(screen.getByText(/0.*\/week/)).toBeTruthy()
  })

  it('uses shadcn Card (data-slot="card") not Mantine', () => {
    const { container } = renderCard()
    expect(container.querySelector('[data-slot="card"]')).toBeTruthy()
    expect(container.querySelector('.mantine-Card-root')).toBeNull()
  })

  it('uses shadcn Badge (badge variant classes) not Mantine', () => {
    const { container } = renderCard()
    const badges = container.querySelectorAll('[data-slot="badge"]')
    expect(badges.length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('.mantine-Badge-root')).toBeNull()
  })
})