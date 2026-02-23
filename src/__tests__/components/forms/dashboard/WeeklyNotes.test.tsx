import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WeeklyNotes from '@/components/forms/entry-bar/WeeklyNotes'

describe('WeeklyNotes', () => {
  const defaultProps = {
    trainerId: 1,
    weekStart: '2025-01-13',
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial render (owner view)', () => {
    it('renders Notes title', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      expect(screen.getByText('Notes')).toBeInTheDocument()
    })

    it('renders textarea with placeholder', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      expect(screen.getByPlaceholderText('Add notes for this week...')).toBeInTheDocument()
    })

    it('renders Save notes button', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Save notes' })).toBeInTheDocument()
    })

    it('Save button is disabled when no changes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Save notes' })).toBeDisabled()
    })
  })

  describe('fetching notes', () => {
    it('fetches notes on mount with correct params', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes trainerId={5} weekStart="2025-02-03" />)

      expect(fetch).toHaveBeenCalledWith(
        '/api/weekly-notes?trainerId=5&weekStart=2025-02-03',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })

    it('displays fetched notes in textarea', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Existing notes from database' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing notes from database')).toBeInTheDocument()
      })
    })

    it('handles fetch error gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<WeeklyNotes {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add notes for this week...')).toHaveValue('')
      })
    })

    it('handles non-ok response gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add notes for this week...')).toHaveValue('')
      })
    })
  })

  describe('editing notes', () => {
    it('enables Save button when text changes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Add notes for this week...')
      fireEvent.change(textarea, { target: { value: 'New note' } })

      expect(screen.getByRole('button', { name: 'Save notes' })).not.toBeDisabled()
    })

    it('disables Save button when text reverts to saved value', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Original note' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original note')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Add notes for this week...')

      // Change it
      fireEvent.change(textarea, { target: { value: 'Modified note' } })
      expect(screen.getByRole('button', { name: 'Save notes' })).not.toBeDisabled()

      // Revert it
      fireEvent.change(textarea, { target: { value: 'Original note' } })
      expect(screen.getByRole('button', { name: 'Save notes' })).toBeDisabled()
    })
  })

  describe('saving notes', () => {
    it('calls PUT /api/weekly-notes with correct data', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: '' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)

      render(<WeeklyNotes trainerId={3} weekStart="2025-01-20" />)

      const textarea = screen.getByPlaceholderText('Add notes for this week...')
      fireEvent.change(textarea, { target: { value: 'My new note' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save notes' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/weekly-notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainerId: 3, weekStart: '2025-01-20', notes: 'My new note' }),
        })
      })
    })

    it('shows Saving... while saving', async () => {
      let resolveSave: () => void
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve
      })

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: '' }),
        } as Response)
        .mockImplementationOnce(() => savePromise.then(() => ({ ok: true } as Response)))

      render(<WeeklyNotes {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Add notes for this week...')
      fireEvent.change(textarea, { target: { value: 'Saving this' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save notes' }))

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()

      resolveSave!()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save notes' })).toBeInTheDocument()
      })
    })

    it('disables Save button after successful save', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: '' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Add notes for this week...')
      fireEvent.change(textarea, { target: { value: 'Saved note' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save notes' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save notes' })).toBeDisabled()
      })
    })

    it('does not call API when no changes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Same note' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Same note')).toBeInTheDocument()
      })

      // Button should be disabled, but let's verify it doesn't call API
      expect(fetch).toHaveBeenCalledTimes(1) // Only the initial GET
    })
  })

  describe('week/trainer changes', () => {
    it('clears notes when weekStart changes', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: 'Week 1 notes' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: 'Week 2 notes' }),
        } as Response)

      const { rerender } = render(<WeeklyNotes trainerId={1} weekStart="2025-01-13" />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Week 1 notes')).toBeInTheDocument()
      })

      rerender(<WeeklyNotes trainerId={1} weekStart="2025-01-20" />)

      // Should clear immediately then load new
      await waitFor(() => {
        expect(screen.getByDisplayValue('Week 2 notes')).toBeInTheDocument()
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/weekly-notes?trainerId=1&weekStart=2025-01-20',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })

    it('clears notes when trainerId changes', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: 'Trainer 1 notes' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: 'Trainer 2 notes' }),
        } as Response)

      const { rerender } = render(<WeeklyNotes trainerId={1} weekStart="2025-01-13" />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Trainer 1 notes')).toBeInTheDocument()
      })

      rerender(<WeeklyNotes trainerId={2} weekStart="2025-01-13" />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Trainer 2 notes')).toBeInTheDocument()
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/weekly-notes?trainerId=2&weekStart=2025-01-13',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  describe('read-only mode (trainer view)', () => {
    it('returns null when readOnly and no notes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '' }),
      } as Response)

      const { container } = render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('returns null when readOnly and only whitespace notes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: '   ' }),
      } as Response)

      const { container } = render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('displays notes text when readOnly and has notes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Important trainer note' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(screen.getByText('Important trainer note')).toBeInTheDocument()
      })
    })

    it('does not show textarea in readOnly mode', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Some note' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(screen.getByText('Some note')).toBeInTheDocument()
      })

      expect(screen.queryByPlaceholderText('Add notes for this week...')).not.toBeInTheDocument()
    })

    it('does not show Save button in readOnly mode', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Some note' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(screen.getByText('Some note')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: 'Save notes' })).not.toBeInTheDocument()
    })

    it('shows Notes title in readOnly mode', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: 'Has notes' }),
      } as Response)

      render(<WeeklyNotes {...defaultProps} readOnly />)

      await waitFor(() => {
        expect(screen.getByText('Notes')).toBeInTheDocument()
      })
    })
  })
})
