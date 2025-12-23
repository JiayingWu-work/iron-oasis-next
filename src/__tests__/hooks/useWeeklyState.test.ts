import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWeeklyState } from '@/hooks/useWeeklyState'
import type { Trainer } from '@/types'

describe('useWeeklyState', () => {
  const mockTrainer: Trainer = { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true }

  const mockApiResponse = {
    weekStart: '2025-01-06',
    weekEnd: '2025-01-12',
    clients: [
      {
        id: 1,
        name: 'Alice',
        trainer_id: 1,
        secondary_trainer_id: null,
        mode: '1v1',
        tier_at_signup: 1,
        price_1_12: 150,
        price_13_20: 140,
        price_21_plus: 130,
        mode_premium: 20,
        created_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'Bob',
        trainer_id: 1,
        secondary_trainer_id: 2,
        mode: '1v2',
        tier_at_signup: 2,
        price_1_12: 165,
        price_13_20: 155,
        price_21_plus: 145,
        mode_premium: 20,
        created_at: '2025-01-02T00:00:00.000Z',
      },
    ],
    packages: [
      {
        id: 1,
        client_id: 1,
        trainer_id: 1,
        sessions_purchased: 10,
        start_date: '2025-01-01T00:00:00.000Z',
        sales_bonus: 50,
        mode: '1v1',
      },
    ],
    sessions: [
      {
        id: 1,
        date: '2025-01-06T00:00:00.000Z',
        trainer_id: 1,
        client_id: 1,
        package_id: 1,
        mode: '1v1',
      },
    ],
    lateFees: [
      {
        id: 1,
        client_id: 1,
        trainer_id: 1,
        date: '2025-01-07T00:00:00.000Z',
        amount: 25,
      },
    ],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with week range from selected date', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    // Should compute Monday-Sunday for Jan 8 (Wednesday)
    expect(result.current.weekStart).toBe('2025-01-06')
    expect(result.current.weekEnd).toBe('2025-01-12')
  })

  it('fetches data when trainer and date are provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    renderHook(() => useWeeklyState(mockTrainer, '2025-01-08'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/trainer/1/week?date=2025-01-08',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  it('does not fetch when trainer is null', async () => {
    const { result } = renderHook(() => useWeeklyState(null, '2025-01-08'))

    // Wait a tick to ensure no fetch was made
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.clients).toEqual([])
  })

  it('transforms API client data correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.clients).toHaveLength(2)
    })

    expect(result.current.clients[0]).toEqual({
      id: 1,
      name: 'Alice',
      trainerId: 1,
      secondaryTrainerId: undefined,
      mode: '1v1',
      tierAtSignup: 1,
      price1_12: 150,
      price13_20: 140,
      price21Plus: 130,
      modePremium: 20,
      createdAt: '2025-01-01T00:00:00.000Z',
      isActive: true,
    })

    expect(result.current.clients[1]).toEqual({
      id: 2,
      name: 'Bob',
      trainerId: 1,
      secondaryTrainerId: 2,
      mode: '1v2',
      tierAtSignup: 2,
      price1_12: 165,
      price13_20: 155,
      price21Plus: 145,
      modePremium: 20,
      createdAt: '2025-01-02T00:00:00.000Z',
      isActive: true,
    })
  })

  it('transforms API package data correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.packages).toHaveLength(1)
    })

    expect(result.current.packages[0]).toEqual({
      id: 1,
      clientId: 1,
      trainerId: 1,
      sessionsPurchased: 10,
      startDate: '2025-01-01',
      salesBonus: 50,
      mode: '1v1',
    })
  })

  it('transforms API session data correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1)
    })

    expect(result.current.sessions[0]).toEqual({
      id: 1,
      date: '2025-01-06',
      trainerId: 1,
      clientId: 1,
      packageId: 1,
      mode: '1v1',
    })
  })

  it('transforms API late fee data correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.lateFees).toHaveLength(1)
    })

    expect(result.current.lateFees[0]).toEqual({
      id: 1,
      clientId: 1,
      trainerId: 1,
      date: '2025-01-07',
      amount: 25,
    })
  })

  it('handles missing lateFees in API response', async () => {
    const responseWithoutLateFees = { ...mockApiResponse, lateFees: undefined }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithoutLateFees),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.clients).toHaveLength(2)
    })

    expect(result.current.lateFees).toEqual([])
  })

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load dashboard data')
    })

    // State should remain at initial values
    expect(result.current.clients).toEqual([])

    consoleSpy.mockRestore()
  })

  it('exposes setters for manual state updates', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { result } = renderHook(() =>
      useWeeklyState(mockTrainer, '2025-01-08'),
    )

    await waitFor(() => {
      expect(result.current.clients).toHaveLength(2)
    })

    // Test setClients
    act(() => {
      result.current.setClients([
        {
          id: 99,
          name: 'New',
          trainerId: 1,
          mode: '1v1',
          tierAtSignup: 1,
          price1_12: 150,
          price13_20: 140,
          price21Plus: 130,
          modePremium: 20,
          createdAt: '2025-01-01',
          isActive: true,
        },
      ])
    })
    expect(result.current.clients).toHaveLength(1)
    expect(result.current.clients[0].name).toBe('New')

    // Test setPackages
    act(() => {
      result.current.setPackages([])
    })
    expect(result.current.packages).toEqual([])

    // Test setSessions
    act(() => {
      result.current.setSessions([])
    })
    expect(result.current.sessions).toEqual([])

    // Test setLateFees
    act(() => {
      result.current.setLateFees([])
    })
    expect(result.current.lateFees).toEqual([])
  })

  it('refetches when trainer changes', async () => {
    const trainer2: Trainer = { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { rerender } = renderHook(
      ({ trainer, date }) => useWeeklyState(trainer, date),
      { initialProps: { trainer: mockTrainer, date: '2025-01-08' } },
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/trainer/1/week?date=2025-01-08',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })

    rerender({ trainer: trainer2, date: '2025-01-08' })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/trainer/2/week?date=2025-01-08',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  it('refetches when date changes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { rerender } = renderHook(
      ({ trainer, date }) => useWeeklyState(trainer, date),
      { initialProps: { trainer: mockTrainer, date: '2025-01-08' } },
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/trainer/1/week?date=2025-01-08',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })

    rerender({ trainer: mockTrainer, date: '2025-01-15' })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/trainer/1/week?date=2025-01-15',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })
})
