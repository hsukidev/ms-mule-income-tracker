import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeMuleIncome, computeTotalIncome, sumSelectedKeys } from '../income'
import * as bossesModule from '../../data/bosses'
import { bosses } from '../../data/bosses'
import { makeKey } from '../../data/bossSelection'
import type { Boss } from '../../types'

const LUCID = bosses.find((b) => b.family === 'lucid')!.id
const WILL = bosses.find((b) => b.family === 'will')!.id
const HARD_LUCID = makeKey(LUCID, 'hard')
const HARD_WILL = makeKey(WILL, 'hard')

describe('computeMuleIncome', () => {
  it('returns correct raw and formatted for a mule with selected bosses (abbreviated)', () => {
    const result = computeMuleIncome([HARD_LUCID, HARD_WILL], true)
    expect(result.raw).toBe(504000000 + 621810000)
    expect(result.formatted).toBe('1.13B')
  })

  it('returns correct raw and formatted for a mule with selected bosses (full)', () => {
    const result = computeMuleIncome([HARD_LUCID, HARD_WILL], false)
    expect(result.raw).toBe(504000000 + 621810000)
    expect(result.formatted).toBe('1,125,810,000')
  })

  it('returns raw: 0 and formatted: "0" for empty selection (abbreviated)', () => {
    const result = computeMuleIncome([], true)
    expect(result.raw).toBe(0)
    expect(result.formatted).toBe('0')
  })

  it('returns raw: 0 and formatted: "0" for empty selection (full)', () => {
    const result = computeMuleIncome([], false)
    expect(result.raw).toBe(0)
    expect(result.formatted).toBe('0')
  })

  it('formats with B/M/K suffix when abbreviated is true', () => {
    const result = computeMuleIncome([HARD_LUCID], true)
    expect(result.raw).toBe(504000000)
    expect(result.formatted).toBe('504M')
  })

  it('formats with commas when abbreviated is false', () => {
    const result = computeMuleIncome([HARD_LUCID], false)
    expect(result.raw).toBe(504000000)
    expect(result.formatted).toBe('504,000,000')
  })

  it('handles unknown keys gracefully', () => {
    const result = computeMuleIncome(['unknown-key'], true)
    expect(result.raw).toBe(0)
    expect(result.formatted).toBe('0')
  })

  it('handles legacy-format keys gracefully (0 meso, no throw)', () => {
    // A legacy id like "hard-lucid" has no colon; decoder ignores it.
    const result = computeMuleIncome(['hard-lucid'], true)
    expect(result.raw).toBe(0)
  })
})

describe('computeTotalIncome', () => {
  it('sums across multiple mules correctly (abbreviated)', () => {
    const mules = [
      { selectedBosses: [HARD_LUCID] },
      { selectedBosses: [HARD_WILL] },
    ]
    const result = computeTotalIncome(mules, true)
    expect(result.raw).toBe(504000000 + 621810000)
    expect(result.formatted).toBe('1.13B')
  })

  it('sums across multiple mules correctly (full)', () => {
    const mules = [
      { selectedBosses: [HARD_LUCID] },
      { selectedBosses: [HARD_WILL] },
    ]
    const result = computeTotalIncome(mules, false)
    expect(result.raw).toBe(504000000 + 621810000)
    expect(result.formatted).toBe('1,125,810,000')
  })

  it('handles empty mule array (abbreviated)', () => {
    const result = computeTotalIncome([], true)
    expect(result.raw).toBe(0)
    expect(result.formatted).toBe('0')
  })

  it('handles empty mule array (full)', () => {
    const result = computeTotalIncome([], false)
    expect(result.raw).toBe(0)
    expect(result.formatted).toBe('0')
  })

  it('formats with B/M/K suffix when abbreviated is true', () => {
    const mules = [{ selectedBosses: [HARD_LUCID] }]
    const result = computeTotalIncome(mules, true)
    expect(result.formatted).toBe('504M')
  })

  it('formats with commas when abbreviated is false', () => {
    const mules = [{ selectedBosses: [HARD_LUCID] }]
    const result = computeTotalIncome(mules, false)
    expect(result.formatted).toBe('504,000,000')
  })

  it('handles mules with empty selectedBosses', () => {
    const mules = [
      { selectedBosses: [HARD_LUCID] },
      { selectedBosses: [] },
    ]
    const result = computeTotalIncome(mules, true)
    expect(result.raw).toBe(504000000)
    expect(result.formatted).toBe('504M')
  })
})

describe('sumSelectedKeys contentType filter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockBosses(...bosses: Boss[]) {
    const byId = new Map(bosses.map((b) => [b.id, b]))
    vi.spyOn(bossesModule, 'getBossById').mockImplementation((id) => byId.get(id))
  }

  it('includes only keys from bosses with contentType === "weekly"; monthly bosses contribute 0', () => {
    const weeklyBoss: Boss = {
      id: 'fixture-weekly',
      name: 'Fixture Weekly',
      family: 'fixture-weekly',
      contentType: 'weekly',
      difficulty: [{ tier: 'hard', crystalValue: 1_000_000 }],
    }
    const monthlyBoss: Boss = {
      id: 'fixture-monthly',
      name: 'Fixture Monthly',
      family: 'fixture-monthly',
      contentType: 'monthly',
      difficulty: [{ tier: 'extreme', crystalValue: 9_999_999 }],
    }
    mockBosses(weeklyBoss, monthlyBoss)

    const keys = [makeKey(weeklyBoss.id, 'hard'), makeKey(monthlyBoss.id, 'extreme')]
    expect(sumSelectedKeys(keys)).toBe(1_000_000)
  })

  it('drops daily bosses from the sum', () => {
    const dailyBoss: Boss = {
      id: 'fixture-daily',
      name: 'Fixture Daily',
      family: 'fixture-daily',
      contentType: 'daily',
      difficulty: [{ tier: 'normal', crystalValue: 42 }],
    }
    const weeklyBoss: Boss = {
      id: 'fixture-weekly-b',
      name: 'Fixture Weekly B',
      family: 'fixture-weekly-b',
      contentType: 'weekly',
      difficulty: [{ tier: 'hard', crystalValue: 100 }],
    }
    mockBosses(dailyBoss, weeklyBoss)

    const keys = [makeKey(dailyBoss.id, 'normal'), makeKey(weeklyBoss.id, 'hard')]
    expect(sumSelectedKeys(keys)).toBe(100)
  })
})
