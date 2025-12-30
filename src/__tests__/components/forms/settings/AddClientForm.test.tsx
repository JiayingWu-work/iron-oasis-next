import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddClientForm from '@/components/forms/settings/AddClientForm/AddClientForm'

describe('AddClientForm', () => {
  const mockTrainers = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true, location: 'west' },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true, location: 'west' },
    { id: 3, name: 'Bob', tier: 3, email: 'bob@test.com', isActive: true, location: 'east' },
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
      render(<AddClientForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Add New Client')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Add New Client')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching trainers', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<AddClientForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading trainers...')).toBeInTheDocument()
    })

    it('shows trainer dropdown after loading', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('form fields', () => {
    it('renders client name input', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie'),
        ).toBeInTheDocument()
      })
    })

    it('renders training mode dropdown with default 1v1', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('1v1 (private)')).toBeInTheDocument()
      })
    })

    it('renders location dropdown with default West', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()
      })
    })
  })

  describe('trainer selection', () => {
    it('shows trainer options with tier in dropdown', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select trainer...'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
      expect(screen.getByText('Bob (Tier 3)')).toBeInTheDocument()
    })

    it('selects a primary trainer', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
    })
  })

  describe('training mode selection', () => {
    it('shows all training mode options', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('1v1 (private)')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('1v1 (private)'))

      expect(screen.getByText('1v2 (semi-private)')).toBeInTheDocument()
      expect(screen.getByText('2v2 (shared package)')).toBeInTheDocument()
    })

    it('shows secondary trainer field when 2v2 mode is selected', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('1v1 (private)')).toBeInTheDocument()
      })

      // Secondary trainer field should not be visible for 1v1
      expect(screen.queryByText('Secondary trainer')).not.toBeInTheDocument()

      // Switch to 2v2 mode
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Now secondary trainer field should be visible
      expect(screen.getByText('Secondary trainer')).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('disables submit without name', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Select trainer but don't enter name
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      expect(screen.getByRole('button', { name: 'Save Client' })).toBeDisabled()
    })

    it('disables submit without trainer', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Enter name but don't select trainer
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      expect(screen.getByRole('button', { name: 'Save Client' })).toBeDisabled()
    })

    it('enables submit with name and trainer', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Enter name
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      // Select trainer
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      expect(screen.getByRole('button', { name: 'Save Client' })).not.toBeDisabled()
    })

    it('requires secondary trainer for 2v2 mode', async () => {
      setupMockFetch()
      render(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Enter name and select primary trainer
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice & Bob' } })

      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Should be enabled for 1v1
      expect(screen.getByRole('button', { name: 'Save Client' })).not.toBeDisabled()

      // Switch to 2v2 mode
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Should be disabled without secondary trainer
      expect(screen.getByRole('button', { name: 'Save Client' })).toBeDisabled()
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
        if (typeof url === 'string' && url.includes('/api/clients') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 123, name: 'Alice', trainerId: 1 }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <AddClientForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save Client' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Alice')
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
        if (typeof url === 'string' && url.includes('/api/clients') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Server error' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <AddClientForm
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save Client' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to create client/)).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <AddClientForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Fill in some data
      const nameInput = screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      // Close and reopen
      rerender(<AddClientForm isOpen={false} onClose={() => {}} />)
      rerender(<AddClientForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Select trainer...')).toBeInTheDocument()
      })

      // Name should be cleared
      expect(screen.getByPlaceholderText('e.g. Alex Smith or Alex & Jamie')).toHaveValue('')
    })
  })
})
