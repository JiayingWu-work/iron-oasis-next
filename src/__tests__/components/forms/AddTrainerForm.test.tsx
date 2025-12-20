import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddTrainerForm from '@/components/forms/fullpage/AddTrainerForm'

describe('AddTrainerForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial render', () => {
    it('renders form title', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)
      expect(screen.getByText('Add new trainer')).toBeInTheDocument()
    })

    it('renders trainer name input', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)
      expect(
        screen.getByPlaceholderText('e.g. John Smith'),
      ).toBeInTheDocument()
    })

    it('renders email input', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)
      expect(
        screen.getByPlaceholderText('e.g. john@example.com'),
      ).toBeInTheDocument()
    })

    it('renders tier selection dropdown with default Tier 1', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)
      expect(screen.getByText('Tier 1')).toBeInTheDocument()
    })

    it('save button is disabled without name', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)
      expect(
        screen.getByRole('button', { name: 'Save trainer' }),
      ).toBeDisabled()
    })

    it('save button is disabled without email', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      // Fill name but not email
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: 'Alice' },
      })

      expect(
        screen.getByRole('button', { name: 'Save trainer' }),
      ).toBeDisabled()
    })
  })

  describe('name input', () => {
    it('accepts text input', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      const input = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(input, { target: { value: 'Alice Smith' } })

      expect(input).toHaveValue('Alice Smith')
    })

    it('enables submit button with valid name and email', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      expect(
        screen.getByRole('button', { name: 'Save trainer' }),
      ).not.toBeDisabled()
    })
  })

  describe('tier selection', () => {
    it('shows all tier options', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      fireEvent.click(screen.getByText('Tier 1'))

      expect(screen.getByText('Tier 2')).toBeInTheDocument()
      expect(screen.getByText('Tier 3')).toBeInTheDocument()
    })

    it('changes tier selection', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      fireEvent.click(screen.getByText('Tier 1'))
      fireEvent.click(screen.getByText('Tier 2'))

      expect(screen.getByText('Tier 2')).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('disables submit with whitespace-only name', () => {
      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      const input = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(input, { target: { value: '   ' } })

      expect(
        screen.getByRole('button', { name: 'Save trainer' }),
      ).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls API and onCreated on successful submit', async () => {
      const handleCreated = vi.fn()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 123,
            name: 'Alice',
            tier: 2,
            email: 'alice@test.com',
          }),
      } as Response)

      render(<AddTrainerForm onCreated={handleCreated} onCancel={() => {}} />)

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: 'Alice' },
      })
      fireEvent.change(screen.getByPlaceholderText('e.g. john@example.com'), {
        target: { value: 'alice@test.com' },
      })
      fireEvent.click(screen.getByText('Tier 1'))
      fireEvent.click(screen.getByText('Tier 2'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice',
            email: 'alice@test.com',
            tier: 2,
          }),
        })
      })

      await waitFor(() => {
        expect(handleCreated).toHaveBeenCalledWith({
          id: 123,
          name: 'Alice',
          tier: 2,
          email: 'alice@test.com',
        })
      })
    })

    it('shows saving state during submission', async () => {
      let resolvePromise: (value: Response) => void
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          }),
      )

      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      // Fill and submit
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: 'Alice' },
      })
      fireEvent.change(screen.getByPlaceholderText('e.g. john@example.com'), {
        target: { value: 'alice@test.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save trainer' }))

      // Should show saving state
      expect(screen.getByText('Saving…')).toBeInTheDocument()

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      await waitFor(() => {
        expect(screen.queryByText('Saving…')).not.toBeInTheDocument()
      })
    })

    it('shows error on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response)

      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      // Fill and submit
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: 'Alice' },
      })
      fireEvent.change(screen.getByPlaceholderText('e.g. john@example.com'), {
        target: { value: 'alice@test.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save trainer' }))

      await waitFor(() => {
        expect(screen.getByText(/Failed to create trainer/)).toBeInTheDocument()
      })
    })

    it('trims name before submission', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      // Enter name with whitespace
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: '  Alice  ' },
      })
      fireEvent.change(screen.getByPlaceholderText('e.g. john@example.com'), {
        target: { value: 'alice@test.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice', // trimmed
            email: 'alice@test.com',
            tier: 1,
          }),
        })
      })
    })
  })

  describe('close button', () => {
    it('calls onCancel when close button is clicked', () => {
      const handleCancel = vi.fn()
      render(<AddTrainerForm onCreated={() => {}} onCancel={handleCancel} />)

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(handleCancel).toHaveBeenCalled()
    })
  })

  describe('cancel button', () => {
    it('calls onCancel when clicked', () => {
      const handleCancel = vi.fn()
      render(<AddTrainerForm onCreated={() => {}} onCancel={handleCancel} />)

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(handleCancel).toHaveBeenCalled()
    })

    it('is disabled during saving', async () => {
      let resolvePromise: (value: Response) => void
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          }),
      )

      render(<AddTrainerForm onCreated={() => {}} onCancel={() => {}} />)

      // Fill and submit
      fireEvent.change(screen.getByPlaceholderText('e.g. John Smith'), {
        target: { value: 'Alice' },
      })
      fireEvent.change(screen.getByPlaceholderText('e.g. john@example.com'), {
        target: { value: 'alice@test.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save trainer' }))

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Cancel' }),
        ).not.toBeDisabled()
      })
    })
  })
})
