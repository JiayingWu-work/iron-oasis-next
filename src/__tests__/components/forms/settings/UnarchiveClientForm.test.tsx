import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UnarchiveClientForm from '@/components/forms/settings/UnarchiveClientForm/UnarchiveClientForm'

describe('UnarchiveClientForm', () => {
  const mockClients = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1', isActive: false },
    { id: 2, name: 'Bob', trainerId: 2, mode: '1v1', isActive: false },
    { id: 3, name: 'Carol', trainerId: 1, mode: '1v1', isActive: true },
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
      render(<UnarchiveClientForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Unarchive Client')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Unarchive Client')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching clients', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading clients...')).toBeInTheDocument()
    })

    it('shows client dropdown after loading', async () => {
      setupMockFetch()
      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('shows empty message when no archived clients exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Active', isActive: true }]),
      } as Response)

      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('No archived clients to restore')).toBeInTheDocument()
      })
    })
  })

  describe('client selection', () => {
    it('only shows archived clients in dropdown', async () => {
      setupMockFetch()
      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      // Carol is active, should not be in dropdown
      expect(screen.queryByText('Carol')).not.toBeInTheDocument()
    })

    it('shows info message when client is selected', async () => {
      setupMockFetch()
      render(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText(/will be restored and appear in the Add Classes dropdown/)).toBeInTheDocument()
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
            json: () => Promise.resolve({ id: 1, name: 'Alice', isActive: true }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <UnarchiveClientForm
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

      fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))

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
        <UnarchiveClientForm
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

      fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to unarchive client/)).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <UnarchiveClientForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      rerender(<UnarchiveClientForm isOpen={false} onClose={() => {}} />)
      rerender(<UnarchiveClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })
})
