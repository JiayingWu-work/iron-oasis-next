import { describe, it, expect } from 'vitest'
import { computeIncomeSummary } from '@/lib/weeklyDashboard/computeIncomeSummary'
import type { Client, Package, Session, LateFee } from '@/types'

describe('computeIncomeSummary', () => {
  const createClient = (
    id: number,
    name: string,
    trainerId: number,
  ): Client => ({
    id,
    name,
    trainerId,
  })

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
        1,
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
        1,
        [],
      )

      expect(result.lateFeeIncome).toBe(55)
    })

    it('returns 0 when no late fees exist', () => {
      const result = computeIncomeSummary([], [], [], [], [], 1, 1, [])
      expect(result.lateFeeIncome).toBe(0)
    })
  })

  describe('class income calculation', () => {
    it('calculates income based on package price and rate', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
      const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

      const result = computeIncomeSummary(
        clients,
        packages,
        sessions,
        [],
        [],
        1, // Tier 1
        1,
        sessions,
      )

      // Tier 1, 10 sessions = $150/class
      // 1 class * $150 * 0.46 rate = $69
      expect(result.finalWeeklyIncome).toBe(69)
    })

    it('uses drop-in rate for sessions without package', () => {
      const clients = [createClient(1, 'Alice', 1)]
      const sessions = [createSession(1, 1, 1, null, '2025-01-06')]

      const result = computeIncomeSummary(
        clients,
        [],
        sessions,
        [],
        [],
        1, // Tier 1
        1,
        sessions,
      )

      // Tier 1, 1 session (drop-in) = $150/class (highest rate)
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
      const result = computeIncomeSummary([], [], [], [], [], 1, 1, [])

      expect(result.totalClassesThisWeek).toBe(0)
      expect(result.bonusIncome).toBe(0)
      expect(result.lateFeeIncome).toBe(0)
      expect(result.finalWeeklyIncome).toBe(0)
    })
  })
})
