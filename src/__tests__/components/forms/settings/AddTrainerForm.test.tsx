import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddTrainerForm from '@/components/forms/settings/AddTrainerForm/AddTrainerForm'

describe('AddTrainerForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<AddTrainerForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Add New Trainer')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Add New Trainer')).toBeInTheDocument()
    })
  })

  describe('form fields', () => {
    it('renders trainer name input', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByPlaceholderText('e.g. John Smith')).toBeInTheDocument()
    })

    it('renders email input', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByPlaceholderText('e.g. john@example.com')).toBeInTheDocument()
    })

    it('renders tier selection dropdown with default Tier 1', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Tier 1')).toBeInTheDocument()
    })

    it('renders location dropdown with default West', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()
    })
  })

  describe('name input', () => {
    it('accepts text input', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      const input = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(input, { target: { value: 'Alice Smith' } })

      expect(input).toHaveValue('Alice Smith')
    })
  })

  describe('email input', () => {
    it('accepts email input', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      const input = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(input, { target: { value: 'alice@test.com' } })

      expect(input).toHaveValue('alice@test.com')
    })
  })

  describe('tier selection', () => {
    it('shows all tier options', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      fireEvent.click(screen.getByText('Tier 1'))

      expect(screen.getByText('Tier 2')).toBeInTheDocument()
      expect(screen.getByText('Tier 3')).toBeInTheDocument()
    })

    it('changes tier selection', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      fireEvent.click(screen.getByText('Tier 1'))
      fireEvent.click(screen.getByText('Tier 2'))

      expect(screen.getByText('Tier 2')).toBeInTheDocument()
    })
  })

  describe('location selection', () => {
    it('shows all location options', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      fireEvent.click(screen.getByText('West (261 W 35th St)'))

      expect(screen.getByText('East (321 E 22nd St)')).toBeInTheDocument()
    })

    it('changes location selection', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      fireEvent.click(screen.getByText('West (261 W 35th St)'))
      fireEvent.click(screen.getByText('East (321 E 22nd St)'))

      expect(screen.getByText('East (321 E 22nd St)')).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('disables submit without name', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Enter email but not name
      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })

    it('disables submit without email', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Enter name but not email
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })

    it('disables submit with invalid email', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Enter name and invalid email
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })

    it('enables submit with valid name and email', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      expect(screen.getByRole('button', { name: 'Save Trainer' })).not.toBeDisabled()
    })

    it('disables submit with whitespace-only name', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: '   ' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls API and onSuccess on successful submit', async () => {
      const handleSuccess = vi.fn()
      const handleClose = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 123, name: 'Alice', tier: 2, email: 'alice@test.com' }),
      } as Response)

      render(
        <AddTrainerForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      fireEvent.click(screen.getByText('Tier 1'))
      fireEvent.click(screen.getByText('Tier 2'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice',
            email: 'alice@test.com',
            tier: 2,
            location: 'west',
          }),
        })
      })

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Alice')
        expect(handleClose).toHaveBeenCalled()
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

      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fill and submit
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

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

    it('calls onError on API failure', async () => {
      const handleError = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response)

      render(
        <AddTrainerForm
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />
      )

      // Fill and submit
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText(/Failed to create trainer/)).toBeInTheDocument()
      })
    })

    it('trims name and lowercases email before submission', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Enter name with whitespace and email with uppercase
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: '  Alice  ' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'ALICE@TEST.COM' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice', // trimmed
            email: 'alice@test.com', // lowercased
            tier: 1,
            location: 'west',
          }),
        })
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', () => {
      const { rerender } = render(
        <AddTrainerForm isOpen={true} onClose={() => {}} />
      )

      // Fill in some data
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      // Close and reopen
      rerender(<AddTrainerForm isOpen={false} onClose={() => {}} />)
      rerender(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fields should be cleared
      expect(screen.getByPlaceholderText('e.g. John Smith')).toHaveValue('')
      expect(screen.getByPlaceholderText('e.g. john@example.com')).toHaveValue('')
    })
  })
})
