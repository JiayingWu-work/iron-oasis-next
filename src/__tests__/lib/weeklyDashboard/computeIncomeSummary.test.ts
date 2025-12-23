import { describe, it, expect } from 'vitest'
import { computeIncomeSummary } from '@/lib/weeklyDashboard/computeIncomeSummary'
import type { Client, Package, Session, LateFee } from '@/types'

describe('computeIncomeSummary', () => {
  // Helper to create client with pricing fields based on tier
  const createClient = (
    id: number,
    name: string,
    trainerId: number,
    tierAtSignup: 1 | 2 | 3 = 1,
  ): Client => {
    // Default pricing based on tier (matches DEFAULT_PRICING in pricing.ts)
    const pricing = {
      1: { price1_12: 150, price13_20: 140, price21Plus: 130 },
      2: { price1_12: 165, price13_20: 155, price21Plus: 145 },
      3: { price1_12: 180, price13_20: 170, price21Plus: 160 },
    }[tierAtSignup]

    return {
      id,
      name,
      trainerId,
      tierAtSignup,
      price1_12: pricing.price1_12,
      price13_20: pricing.price13_20,
      price21Plus: pricing.price21Plus,
      mode: '1v1' as const,
      modePremium: 20,
      createdAt: '2025-01-01',
      isActive: true,
    }
  }

  const createPackage = (
    id: number,
    clientId: number,
    trainerId: number,
    sessionsPurchased: number,
    startDate: string,
    salesBonus?: number,
  ): Package => ({
    id,
    clientId,
    trainerId,
    sessionsPurchased,
    startDate,
    salesBonus,
    mode: '1v1',
  })

  const createSession = (
    id: number,
    clientId: number,
    trainerId: number,
    packageId: number | null,
    date: string,
  ): Session => ({
    id,
    clientId,
    trainerId,
    packageId,
    date,
    mode: '1v1',
  })

  const createLateFee = (
    id: number,
    clientId: number,
    trainerId: number,
    date: string,
    amount: number,
  ): LateFee => ({
    id,
    clientId,
    trainerId,
    date,
    amount,
  })

  describe('totalClassesThisWeek and rate', () => {
    it('returns 0.46 rate for 12 or fewer classes', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
      )

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [],
        [],
        1,
        sessions,
      )

      expect(result.totalClassesThisWeek).toBe(10)
      expect(result.rate).toBe(0.46)
    })

    it('returns 0.51 rate for more than 12 classes', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const packages = [createPackage(1, 1, 1, 20, '2025-01-01')]
      const sessions = Array.from({ length: 15 }, (_, i) =>
        createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
      )

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [],
        [],
        1,
        sessions,
      )

      expect(result.totalClassesThisWeek).toBe(15)
      expect(result.rate).toBe(0.51)
    })

    it('returns 0.46 rate at exactly 12 classes', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const packages = [createPackage(1, 1, 1, 20, '2025-01-01')]
      const sessions = Array.from({ length: 12 }, (_, i) =>
        createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
      )

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [],
        [],
        1,
        sessions,
      )

      expect(result.totalClassesThisWeek).toBe(12)
      expect(result.rate).toBe(0.46)
    })
  })

  describe('bonusIncome', () => {
    it('sums sales bonuses from packages sold by the trainer this week', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const weeklyPackages = [
        createPackage(1, 1, 1, 10, '2025-01-06', 50),
        createPackage(2, 1, 1, 10, '2025-01-08', 75),
      ]

      const result = computeIncomeSummary(
        clients,
        [],
        [],
        weeklyPackages,
        [],
        1,
        [],
      )

      expect(result.bonusIncome).toBe(125)
    })

    it('excludes bonuses from packages sold by other trainers', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const weeklyPackages = [
        createPackage(1, 1, 1, 10, '2025-01-06', 50), // Trainer 1
        createPackage(2, 1, 2, 10, '2025-01-08', 75), // Trainer 2
      ]

      const result = computeIncomeSummary(
        clients,
        [],
        [],
        weeklyPackages,
        [],
        1, // Trainer 1
        [],
      )

      expect(result.bonusIncome).toBe(50)
    })

    it('handles packages with no bonus (undefined)', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const weeklyPackages = [
        createPackage(1, 1, 1, 10, '2025-01-06'), // No bonus
      ]

      const result = computeIncomeSummary(
        clients,
        [],
        [],
        weeklyPackages,
        [],
        1,
        [],
      )

      expect(result.bonusIncome).toBe(0)
    })
  })

  describe('lateFeeIncome', () => {
    it('sums all late fees in the week', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const lateFees = [
        createLateFee(1, 1, 1, '2025-01-06', 25),
        createLateFee(2, 1, 1, '2025-01-08', 30),
      ]

      const result = computeIncomeSummary(
        clients,
        [],
        [],
        [],
        lateFees,
        1,
        [],
      )

      expect(result.lateFeeIncome).toBe(55)
    })

    it('returns 0 when no late fees exist', () => {
      const result = computeIncomeSummary([], [], [], [], [], 1, [])
      expect(result.lateFeeIncome).toBe(0)
    })
  })

  describe('class income calculation', () => {
    it('calculates income based on package price and rate', () => {
      const clients = [createClient(1, 'Alice', 1)] // Tier 1 pricing
      const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
      const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [],
        [],
        1,
        sessions,
      )

      // Client has tier 1 pricing: 10 sessions = $150/class
      // 1 class * $150 * 0.46 rate = $69
      expect(result.finalWeeklyIncome).toBe(69)
    })

    it('uses drop-in rate for sessions without package', () => {
      const clients = [createClient(1, 'Alice', 1)] // Tier 1 pricing
      const sessions = [createSession(1, 1, 1, null, '2025-01-06')]

      const result = computeIncomeSummary(
        clients,
        [],
        sessions,
        [],
        [],
        1,
        sessions,
      )

      // Client has tier 1 pricing: drop-in = 1 session = $150/class
      // 1 class * $150 * 0.46 rate = $69
      expect(result.finalWeeklyIncome).toBe(69)
    })
  })

  describe('finalWeeklyIncome', () => {
    it('combines class income, bonus, and late fees', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const packages = [createPackage(1, 1, 1, 10, '2025-01-01', 50)]
      const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]
      const lateFees = [createLateFee(1, 1, 1, '2025-01-06', 25)]

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [packages[0]], // Weekly package with bonus
        lateFees,
        1,
        sessions,
      )

      // Class income: $150 * 0.46 = $69
      // Bonus: $50
      // Late fee: $25
      // Total: $144
      expect(result.bonusIncome).toBe(50)
      expect(result.lateFeeIncome).toBe(25)
      expect(result.finalWeeklyIncome).toBe(144)
    })

    it('returns 0 when no activity this week', () => {
      const result = computeIncomeSummary([], [], [], [], [], 1, [])

      expect(result.totalClassesThisWeek).toBe(0)
      expect(result.bonusIncome).toBe(0)
      expect(result.lateFeeIncome).toBe(0)
      expect(result.finalWeeklyIncome).toBe(0)
    })
  })

  describe('backfillAdjustment', () => {
    it('deducts overpayment when package is purchased with backdated start date', () => {
      // Scenario: Session on Jan 1, package purchased on Jan 8 with start date Jan 1
      // The session was originally a drop-in ($150), now it's part of a 14-session package ($140)
      // Adjustment = ($150 - $140) * 0.46 = $4.60
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-01') // Start date is Jan 1
      const backfilledSession = createSession(1, 1, 1, 1, '2024-12-30') // Session before start date

      // Week of Jan 6-12: package is purchased this week
      const result = computeIncomeSummary(
        clients,
        [pkg],
        [], // No sessions this week
        [pkg], // Package purchased this week
        [],
        1,
        [backfilledSession], // All sessions including backfilled one
      )

      // Tier 1 client, 14 sessions = $140/class
      // Single-class rate = $150
      // Diff = $10 * 0.46 (original week had 1 class, so 46% rate) = $4.60
      expect(result.backfillAdjustment).toBeCloseTo(4.6, 2)
    })

    it('calculates backfill for multiple sessions', () => {
      // 3 sessions before package start date
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-06')
      const backfilledSessions = [
        createSession(1, 1, 1, 1, '2025-01-01'), // Wed
        createSession(2, 1, 1, 1, '2025-01-02'), // Thu
        createSession(3, 1, 1, 1, '2025-01-03'), // Fri
      ]

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [],
        [pkg],
        [],
        1,
        backfilledSessions,
      )

      // 3 sessions * $10 diff * 0.46 rate = $13.80
      // (all 3 sessions are in the same week Dec 30 - Jan 5, with 3 classes = 46% rate)
      expect(result.backfillAdjustment).toBeCloseTo(13.8, 2)
    })

    it('uses original week rate (51%) when original week had >12 classes', () => {
      // Scenario: Original week had 15 classes (51% rate), current week has fewer
      // Week of Jan 6-12 (Mon-Sun) can hold all 15 sessions on different times same days
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-13') // Starts Jan 13

      // 15 sessions all on Jan 6-12 (within one week) - some days have multiple sessions
      // Jan 6 (Mon) - Jan 12 (Sun) = 7 days, so we use multiple sessions per day
      const backfilledSessions = [
        createSession(1, 1, 1, 1, '2025-01-06'),
        createSession(2, 1, 1, 1, '2025-01-06'),
        createSession(3, 1, 1, 1, '2025-01-07'),
        createSession(4, 1, 1, 1, '2025-01-07'),
        createSession(5, 1, 1, 1, '2025-01-08'),
        createSession(6, 1, 1, 1, '2025-01-08'),
        createSession(7, 1, 1, 1, '2025-01-09'),
        createSession(8, 1, 1, 1, '2025-01-09'),
        createSession(9, 1, 1, 1, '2025-01-10'),
        createSession(10, 1, 1, 1, '2025-01-10'),
        createSession(11, 1, 1, 1, '2025-01-11'),
        createSession(12, 1, 1, 1, '2025-01-11'),
        createSession(13, 1, 1, 1, '2025-01-12'),
        createSession(14, 1, 1, 1, '2025-01-12'),
        createSession(15, 1, 1, 1, '2025-01-12'),
      ]

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [], // No sessions THIS week (Jan 13-19)
        [pkg], // Package purchased this week
        [],
        1,
        backfilledSessions,
      )

      // 15 sessions * $10 diff * 0.51 rate (original week had >12) = $76.50
      expect(result.backfillAdjustment).toBeCloseTo(76.5, 2)
    })

    it('uses original week rate (46%) when original week had <=12 classes', () => {
      // Scenario: Original week had 10 classes (46% rate)
      // Week of Jan 6-12 (Mon-Sun)
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-13')

      // 10 sessions in the week of Jan 6-12 (within 7 days)
      const backfilledSessions = [
        createSession(1, 1, 1, 1, '2025-01-06'),
        createSession(2, 1, 1, 1, '2025-01-06'),
        createSession(3, 1, 1, 1, '2025-01-07'),
        createSession(4, 1, 1, 1, '2025-01-08'),
        createSession(5, 1, 1, 1, '2025-01-09'),
        createSession(6, 1, 1, 1, '2025-01-10'),
        createSession(7, 1, 1, 1, '2025-01-10'),
        createSession(8, 1, 1, 1, '2025-01-11'),
        createSession(9, 1, 1, 1, '2025-01-12'),
        createSession(10, 1, 1, 1, '2025-01-12'),
      ]

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [],
        [pkg],
        [],
        1,
        backfilledSessions,
      )

      // 10 sessions * $10 diff * 0.46 rate = $46.00
      expect(result.backfillAdjustment).toBeCloseTo(46.0, 2)
    })

    it('handles backfilled sessions from different weeks with different rates', () => {
      // Week 1 (Dec 30 - Jan 5): 15 sessions -> 51% rate
      // Week 2 (Jan 6-12): 5 sessions -> 46% rate
      // Package purchased Jan 13 with start date Jan 13
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 21, '2025-01-13') // 21 sessions = $130/class

      // 15 sessions in week 1 (Dec 30 - Jan 5, within 7 days)
      const week1Sessions = [
        createSession(1, 1, 1, 1, '2024-12-30'),
        createSession(2, 1, 1, 1, '2024-12-30'),
        createSession(3, 1, 1, 1, '2024-12-31'),
        createSession(4, 1, 1, 1, '2024-12-31'),
        createSession(5, 1, 1, 1, '2025-01-01'),
        createSession(6, 1, 1, 1, '2025-01-01'),
        createSession(7, 1, 1, 1, '2025-01-02'),
        createSession(8, 1, 1, 1, '2025-01-02'),
        createSession(9, 1, 1, 1, '2025-01-03'),
        createSession(10, 1, 1, 1, '2025-01-03'),
        createSession(11, 1, 1, 1, '2025-01-04'),
        createSession(12, 1, 1, 1, '2025-01-04'),
        createSession(13, 1, 1, 1, '2025-01-05'),
        createSession(14, 1, 1, 1, '2025-01-05'),
        createSession(15, 1, 1, 1, '2025-01-05'),
      ]
      // 5 sessions in week 2 (Jan 6-12)
      const week2Sessions = [
        createSession(16, 1, 1, 1, '2025-01-06'),
        createSession(17, 1, 1, 1, '2025-01-07'),
        createSession(18, 1, 1, 1, '2025-01-08'),
        createSession(19, 1, 1, 1, '2025-01-09'),
        createSession(20, 1, 1, 1, '2025-01-10'),
      ]

      const allBackfilledSessions = [...week1Sessions, ...week2Sessions]

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [],
        [pkg],
        [],
        1,
        allBackfilledSessions,
      )

      // Single-class = $150, Package = $130, Diff = $20
      // Week 1: 15 sessions * $20 * 0.51 = $153
      // Week 2: 5 sessions * $20 * 0.46 = $46
      // Total = $199
      expect(result.backfillAdjustment).toBeCloseTo(199.0, 2)
    })

    it('returns 0 adjustment when no sessions are before package start date', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-01')
      const session = createSession(1, 1, 1, 1, '2025-01-06') // After start date

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [session],
        [pkg],
        [],
        1,
        [session],
      )

      expect(result.backfillAdjustment).toBe(0)
    })

    it('returns 0 adjustment when package is not purchased this week', () => {
      // Package was purchased last week, so no adjustment this week
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-01')
      const backfilledSession = createSession(1, 1, 1, 1, '2024-12-30')

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [],
        [], // Package NOT in weeklyPackages (was purchased before this week)
        [],
        1,
        [backfilledSession],
      )

      expect(result.backfillAdjustment).toBe(0)
    })

    it('skips adjustment when package price equals or exceeds single-class price', () => {
      // Edge case: 1-session package = same as single-class rate
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 1, '2025-01-06') // 1 session = $150
      const backfilledSession = createSession(1, 1, 1, 1, '2025-01-01')

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [],
        [pkg],
        [],
        1,
        [backfilledSession],
      )

      // No diff since both are $150
      expect(result.backfillAdjustment).toBe(0)
    })

    it('subtracts backfill adjustment from final income', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const pkg = createPackage(1, 1, 1, 14, '2025-01-06', 50) // With bonus
      const currentSession = createSession(1, 1, 1, 1, '2025-01-06')
      const backfilledSession = createSession(2, 1, 1, 1, '2025-01-01')

      const result = computeIncomeSummary(
        clients,
        [pkg],
        [currentSession],
        [pkg],
        [],
        1,
        [currentSession, backfilledSession],
      )

      // Class income: $140 * 0.46 = $64.40
      // Bonus: $50
      // Backfill: $10 * 0.46 = $4.60 (backfilled session had 2 classes that week -> 46%)
      // Final: $64.40 + $50 - $4.60 = $109.80
      expect(result.backfillAdjustment).toBeCloseTo(4.6, 2)
      expect(result.finalWeeklyIncome).toBeCloseTo(109.8, 2)
    })
  })
})
