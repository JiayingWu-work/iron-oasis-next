import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ArchiveTrainerForm from '@/components/forms/settings/ArchiveTrainerForm/ArchiveTrainerForm'

describe('ArchiveTrainerForm', () => {
  const mockTrainers = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true },
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
      render(<ArchiveTrainerForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Archive Trainer')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Archive Trainer')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching trainers', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading trainers...')).toBeInTheDocument()
    })

    it('shows trainer dropdown after loading', async () => {
      setupMockFetch()
      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('shows empty message when no active trainers exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ trainers: [] }),
      } as Response)

      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('No active trainers to archive')).toBeInTheDocument()
      })
    })
  })

  describe('trainer selection', () => {
    it('shows trainer options with tier in dropdown', async () => {
      setupMockFetch()
      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
    })

    it('shows info message when trainer is selected', async () => {
      setupMockFetch()
      render(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByText(/will be hidden from the trainers list/)).toBeInTheDocument()
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
            json: () => Promise.resolve({ id: 1, name: 'John', isActive: false }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <ArchiveTrainerForm
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

      fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

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
        <ArchiveTrainerForm
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

      fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to archive trainer/)).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <ArchiveTrainerForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      rerender(<ArchiveTrainerForm isOpen={false} onClose={() => {}} />)
      rerender(<ArchiveTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })
    })
  })
})
