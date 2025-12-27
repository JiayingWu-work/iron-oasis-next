import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ArchiveClientForm from '@/components/forms/settings/ArchiveClientForm/ArchiveClientForm'

describe('ArchiveClientForm', () => {
  const mockClients = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1', isActive: true },
    { id: 2, name: 'Bob', trainerId: 2, mode: '1v1', isActive: true },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupMockFetch = () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockClients),
        } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
  }

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<ArchiveClientForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Archive Client')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Archive Client')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching clients', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading clients...')).toBeInTheDocument()
    })

    it('shows client dropdown after loading', async () => {
      setupMockFetch()
      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('shows empty message when no active clients exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)

      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('No active clients to archive')).toBeInTheDocument()
      })
    })
  })

  describe('client selection', () => {
    it('shows client options in dropdown', async () => {
      setupMockFetch()
      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('shows info message when client is selected', async () => {
      setupMockFetch()
      render(<ArchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText(/will be hidden from the Add Classes dropdown/)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('calls API and onSuccess on successful submit', async () => {
      const handleSuccess = vi.fn()
      const handleClose = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/clients') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClients),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/archive') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, name: 'Alice', isActive: false }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <ArchiveClientForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Alice')
        expect(handleClose).toHaveBeenCalled()
      })
    })

    it('calls onError on API failure', async () => {
      const handleError = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/clients') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClients),
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
        <ArchiveClientForm
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to archive client/)).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <ArchiveClientForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      rerender(<ArchiveClientForm isOpen={false} onClose={() => {}} />)
      rerender(<ArchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })
})
