import { describe, it, expect } from 'vitest'
import { computeBreakdownRows } from '@/lib/weeklyDashboard/computeBreakdownRows'
import type { Client, Package, Session, LateFee } from '@/types'

describe('computeBreakdownRows', () => {
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

  it('returns empty array when no data exists', () => {
    const result = computeBreakdownRows([], [], [], [], [], 1)
    expect(result).toEqual([])
  })

  it('creates package rows with correct amount', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-06')]
    const weeklyPackages = packages

    const result = computeBreakdownRows(
      clients,
      packages,
      [],
      weeklyPackages,
      [],
      1, // Tier 1
    )

    const packageRow = result.find((r) => r.type === 'package')!
    // Tier 1, 10 sessions = $150/class, total = $1500
    expect(packageRow.amount).toBe(1500)
    expect(packageRow.clientName).toBe('Alice')
    expect(packageRow.date).toBe('2025-01-06')
  })

  it('creates bonus rows for packages with sales bonus', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-06', 75)]

    const result = computeBreakdownRows(
      clients,
      packages,
      [],
      packages,
      [],
      1,
    )

    const bonusRow = result.find((r) => r.type === 'bonus')!
    expect(bonusRow.amount).toBe(75)
    expect(bonusRow.clientName).toBe('Alice')
    expect(bonusRow.id).toBe('1-bonus')
  })

  it('does not create bonus row when salesBonus is 0 or undefined', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [
      createPackage(1, 1, 1, 10, '2025-01-06', 0),
      createPackage(2, 1, 1, 10, '2025-01-07'), // undefined
    ]

    const result = computeBreakdownRows(
      clients,
      packages,
      [],
      packages,
      [],
      1,
    )

    const bonusRows = result.filter((r) => r.type === 'bonus')
    expect(bonusRows).toHaveLength(0)
  })

  it('creates session rows with correct income calculation', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-06')]

    const result = computeBreakdownRows(
      clients,
      packages,
      sessions,
      [],
      [],
      1, // Tier 1
    )

    const sessionRow = result.find((r) => r.type === 'session')!
    // Tier 1, 10 sessions package = $150/class
    // 1 session, rate = 0.46 (< 12 classes)
    // Amount = $150 * 0.46 = $69
    expect(sessionRow.amount).toBe(69)
    expect(sessionRow.clientName).toBe('Alice')
  })

  it('uses drop-in rate for sessions without package', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const sessions = [createSession(1, 1, 1, null, '2025-01-06')]

    const result = computeBreakdownRows(
      clients,
      [],
      sessions,
      [],
      [],
      1, // Tier 1
    )

    const sessionRow = result.find((r) => r.type === 'session')!
    // Drop-in = single class = $150 (Tier 1)
    // Rate = 0.46, Amount = $69
    expect(sessionRow.amount).toBe(69)
  })

  it('applies 0.51 rate when more than 12 sessions in week', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 20, '2025-01-01')]
    const sessions = Array.from({ length: 15 }, (_, i) =>
      createSession(i + 1, 1, 1, 1, `2025-01-${String(i + 6).padStart(2, '0')}`),
    )

    const result = computeBreakdownRows(
      clients,
      packages,
      sessions,
      [],
      [],
      1,
    )

    const sessionRows = result.filter((r) => r.type === 'session')
    // Tier 1, 20 sessions = $140/class
    // Rate = 0.51 (> 12 classes)
    // Amount per session = $140 * 0.51 = $71.4
    sessionRows.forEach((row) => {
      expect(row.amount).toBeCloseTo(71.4)
    })
  })

  it('creates late fee rows correctly', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const lateFees = [createLateFee(1, 1, 1, '2025-01-06', 25)]

    const result = computeBreakdownRows(
      clients,
      [],
      [],
      [],
      lateFees,
      1,
    )

    const lateFeeRow = result.find((r) => r.type === 'lateFee')!
    expect(lateFeeRow.amount).toBe(25)
    expect(lateFeeRow.clientName).toBe('Alice')
    expect(lateFeeRow.date).toBe('2025-01-06')
  })

  it('sorts all rows by date', () => {
    const clients = [createClient(1, 'Alice', 1)]
    // Package without salesBonus so we don't get a bonus row
    const packages = [createPackage(1, 1, 1, 10, '2025-01-08')]
    const sessions = [createSession(1, 1, 1, null, '2025-01-06')]
    const lateFees = [createLateFee(1, 1, 1, '2025-01-10', 25)]

    const result = computeBreakdownRows(
      clients,
      packages,
      sessions,
      packages,
      lateFees,
      1,
    )

    // Result has: 1 session (01-06), 1 package (01-08), 1 late fee (01-10)
    // No bonus since salesBonus is undefined
    const dates = result.map((r) => r.date)
    expect(dates).toEqual(['2025-01-06', '2025-01-08', '2025-01-10'])
  })

  it('handles unknown client gracefully', () => {
    const sessions = [createSession(1, 999, 1, null, '2025-01-06')]

    const result = computeBreakdownRows(
      [], // No clients
      [],
      sessions,
      [],
      [],
      1,
    )

    expect(result[0].clientName).toBe('Unknown client')
  })

  it('combines all row types correctly', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const allPackages = [createPackage(1, 1, 1, 10, '2025-01-06', 50)]
    const sessions = [createSession(1, 1, 1, 1, '2025-01-07')]
    const lateFees = [createLateFee(1, 1, 1, '2025-01-08', 25)]

    const result = computeBreakdownRows(
      clients,
      allPackages,
      sessions,
      allPackages,
      lateFees,
      1,
    )

    const types = result.map((r) => r.type)
    expect(types).toContain('package')
    expect(types).toContain('bonus')
    expect(types).toContain('session')
    expect(types).toContain('lateFee')
    expect(result).toHaveLength(4)
  })

  it('calculates correct amount for different trainer tiers', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-06')]

    // Tier 1
    const result1 = computeBreakdownRows(clients, packages, [], [packages[0]], [], 1)
    expect(result1[0].amount).toBe(1500) // $150 * 10

    // Tier 2
    const result2 = computeBreakdownRows(clients, packages, [], [packages[0]], [], 2)
    expect(result2[0].amount).toBe(1650) // $165 * 10

    // Tier 3
    const result3 = computeBreakdownRows(clients, packages, [], [packages[0]], [], 3)
    expect(result3[0].amount).toBe(1800) // $180 * 10
  })
})
