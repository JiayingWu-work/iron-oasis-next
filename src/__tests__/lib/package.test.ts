import { describe, it, expect } from 'vitest'
import { pickPackageForSession } from '@/lib/package'
import type { Package, Session } from '@/types'

describe('pickPackageForSession', () => {
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

  it('returns undefined when no packages exist', () => {
    const result = pickPackageForSession(1, 1, '2025-01-15', [], [])
    expect(result).toBeUndefined()
  })

  it('returns undefined when no matching client/trainer packages', () => {
    const packages: Package[] = [
      createPackage(1, 2, 1, 10, '2025-01-01'), // Wrong client
      createPackage(2, 1, 2, 10, '2025-01-01'), // Wrong trainer
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result).toBeUndefined()
  })

  it('returns undefined when session date is before package start date', () => {
    const packages: Package[] = [createPackage(1, 1, 1, 10, '2025-01-20')]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result).toBeUndefined()
  })

  it('returns the package when it has available capacity', () => {
    const packages: Package[] = [createPackage(1, 1, 1, 10, '2025-01-01')]
    const sessions: Session[] = [createSession(1, 1, 1, 1, '2025-01-05')]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, sessions)
    expect(result).toEqual(packages[0])
  })

  it('returns package when session date equals start date', () => {
    const packages: Package[] = [createPackage(1, 1, 1, 10, '2025-01-15')]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result).toEqual(packages[0])
  })

  it('returns undefined when package is fully used', () => {
    const packages: Package[] = [createPackage(1, 1, 1, 2, '2025-01-01')]
    const sessions: Session[] = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, sessions)
    expect(result).toBeUndefined()
  })

  it('returns the oldest package with capacity first (FIFO)', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 2, '2025-01-01'), // Older, but full
      createPackage(2, 1, 1, 5, '2025-01-10'), // Newer with capacity
    ]
    const sessions: Session[] = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 1, '2025-01-06'),
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, sessions)
    expect(result).toEqual(packages[1])
  })

  it('prioritizes older packages when both have capacity', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 5, '2025-01-01'), // Older with capacity
      createPackage(2, 1, 1, 5, '2025-01-10'), // Newer with capacity
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result).toEqual(packages[0])
  })

  it('skips packages that start after the session date', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 5, '2025-02-01'), // Starts in the future
      createPackage(2, 1, 1, 5, '2025-01-01'), // Starts before session
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result).toEqual(packages[1])
  })

  it('handles multiple clients with separate packages', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 5, '2025-01-01'), // Client 1
      createPackage(2, 2, 1, 5, '2025-01-01'), // Client 2
    ]

    // Client 1 should get package 1
    const result1 = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result1?.id).toBe(1)

    // Client 2 should get package 2
    const result2 = pickPackageForSession(2, 1, '2025-01-15', packages, [])
    expect(result2?.id).toBe(2)
  })

  it('handles multiple trainers with separate packages', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 5, '2025-01-01'), // Trainer 1
      createPackage(2, 1, 2, 5, '2025-01-01'), // Trainer 2
    ]

    // Trainer 1 should get package 1
    const result1 = pickPackageForSession(1, 1, '2025-01-15', packages, [])
    expect(result1?.id).toBe(1)

    // Trainer 2 should get package 2
    const result2 = pickPackageForSession(1, 2, '2025-01-15', packages, [])
    expect(result2?.id).toBe(2)
  })

  it('correctly counts sessions only from the specific package', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 2, '2025-01-01'),
      createPackage(2, 1, 1, 3, '2025-01-10'),
    ]
    const sessions: Session[] = [
      createSession(1, 1, 1, 1, '2025-01-05'), // Package 1
      createSession(2, 1, 1, 1, '2025-01-06'), // Package 1 (now full)
      createSession(3, 1, 1, 2, '2025-01-12'), // Package 2
    ]

    // Package 1 is full, so should return package 2
    const result = pickPackageForSession(1, 1, '2025-01-15', packages, sessions)
    expect(result?.id).toBe(2)
  })

  it('returns undefined when all packages are fully consumed', () => {
    const packages: Package[] = [
      createPackage(1, 1, 1, 1, '2025-01-01'),
      createPackage(2, 1, 1, 1, '2025-01-10'),
    ]
    const sessions: Session[] = [
      createSession(1, 1, 1, 1, '2025-01-05'),
      createSession(2, 1, 1, 2, '2025-01-12'),
    ]

    const result = pickPackageForSession(1, 1, '2025-01-15', packages, sessions)
    expect(result).toBeUndefined()
  })
})
