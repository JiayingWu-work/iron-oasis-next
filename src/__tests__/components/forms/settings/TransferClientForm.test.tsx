import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TransferClientForm from '@/components/forms/settings/TransferClientForm/TransferClientForm'

describe('TransferClientForm', () => {
  const mockClients = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1' },
    { id: 2, name: 'Bob', trainerId: 2, mode: '1v1' },
    { id: 3, name: 'Carol', trainerId: 1, mode: '1v2' },
  ]

  const mockTrainers = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com' },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com' },
    { id: 3, name: 'Mike', tier: 3, email: 'mike@test.com' },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupMockFetch = () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (url === '/api/clients') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockClients),
        } as Response)
      }
      if (url === '/api/trainers') {
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
      render(<TransferClientForm isOpen={false} onClose={() => {}} />)

      expect(screen.queryByText('Transfer Client')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      expect(screen.getByText('Transfer Client')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching clients', () => {
      vi.mocked(fetch).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      expect(screen.getByText('Loading clients...')).toBeInTheDocument()
    })

    it('shows client dropdown after loading', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })

  describe('client selection', () => {
    it('shows client options in dropdown', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })

    it('shows current trainer when client is selected', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Current trainer')).toBeInTheDocument()
        expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      })
    })

    it('shows new trainer dropdown when client is selected', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('New trainer')).toBeInTheDocument()
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('trainer filtering', () => {
    it('excludes current trainer from new trainer options', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select Alice who has trainer John (id: 1)
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      // Open new trainer dropdown
      fireEvent.click(screen.getByText('Select new trainer...'))

      // John should appear once (in the current trainer display), not in dropdown options
      const johnElements = screen.getAllByText('John (Tier 1)')
      expect(johnElements).toHaveLength(1) // Only in current trainer display

      // Other trainers should be available in dropdown
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
      expect(screen.getByText('Mike (Tier 3)')).toBeInTheDocument()
    })

    it('resets new trainer when switching clients', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select Alice
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      // Select a new trainer
      fireEvent.click(screen.getByText('Select new trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      // Switch to Bob
      fireEvent.click(screen.getByText('Alice'))
      fireEvent.click(screen.getByText('Bob'))

      // New trainer should be reset
      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('form validation', () => {
    it('disables submit when no client is selected', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Transfer' })).toBeDisabled()
    })

    it('disables submit when no new trainer is selected', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Transfer' })).toBeDisabled()
    })

    it('enables submit when client and new trainer are selected', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      // Select new trainer
      fireEvent.click(screen.getByText('Select new trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      expect(
        screen.getByRole('button', { name: 'Transfer' }),
      ).not.toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls API and onSuccess on successful submit', async () => {
      setupMockFetch()
      const handleSuccess = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (url === '/api/clients') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClients),
          } as Response)
        }
        if (url === '/api/trainers') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/clients/') &&
          options?.method === 'PATCH'
        ) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: 1,
                name: 'Alice',
                trainerId: 2,
                mode: '1v1',
              }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <TransferClientForm
          isOpen={true}
          onClose={() => {}}
          onSuccess={handleSuccess}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      // Select new trainer
      fireEvent.click(screen.getByText('Select new trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Alice', 'Jane')
      })
    })

    it('calls onError on API failure', async () => {
      setupMockFetch()
      const handleError = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (url === '/api/clients') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClients),
          } as Response)
        }
        if (url === '/api/trainers') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/clients/') &&
          options?.method === 'PATCH'
        ) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Server error' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <TransferClientForm
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Select new trainer...')).toBeInTheDocument()
      })

      // Select new trainer
      fireEvent.click(screen.getByText('Select new trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(
          screen.getByText(/Failed to transfer client/),
        ).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <TransferClientForm isOpen={true} onClose={() => {}} />,
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      })

      // Close modal
      rerender(<TransferClientForm isOpen={false} onClose={() => {}} />)

      // Reopen modal
      rerender(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Should not show current trainer info
      expect(screen.queryByText('Current trainer')).not.toBeInTheDocument()
    })
  })

  describe('hints', () => {
    it('shows pricing hint when transferring to trainer with different tier', async () => {
      setupMockFetch()
      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client (Alice has trainer John who is Tier 1)
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('New trainer')).toBeInTheDocument()
      })

      // Select a new trainer with a different tier (Jane is Tier 2)
      fireEvent.click(screen.getByText('Select new trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(
          screen.getByText(/packages and existing sessions will remain unchanged/),
        ).toBeInTheDocument()
        expect(
          screen.getByText(/Pricing change/),
        ).toBeInTheDocument()
      })
    })
  })

  describe('2v2 clients', () => {
    it('shows warning and disables submit for 2v2 clients', async () => {
      const mockClientsWithMode = [
        { id: 1, name: 'Alice', trainerId: 1, mode: '1v1' },
        { id: 2, name: 'Bob & Carol', trainerId: 2, secondaryTrainerId: 1, mode: '2v2' },
      ]

      vi.mocked(fetch).mockImplementation((url) => {
        if (url === '/api/clients') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClientsWithMode),
          } as Response)
        }
        if (url === '/api/trainers') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(<TransferClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select 2v2 client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Bob & Carol'))

      await waitFor(() => {
        expect(
          screen.getByText(/shared package \(2v2\)/),
        ).toBeInTheDocument()
        expect(
          screen.getByText(/Use Edit Client/),
        ).toBeInTheDocument()
      })

      // Submit should be disabled
      expect(screen.getByRole('button', { name: 'Transfer' })).toBeDisabled()
    })
  })
})
