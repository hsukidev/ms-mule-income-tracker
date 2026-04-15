import { describe, expect, it } from 'vitest'
import { darkCharcoalTheme } from '../theme'

describe('darkCharcoalTheme', () => {
  describe('dark color scale', () => {
    it('has exactly 10 shades in colors.dark', () => {
      const dark = darkCharcoalTheme.colors?.dark
      expect(dark).toHaveLength(10)
    })

    it('uses hex values in the #161616–#252525 range', () => {
      const dark = darkCharcoalTheme.colors?.dark ?? []
      for (const shade of dark) {
        const hex = shade.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        expect(r).toBeGreaterThanOrEqual(0x16)
        expect(r).toBeLessThanOrEqual(0x25)
        expect(g).toBeGreaterThanOrEqual(0x16)
        expect(g).toBeLessThanOrEqual(0x25)
        expect(b).toBeGreaterThanOrEqual(0x16)
        expect(b).toBeLessThanOrEqual(0x25)
      }
    })

    it('starts with lighter shades and ends with darker shades', () => {
      const dark = darkCharcoalTheme.colors?.dark ?? []
      const first = parseInt(dark.at(0)!.replace('#', ''), 16)
      const last = parseInt(dark.at(9)!.replace('#', ''), 16)
      expect(first).toBeGreaterThan(last)
    })
  })

  describe('light mode preservation', () => {
    it('does not override primaryColor', () => {
      expect(darkCharcoalTheme.primaryColor).toBeUndefined()
    })
  })
})