import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditClientForm from '@/components/forms/settings/EditClientForm/EditClientForm'

describe('EditClientForm', () => {
  const mockClients = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1' },
    { id: 2, name: 'Bob & Carol', trainerId: 2, secondaryTrainerId: 1, mode: '2v2' },
    { id: 3, name: 'David & Eve', trainerId: 1, mode: '1v2' },
  ]

  const mockTrainers = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com' },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com' },
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
      render(<EditClientForm isOpen={false} onClose={() => {}} />)

      expect(screen.queryByText('Edit Client')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      expect(screen.getByText('Edit Client')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching clients', () => {
      vi.mocked(fetch).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      expect(screen.getByText('Loading clients...')).toBeInTheDocument()
    })

    it('shows client dropdown after loading', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })
    })
  })

  describe('client selection', () => {
    it('shows client options in dropdown', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob & Carol')).toBeInTheDocument()
    })

    it('populates form fields when client is selected', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
        expect(screen.getByText('1v1 (private)')).toBeInTheDocument()
      })
    })
  })

  describe('mode transitions - 1v1 to 1v2', () => {
    it('shows hints when changing from 1v1 to 1v2', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select 1v1 client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Change mode to 1v2
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('1v2 (semi-private)'))

      // Should show hints
      expect(
        screen.getByText(/Update name to include both clients/),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/pricing will be updated to semi-private rates/),
      ).toBeInTheDocument()
    })
  })

  describe('mode transitions - to 2v2', () => {
    it('shows trainer fields when changing to 2v2', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select 1v1 client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Change mode to 2v2
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Should show trainer fields
      expect(
        screen.getByText('Primary trainer (package owner)'),
      ).toBeInTheDocument()
      expect(screen.getByText('Secondary trainer')).toBeInTheDocument()
    })

    it('disables submit until trainers are selected for 2v2', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Change to 2v2
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Submit should be disabled
      expect(
        screen.getByRole('button', { name: 'Save Changes' }),
      ).toBeDisabled()
    })
  })

  describe('mode transitions - from 2v2', () => {
    it('shows primary trainer field when changing from 2v2 to 1v1', async () => {
      setupMockFetch()
      render(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select 2v2 client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Bob & Carol'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Bob & Carol')).toBeInTheDocument()
      })

      // Change mode to 1v1
      fireEvent.click(screen.getByText('2v2 (shared package)'))
      fireEvent.click(screen.getByText('1v1 (private)'))

      // Should show primary trainer field with hint about removing secondary
      expect(screen.getByText('Primary trainer')).toBeInTheDocument()
      expect(
        screen.getByText(/Secondary trainer will be removed/),
      ).toBeInTheDocument()
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
        if (typeof url === 'string' && url.includes('/api/clients/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: 1,
                name: 'Alice Updated',
                trainerId: 1,
                mode: '1v1',
              }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditClientForm
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
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Update name
      const nameInput = screen.getByDisplayValue('Alice')
      fireEvent.change(nameInput, { target: { value: 'Alice Updated' } })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Alice Updated')
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
        if (typeof url === 'string' && url.includes('/api/clients/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Server error' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditClientForm
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
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(
          screen.getByText(/Failed to update client/),
        ).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <EditClientForm isOpen={true} onClose={() => {}} />,
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Select client
      fireEvent.click(screen.getByText('Choose a client...'))
      fireEvent.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })

      // Close modal
      rerender(<EditClientForm isOpen={false} onClose={() => {}} />)

      // Reopen modal
      rerender(<EditClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a client...')).toBeInTheDocument()
      })

      // Should not show the previously selected client's name
      expect(screen.queryByDisplayValue('Alice')).not.toBeInTheDocument()
    })
  })
})
