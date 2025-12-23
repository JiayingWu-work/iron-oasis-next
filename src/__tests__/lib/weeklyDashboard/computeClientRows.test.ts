import { describe, it, expect } from 'vitest'
import { computeClientRows } from '@/lib/weeklyDashboard/computeClientRows'
import type { Client, Package, Session } from '@/types'

describe('computeClientRows', () => {
  const createClient = (
    id: number,
    name: string,
    trainerId: number,
  ): Client => ({
    id,
    name,
    trainerId,
    mode: '1v1',
    tierAtSignup: 1,
    price1_12: 150,
    price13_20: 140,
    price21Plus: 130,
    modePremium: 20,
    createdAt: '2025-01-01',
    isActive: true,
  })

  const createPackage = (
    id: number,
    clientId: number,
    trainerId: number,
    sessionsPurchased: number,
    startDate: string,
  ): Package => ({
    id,
    clientId,
    trainerId,
    sessionsPurchased,
    startDate,
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

  it('returns empty array when no clients exist', () => {
    const result = computeClientRows([], [], [], [])
    expect(result).toEqual([])
  })

  it('returns client with zero values when no packages or sessions', () => {
    const clients = [createClient(1, 'Alice', 1)]

    const result = computeClientRows(clients, [], [], [])

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      clientId: 1,
      clientName: 'Alice',
      packageDisplay: '0',
      usedDisplay: '0',
      remainingDisplay: '0',
      weekCount: 0,
      totalRemaining: 0,
    })
  })

  it('calculates package usage correctly for single package', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
      createSession(3, 1, 1, 1, '2025-01-07'),
    ]
    const weeklySessions = sessions.slice(-1) // Only last session this week

    const result = computeClientRows(clients, packages, sessions, weeklySessions)

    expect(result[0]).toEqual({
      clientId: 1,
      clientName: 'Alice',
      packageDisplay: '10',
      usedDisplay: '3',
      remainingDisplay: '7',
      weekCount: 1,
      totalRemaining: 7,
    })
  })

  it('shows up to 2 active packages when both have remaining sessions', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [
      createPackage(1, 1, 1, 5, '2025-01-01'),
      createPackage(2, 1, 1, 10, '2025-01-10'),
    ]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
    ]

    const result = computeClientRows(clients, packages, sessions, [])

    // Both packages have remaining sessions
    expect(result[0].packageDisplay).toBe('5 + 10')
    expect(result[0].usedDisplay).toBe('2 + 0')
    expect(result[0].remainingDisplay).toBe('3 + 10')
    expect(result[0].totalRemaining).toBe(13)
  })

  it('shows only last 2 active packages when more than 2 exist', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [
      createPackage(1, 1, 1, 5, '2025-01-01'),
      createPackage(2, 1, 1, 5, '2025-01-10'),
      createPackage(3, 1, 1, 10, '2025-01-20'),
    ]
    // Package 1 is full, 2 and 3 have remaining
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
      createSession(3, 1, 1, 1, '2025-01-07'),
      createSession(4, 1, 1, 1, '2025-01-08'),
      createSession(5, 1, 1, 1, '2025-01-09'), // Package 1 now full
    ]

    const result = computeClientRows(clients, packages, sessions, [])

    // Only packages 2 and 3 (active ones)
    expect(result[0].packageDisplay).toBe('5 + 10')
    expect(result[0].usedDisplay).toBe('0 + 0')
    expect(result[0].remainingDisplay).toBe('5 + 10')
    expect(result[0].totalRemaining).toBe(15)
  })

  it('shows only latest package when all packages are consumed', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [
      createPackage(1, 1, 1, 2, '2025-01-01'),
      createPackage(2, 1, 1, 2, '2025-01-10'),
    ]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
      createSession(3, 1, 1, 2, '2025-01-12'),
      createSession(4, 1, 1, 2, '2025-01-13'),
    ]

    const result = computeClientRows(clients, packages, sessions, [])

    // All consumed, show only latest
    expect(result[0].packageDisplay).toBe('2')
    expect(result[0].usedDisplay).toBe('2')
    expect(result[0].remainingDisplay).toBe('0')
    expect(result[0].totalRemaining).toBe(0)
  })

  it('counts weekly sessions correctly', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const allSessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
      createSession(3, 1, 1, 1, '2025-01-10'),
      createSession(4, 1, 1, 1, '2025-01-11'),
    ]
    const weeklySessions = allSessions.slice(2) // Only last 2 are this week

    const result = computeClientRows(clients, packages, allSessions, weeklySessions)

    expect(result[0].weekCount).toBe(2)
  })

  it('handles drop-in client (no packages, only sessions)', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const sessions = [
      createSession(1, 1, 1, null, '2025-01-05'),
      createSession(2, 1, 1, null, '2025-01-06'),
      createSession(3, 1, 1, null, '2025-01-10'),
    ]
    const weeklySessions = [sessions[2]]

    const result = computeClientRows(clients, [], sessions, weeklySessions)

    expect(result[0].packageDisplay).toBe('0')
    expect(result[0].usedDisplay).toBe('3')
    expect(result[0].remainingDisplay).toBe('-3')
    expect(result[0].totalRemaining).toBe(-3)
    expect(result[0].weekCount).toBe(1)
  })

  it('handles multiple clients independently', () => {
    const clients = [
      createClient(1, 'Alice', 1),
      createClient(2, 'Bob', 1),
    ]
    const packages = [
      createPackage(1, 1, 1, 10, '2025-01-01'),
      createPackage(2, 2, 1, 5, '2025-01-01'),
    ]
    const sessions = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 2, 1, 2, '2025-01-05'),
      createSession(3, 2, 1, 2, '2025-01-06'),
    ]

    const result = computeClientRows(clients, packages, sessions, sessions)

    const alice = result.find((r) => r.clientId === 1)!
    const bob = result.find((r) => r.clientId === 2)!

    expect(alice.remainingDisplay).toBe('9')
    expect(alice.weekCount).toBe(1)

    expect(bob.remainingDisplay).toBe('3')
    expect(bob.weekCount).toBe(2)
  })

  it('filters packages by client correctly', () => {
    const clients = [createClient(1, 'Alice', 1)]
    const packages = [
      createPackage(1, 1, 1, 10, '2025-01-01'), // Alice's package
      createPackage(2, 2, 1, 5, '2025-01-01'), // Bob's package
    ]

    const result = computeClientRows(clients, packages, [], [])

    expect(result[0].packageDisplay).toBe('10')
    expect(result[0].usedDisplay).toBe('0')
    expect(result[0].remainingDisplay).toBe('10')
  })
})
