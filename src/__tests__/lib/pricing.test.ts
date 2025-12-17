import { describe, it, expect } from 'vitest'
import { getPricePerClass } from '@/lib/pricing'

describe('getPricePerClass', () => {
  describe('Tier 1 pricing', () => {
    describe('1v1 mode (base rate)', () => {
      it('returns 150 for 1-12 sessions purchased', () => {
        expect(getPricePerClass(1, 1)).toBe(150)
        expect(getPricePerClass(1, 6)).toBe(150)
        expect(getPricePerClass(1, 12)).toBe(150)
      })

      it('returns 140 for 13-20 sessions purchased', () => {
        expect(getPricePerClass(1, 13)).toBe(140)
        expect(getPricePerClass(1, 16)).toBe(140)
        expect(getPricePerClass(1, 20)).toBe(140)
      })

      it('returns 130 for 21+ sessions purchased', () => {
        expect(getPricePerClass(1, 21)).toBe(130)
        expect(getPricePerClass(1, 30)).toBe(130)
        expect(getPricePerClass(1, 50)).toBe(130)
      })
    })

    describe('1v2 mode (+$20)', () => {
      it('returns 170 for 1-12 sessions purchased', () => {
        expect(getPricePerClass(1, 1, '1v2')).toBe(170)
        expect(getPricePerClass(1, 12, '1v2')).toBe(170)
      })

      it('returns 160 for 13-20 sessions purchased', () => {
        expect(getPricePerClass(1, 13, '1v2')).toBe(160)
        expect(getPricePerClass(1, 20, '1v2')).toBe(160)
      })

      it('returns 150 for 21+ sessions purchased', () => {
        expect(getPricePerClass(1, 21, '1v2')).toBe(150)
        expect(getPricePerClass(1, 30, '1v2')).toBe(150)
      })
    })

    describe('2v2 mode (same as 1v1)', () => {
      it('returns base rate same as 1v1', () => {
        expect(getPricePerClass(1, 1, '2v2')).toBe(150)
        expect(getPricePerClass(1, 13, '2v2')).toBe(140)
        expect(getPricePerClass(1, 21, '2v2')).toBe(130)
      })
    })
  })

  describe('Tier 2 pricing', () => {
    describe('1v1 mode', () => {
      it('returns 165 for 1-12 sessions purchased', () => {
        expect(getPricePerClass(2, 1)).toBe(165)
        expect(getPricePerClass(2, 12)).toBe(165)
      })

      it('returns 155 for 13-20 sessions purchased', () => {
        expect(getPricePerClass(2, 13)).toBe(155)
        expect(getPricePerClass(2, 20)).toBe(155)
      })

      it('returns 145 for 21+ sessions purchased', () => {
        expect(getPricePerClass(2, 21)).toBe(145)
        expect(getPricePerClass(2, 50)).toBe(145)
      })
    })

    describe('1v2 mode (+$20)', () => {
      it('returns base + 20 for all volume tiers', () => {
        expect(getPricePerClass(2, 1, '1v2')).toBe(185)
        expect(getPricePerClass(2, 13, '1v2')).toBe(175)
        expect(getPricePerClass(2, 21, '1v2')).toBe(165)
      })
    })
  })

  describe('Tier 3 pricing', () => {
    describe('1v1 mode', () => {
      it('returns 180 for 1-12 sessions purchased', () => {
        expect(getPricePerClass(3, 1)).toBe(180)
        expect(getPricePerClass(3, 12)).toBe(180)
      })

      it('returns 170 for 13-20 sessions purchased', () => {
        expect(getPricePerClass(3, 13)).toBe(170)
        expect(getPricePerClass(3, 20)).toBe(170)
      })

      it('returns 160 for 21+ sessions purchased', () => {
        expect(getPricePerClass(3, 21)).toBe(160)
        expect(getPricePerClass(3, 50)).toBe(160)
      })
    })

    describe('1v2 mode (+$20)', () => {
      it('returns base + 20 for all volume tiers', () => {
        expect(getPricePerClass(3, 1, '1v2')).toBe(200)
        expect(getPricePerClass(3, 13, '1v2')).toBe(190)
        expect(getPricePerClass(3, 21, '1v2')).toBe(180)
      })
    })
  })

  describe('default mode parameter', () => {
    it('defaults to 1v1 when mode is not provided', () => {
      expect(getPricePerClass(1, 10)).toBe(getPricePerClass(1, 10, '1v1'))
      expect(getPricePerClass(2, 15)).toBe(getPricePerClass(2, 15, '1v1'))
      expect(getPricePerClass(3, 25)).toBe(getPricePerClass(3, 25, '1v1'))
    })
  })

  describe('boundary conditions', () => {
    it('handles volume tier boundary at 12/13 sessions', () => {
      // Tier 1
      expect(getPricePerClass(1, 12)).toBe(150)
      expect(getPricePerClass(1, 13)).toBe(140)

      // Tier 2
      expect(getPricePerClass(2, 12)).toBe(165)
      expect(getPricePerClass(2, 13)).toBe(155)

      // Tier 3
      expect(getPricePerClass(3, 12)).toBe(180)
      expect(getPricePerClass(3, 13)).toBe(170)
    })

    it('handles volume tier boundary at 20/21 sessions', () => {
      // Tier 1
      expect(getPricePerClass(1, 20)).toBe(140)
      expect(getPricePerClass(1, 21)).toBe(130)

      // Tier 2
      expect(getPricePerClass(2, 20)).toBe(155)
      expect(getPricePerClass(2, 21)).toBe(145)

      // Tier 3
      expect(getPricePerClass(3, 20)).toBe(170)
      expect(getPricePerClass(3, 21)).toBe(160)
    })
  })
})
