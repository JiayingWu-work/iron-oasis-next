import { describe, it, expect } from 'vitest'
import {
  formatDateToInput,
  getWeekRange,
  shiftDateByDays,
  isWithinRange,
} from '@/lib/date'

describe('formatDateToInput', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15) // January 15, 2025
    expect(formatDateToInput(date)).toBe('2025-01-15')
  })

  it('pads single-digit months with zero', () => {
    const date = new Date(2025, 0, 5) // January 5, 2025
    expect(formatDateToInput(date)).toBe('2025-01-05')
  })

  it('pads single-digit days with zero', () => {
    const date = new Date(2025, 11, 9) // December 9, 2025
    expect(formatDateToInput(date)).toBe('2025-12-09')
  })

  it('handles December correctly', () => {
    const date = new Date(2025, 11, 25) // December 25, 2025
    expect(formatDateToInput(date)).toBe('2025-12-25')
  })

  it('handles year boundaries', () => {
    const date = new Date(2024, 11, 31) // December 31, 2024
    expect(formatDateToInput(date)).toBe('2024-12-31')
  })
})

describe('getWeekRange', () => {
  it('returns Monday-Sunday range for a Monday date', () => {
    const range = getWeekRange('2025-01-06') // Monday
    expect(range.start).toBe('2025-01-06') // Same Monday
    expect(range.end).toBe('2025-01-12') // Following Sunday
  })

  it('returns Monday-Sunday range for a Wednesday date', () => {
    const range = getWeekRange('2025-01-08') // Wednesday
    expect(range.start).toBe('2025-01-06') // Previous Monday
    expect(range.end).toBe('2025-01-12') // Following Sunday
  })

  it('returns Monday-Sunday range for a Sunday date', () => {
    const range = getWeekRange('2025-01-12') // Sunday
    expect(range.start).toBe('2025-01-06') // Monday of that week
    expect(range.end).toBe('2025-01-12') // Same Sunday
  })

  it('returns Monday-Sunday range for a Saturday date', () => {
    const range = getWeekRange('2025-01-11') // Saturday
    expect(range.start).toBe('2025-01-06') // Previous Monday
    expect(range.end).toBe('2025-01-12') // Following Sunday
  })

  it('handles week spanning month boundary', () => {
    const range = getWeekRange('2025-01-02') // Thursday
    expect(range.start).toBe('2024-12-30') // Monday in December
    expect(range.end).toBe('2025-01-05') // Sunday in January
  })

  it('handles week spanning year boundary', () => {
    const range = getWeekRange('2024-12-31') // Tuesday
    expect(range.start).toBe('2024-12-30') // Monday
    expect(range.end).toBe('2025-01-05') // Sunday in next year
  })
})

describe('shiftDateByDays', () => {
  it('adds positive days correctly', () => {
    expect(shiftDateByDays('2025-01-10', 5)).toBe('2025-01-15')
  })

  it('subtracts days with negative delta', () => {
    expect(shiftDateByDays('2025-01-10', -5)).toBe('2025-01-05')
  })

  it('shifts by a week (7 days)', () => {
    expect(shiftDateByDays('2025-01-10', 7)).toBe('2025-01-17')
    expect(shiftDateByDays('2025-01-10', -7)).toBe('2025-01-03')
  })

  it('handles month boundary crossing forward', () => {
    expect(shiftDateByDays('2025-01-30', 3)).toBe('2025-02-02')
  })

  it('handles month boundary crossing backward', () => {
    expect(shiftDateByDays('2025-02-02', -3)).toBe('2025-01-30')
  })

  it('handles year boundary crossing forward', () => {
    expect(shiftDateByDays('2024-12-30', 5)).toBe('2025-01-04')
  })

  it('handles year boundary crossing backward', () => {
    expect(shiftDateByDays('2025-01-03', -5)).toBe('2024-12-29')
  })

  it('returns same date with zero delta', () => {
    expect(shiftDateByDays('2025-01-15', 0)).toBe('2025-01-15')
  })

  it('handles leap year February', () => {
    expect(shiftDateByDays('2024-02-28', 1)).toBe('2024-02-29') // Leap year
    expect(shiftDateByDays('2024-02-29', 1)).toBe('2024-03-01')
  })
})

describe('isWithinRange', () => {
  it('returns true for date within range', () => {
    expect(isWithinRange('2025-01-10', '2025-01-05', '2025-01-15')).toBe(true)
  })

  it('returns true for date at start of range', () => {
    expect(isWithinRange('2025-01-05', '2025-01-05', '2025-01-15')).toBe(true)
  })

  it('returns true for date at end of range', () => {
    expect(isWithinRange('2025-01-15', '2025-01-05', '2025-01-15')).toBe(true)
  })

  it('returns false for date before range', () => {
    expect(isWithinRange('2025-01-04', '2025-01-05', '2025-01-15')).toBe(false)
  })

  it('returns false for date after range', () => {
    expect(isWithinRange('2025-01-16', '2025-01-05', '2025-01-15')).toBe(false)
  })

  it('handles single-day range', () => {
    expect(isWithinRange('2025-01-10', '2025-01-10', '2025-01-10')).toBe(true)
    expect(isWithinRange('2025-01-09', '2025-01-10', '2025-01-10')).toBe(false)
    expect(isWithinRange('2025-01-11', '2025-01-10', '2025-01-10')).toBe(false)
  })

  it('handles range spanning month boundary', () => {
    expect(isWithinRange('2025-01-02', '2024-12-28', '2025-01-05')).toBe(true)
    expect(isWithinRange('2024-12-30', '2024-12-28', '2025-01-05')).toBe(true)
    expect(isWithinRange('2024-12-27', '2024-12-28', '2025-01-05')).toBe(false)
  })
})
