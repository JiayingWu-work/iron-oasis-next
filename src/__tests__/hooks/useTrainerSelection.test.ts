import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTrainerSelection } from '@/hooks/useTrainerSelection'
import type { Trainer } from '@/types'

describe('useTrainerSelection', () => {
  const mockTrainers: Trainer[] = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true },
    { id: 3, name: 'Bob', tier: 3, email: 'bob@test.com', isActive: true },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with empty trainers and null selectedTrainerId', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: [] }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    expect(result.current.trainers).toEqual([])
    expect(result.current.selectedTrainerId).toBeNull()
    expect(result.current.selectedTrainer).toBeNull()
  })

  it('fetches trainers on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: mockTrainers }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(result.current.trainers).toEqual(mockTrainers)
    })

    expect(fetch).toHaveBeenCalledWith('/api/trainers?active=true')
  })

  it('selects first trainer as default when trainers load', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: mockTrainers }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(result.current.selectedTrainerId).toBe(1)
    })

    expect(result.current.selectedTrainer).toEqual(mockTrainers[0])
  })

  it('allows changing selected trainer', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: mockTrainers }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(result.current.trainers).toHaveLength(3)
    })

    act(() => {
      result.current.setSelectedTrainerId(2)
    })

    expect(result.current.selectedTrainerId).toBe(2)
    expect(result.current.selectedTrainer).toEqual(mockTrainers[1])
  })

  it('returns null selectedTrainer for non-existent trainer id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: mockTrainers }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(result.current.trainers).toHaveLength(3)
    })

    act(() => {
      result.current.setSelectedTrainerId(999)
    })

    expect(result.current.selectedTrainerId).toBe(999)
    expect(result.current.selectedTrainer).toBeNull()
  })

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load trainers')
    })

    expect(result.current.trainers).toEqual([])
    expect(result.current.selectedTrainerId).toBeNull()

    consoleSpy.mockRestore()
  })

  it('does not select trainer if no trainers returned', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ trainers: [] }),
    } as Response)

    const { result } = renderHook(() => useTrainerSelection())

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    // Give it time to potentially update
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current.selectedTrainerId).toBeNull()
    expect(result.current.selectedTrainer).toBeNull()
  })
})
