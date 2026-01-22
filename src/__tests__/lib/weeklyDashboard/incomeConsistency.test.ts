import { describe, it, expect } from 'vitest'
import { computeIncomeSummary } from '@/lib/weeklyDashboard/computeIncomeSummary'
import { computeBreakdownRows } from '@/lib/weeklyDashboard/computeBreakdownRows'
import type { Client, Package, Session, LateFee, IncomeRate } from '@/types'

/**
 * These tests verify that the weekly income summary matches the sum of breakdown rows.
 * This catches bugs where the income calculation and breakdown display diverge
 * (e.g., personal client bonus applied to income but not breakdown).
 */

// Default income rates for tests (46% for 1-12 classes, 51% for 13+)
// Uses effectiveWeek '2024-12-30' which is the Monday before all test dates
// (Jan 1, 2025 falls in the week starting Dec 30, 2024)
const DEFAULT_INCOME_RATES: IncomeRate[] = [
  { id: 1, trainerId: 1, minClasses: 1, maxClasses: 12, rate: 0.46, effectiveWeek: '2024-12-30' },
  { id: 2, trainerId: 1, minClasses: 13, maxClasses: null, rate: 0.51, effectiveWeek: '2024-12-30' },
]

describe('Income consistency between summary and breakdown', () => {
  const createClient = (
    id: number,
    name: string,
    trainerId: number,
    tierAtSignup: 1 | 2 | 3 = 1,
    isPersonalClient = false,
  ): Client => {
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
      location: 'west' as const,
      isPersonalClient,
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
    location: 'west',
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

  /**
   * Helper to verify that breakdown rows sum matches income summary.
   * The formula is:
   *   finalWeeklyIncome = classIncome + bonusIncome + lateFeeIncome - backfillAdjustment
   *
   * For breakdown rows:
   *   - session rows = classIncome (from weeklySessions)
   *   - bonus rows = bonusIncome
   *   - lateFee rows = lateFeeIncome
   *   - package rows are NOT part of income (they show total package value)
   *
   * Note: backfillAdjustment is deducted from income but doesn't have a breakdown row.
   */
  function verifyIncomeConsistency(
    clients: Client[],
    packages: Package[],
    weeklySessions: Session[],
    weeklyPackages: Package[],
    weeklyLateFees: LateFee[],
    trainerId: number,
    allSessions: Session[],
    incomeRates: IncomeRate[],
  ) {
    const incomeSummary = computeIncomeSummary(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      trainerId,
      allSessions,
      incomeRates,
    )

    const breakdownRows = computeBreakdownRows(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      trainerId,
      incomeRates,
    )

    // Sum session rows from breakdown
    const sessionRowsSum = breakdownRows
      .filter((r) => r.type === 'session')
      .reduce((sum, r) => sum + r.amount, 0)

    // Sum bonus rows from breakdown
    const bonusRowsSum = breakdownRows
      .filter((r) => r.type === 'bonus')
      .reduce((sum, r) => sum + r.amount, 0)

    // Sum late fee rows from breakdown
    const lateFeeRowsSum = breakdownRows
      .filter((r) => r.type === 'lateFee')
      .reduce((sum, r) => sum + r.amount, 0)

    // The breakdown total (excluding backfill adjustment) should match
    // finalWeeklyIncome + backfillAdjustment
    const breakdownTotal = sessionRowsSum + bonusRowsSum + lateFeeRowsSum
    const expectedBreakdownTotal =
      incomeSummary.finalWeeklyIncome + incomeSummary.backfillAdjustment

    return {
      incomeSummary,
      breakdownRows,
      sessionRowsSum,
      bonusRowsSum,
      lateFeeRowsSum,
      breakdownTotal,
      expectedBreakdownTotal,
      matches: Math.abs(breakdownTotal - expectedBreakdownTotal) < 0.01, // Allow small floating point diff
    }
  }

  it('single session matches', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // $150 * 0.46 = $69
    expect(result.sessionRowsSum).toBeCloseTo(69, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(69, 2)
  })

  it('personal client bonus is consistent', () => {
    // This is the key test - personal client bonus must be applied
    // BOTH in computeIncomeSummary AND computeBreakdownRows
    const clients = [createClient(1, 'Alice', 1, 1, true)] // personal client
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // $150 * (0.46 + 0.10) = $150 * 0.56 = $84
    expect(result.sessionRowsSum).toBeCloseTo(84, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(84, 2)
  })

  it('mix of personal and non-personal clients is consistent', () => {
    const clients = [
      createClient(1, 'Alice', 1, 1, true),  // personal
      createClient(2, 'Bob', 1, 1, false),   // not personal
    ]
    const packages = [
      createPackage(1, 1, 1, 10, '2025-01-01'),
      createPackage(2, 2, 1, 10, '2025-01-01'),
    ]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-06'),
      createSession(2, 2, 1, 2, '2025-01-07'),
    ]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // Personal: $150 * 0.56 = $84
    // Non-personal: $150 * 0.46 = $69
    // Total: $153
    expect(result.sessionRowsSum).toBeCloseTo(153, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(153, 2)
  })

  it('sessions with bonus income is consistent', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-06', 50)] // $50 bonus
    const sessions = [createSession(1, 1, 1, 1, '2025-01-07')]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      packages, // weeklyPackages
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    expect(result.bonusRowsSum).toBe(50)
    // $150 * 0.46 + $50 bonus = $69 + $50 = $119
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(119, 2)
  })

  it('sessions with late fees is consistent', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]
    const lateFees = [createLateFee(1, 1, 1, '2025-01-06', 25)]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      lateFees,
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    expect(result.lateFeeRowsSum).toBe(25)
    // $150 * 0.46 + $25 late fee = $69 + $25 = $94
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(94, 2)
  })

  it('higher tier rate (13+ classes) is consistent', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 20, '2025-01-01')]
    const sessions = Array.from({ length: 15 }, (_, i) =>
      createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
    )

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // 15 sessions * $140 * 0.51 = $1071
    expect(result.sessionRowsSum).toBeCloseTo(1071, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(1071, 2)
  })

  it('personal client with 13+ classes is consistent', () => {
    const clients = [createClient(1, 'Alice', 1, 1, true)] // personal client
    const packages = [createPackage(1, 1, 1, 20, '2025-01-01')]
    const sessions = Array.from({ length: 15 }, (_, i) =>
      createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
    )

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // 15 sessions * $140 * (0.51 + 0.10) = 15 * $140 * 0.61 = $1281
    expect(result.sessionRowsSum).toBeCloseTo(1281, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(1281, 2)
  })

  it('drop-in session (no package) is consistent', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const sessions = [createSession(1, 1, 1, null, '2025-01-06')]

    const result = verifyIncomeConsistency(
      clients,
      [],
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // Drop-in = $150 * 0.46 = $69
    expect(result.sessionRowsSum).toBeCloseTo(69, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(69, 2)
  })

  it('tier 2 client pricing is consistent', () => {
    const clients = [createClient(1, 'Alice', 1, 2)] // tier 2
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // Tier 2, 10 sessions = $165/class * 0.46 = $75.90
    expect(result.sessionRowsSum).toBeCloseTo(75.9, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(75.9, 2)
  })

  it('tier 2 personal client is consistent', () => {
    const clients = [createClient(1, 'Alice', 1, 2, true)] // tier 2, personal
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // Tier 2, 10 sessions = $165/class * (0.46 + 0.10) = $165 * 0.56 = $92.40
    expect(result.sessionRowsSum).toBeCloseTo(92.4, 2)
    expect(result.incomeSummary.finalWeeklyIncome).toBeCloseTo(92.4, 2)
  })

  it('complex scenario with multiple components is consistent', () => {
    const clients = [
      createClient(1, 'Alice', 1, 1, true),   // personal
      createClient(2, 'Bob', 1, 2, false),    // tier 2, not personal
      createClient(3, 'Carol', 1, 1, false),  // not personal
    ]
    const packages = [
      createPackage(1, 1, 1, 10, '2025-01-01'),
      createPackage(2, 2, 1, 15, '2025-01-01'),
      createPackage(3, 3, 1, 10, '2025-01-06', 75), // weekly package with bonus
    ]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-06'),
      createSession(2, 2, 1, 2, '2025-01-07'),
      createSession(3, 3, 1, 3, '2025-01-08'),
    ]
    const lateFees = [createLateFee(1, 1, 1, '2025-01-06', 25)]

    const result = verifyIncomeConsistency(
      clients,
      packages,
      sessions,
      [packages[2]], // only package 3 is weekly
      lateFees,
      1,
      sessions,
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // 3 classes = 46% rate
    // Alice (personal): $150 * 0.56 = $84
    // Bob (tier 2): $155 * 0.46 = $71.30
    // Carol: $150 * 0.46 = $69
    // Session sum: $84 + $71.30 + $69 = $224.30
    // Bonus: $75
    // Late fee: $25
    // Total: $224.30 + $75 + $25 = $324.30
    expect(result.sessionRowsSum).toBeCloseTo(224.3, 2)
    expect(result.bonusRowsSum).toBe(75)
    expect(result.lateFeeRowsSum).toBe(25)
  })

  it('backfill adjustment scenario is handled correctly', () => {
    // Package purchased this week with start date in the past
    // Session happened before package start date -> backfill adjustment
    const clients = [createClient(1, 'Alice', 1)]
    const pkg = createPackage(1, 1, 1, 14, '2025-01-06') // purchased this week
    const backfilledSession = createSession(1, 1, 1, 1, '2025-01-01') // before package start

    const result = verifyIncomeConsistency(
      clients,
      [pkg],
      [], // no weekly sessions
      [pkg], // package purchased this week
      [],
      1,
      [backfilledSession], // all sessions
      DEFAULT_INCOME_RATES,
    )

    // Backfill adjustment is deducted from income but not shown in breakdown
    // So breakdown total should equal finalWeeklyIncome + backfillAdjustment
    expect(result.matches).toBe(true)
    expect(result.incomeSummary.backfillAdjustment).toBeGreaterThan(0)
  })

  it('personal client backfill adjustment is consistent', () => {
    const clients = [createClient(1, 'Alice', 1, 1, true)] // personal client
    const pkg = createPackage(1, 1, 1, 14, '2025-01-06')
    const backfilledSession = createSession(1, 1, 1, 1, '2025-01-01')

    const result = verifyIncomeConsistency(
      clients,
      [pkg],
      [],
      [pkg],
      [],
      1,
      [backfilledSession],
      DEFAULT_INCOME_RATES,
    )

    expect(result.matches).toBe(true)
    // Backfill adjustment with personal client bonus
    // Diff = ($150 - $140) * 0.56 = $10 * 0.56 = $5.60
    expect(result.incomeSummary.backfillAdjustment).toBeCloseTo(5.6, 2)
  })
})
