import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UnarchiveTrainerForm from '@/components/forms/settings/UnarchiveTrainerForm/UnarchiveTrainerForm'

describe('UnarchiveTrainerForm', () => {
  const mockTrainers = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: false },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: false },
    { id: 3, name: 'Bob', tier: 1, email: 'bob@test.com', isActive: true },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupMockFetch = () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/trainers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ trainers: mockTrainers }),
        } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
  }

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<UnarchiveTrainerForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Unarchive Trainer')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Unarchive Trainer')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching trainers', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading trainers...')).toBeInTheDocument()
    })

    it('shows trainer dropdown after loading', async () => {
      setupMockFetch()
      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('shows empty message when no archived trainers exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ trainers: [{ id: 1, name: 'Active', tier: 1, isActive: true }] }),
      } as Response)

      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('No archived trainers to restore')).toBeInTheDocument()
      })
    })
  })

  describe('trainer selection', () => {
    it('only shows archived trainers in dropdown', async () => {
      setupMockFetch()
      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
      // Bob is active, should not be in dropdown
      expect(screen.queryByText('Bob (Tier 1)')).not.toBeInTheDocument()
    })

    it('shows info message when trainer is selected', async () => {
      setupMockFetch()
      render(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByText(/will be restored and appear in the trainers list/)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('calls API and onSuccess on successful submit', async () => {
      const handleSuccess = vi.fn()
      const handleClose = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/trainers') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/archive') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, name: 'John', isActive: true }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <UnarchiveTrainerForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('John')
        expect(handleClose).toHaveBeenCalled()
      })
    })

    it('calls onError on API failure', async () => {
      const handleError = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/trainers') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/archive') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Server error' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <UnarchiveTrainerForm
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to unarchive trainer/)).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <UnarchiveTrainerForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      rerender(<UnarchiveTrainerForm isOpen={false} onClose={() => {}} />)
      rerender(<UnarchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })
    })
  })
})
