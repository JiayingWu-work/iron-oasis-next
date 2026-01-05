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
            incomeRates: [
              { minClasses: 1, maxClasses: null, rate: 0.50 },
            ],
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
            incomeRates: [
              { minClasses: 1, maxClasses: null, rate: 0.50 },
            ],
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

  describe('pay rate tiers', () => {
    it('renders pay rate tiers section with default tier', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      expect(screen.getByText('Pay Rate Tiers')).toBeInTheDocument()
      expect(screen.getByText('+ Add Threshold')).toBeInTheDocument()
      // Default is 1 tier at 50%
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    it('can add a new rate tier', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Initially should not have remove buttons (1 tier)
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()

      // Set max for first tier before adding
      const maxInputs = screen.getAllByPlaceholderText('∞')
      fireEvent.change(maxInputs[0], { target: { value: '12' } })

      // Click add threshold
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Now should have 2 remove buttons (one for each tier)
      expect(screen.getAllByRole('button', { name: 'Remove tier' })).toHaveLength(2)
    })

    it('can remove a rate tier', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Set max for first tier and add a second tier
      const maxInputs = screen.getAllByPlaceholderText('∞')
      fireEvent.change(maxInputs[0], { target: { value: '12' } })
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Should have 2 tiers now
      const removeButtons = screen.getAllByRole('button', { name: 'Remove tier' })
      expect(removeButtons).toHaveLength(2)

      // Remove one tier
      fireEvent.click(removeButtons[0])

      // Should have 1 tier now (no remove buttons)
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()
    })

    it('cannot remove the last rate tier', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // With only 1 tier, there should be no remove button
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()
    })

    it('submits with custom rate', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fill basic fields
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      // Modify the default rate to 45%
      const rateInput = screen.getByDisplayValue('50')
      fireEvent.change(rateInput, { target: { value: '45' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice',
            email: 'alice@test.com',
            tier: 1,
            location: 'west',
            incomeRates: [
              { minClasses: 1, maxClasses: null, rate: 0.45 },
            ],
          }),
        })
      })
    })

    it('submits with multiple rate tiers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', tier: 1, email: 'alice@test.com' }),
      } as Response)

      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fill basic fields
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      // Set first tier: 1-12 at 46%
      const maxInput1 = screen.getByPlaceholderText('∞')
      fireEvent.change(maxInput1, { target: { value: '12' } })

      const rateInput1 = screen.getByDisplayValue('50')
      fireEvent.change(rateInput1, { target: { value: '46' } })

      // Add second tier (starts at 13 automatically)
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Set second tier rate to 51%
      const rateInputs = screen.getAllByDisplayValue('50')
      fireEvent.change(rateInputs[0], { target: { value: '51' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Trainer' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/trainers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice',
            email: 'alice@test.com',
            tier: 1,
            location: 'west',
            incomeRates: [
              { minClasses: 1, maxClasses: 12, rate: 0.46 },
              { minClasses: 13, maxClasses: null, rate: 0.51 },
            ],
          }),
        })
      })
    })

    it('disables submit when rate tiers have gaps', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fill basic fields
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      // Set first tier to end at 10
      const maxInput1 = screen.getByPlaceholderText('∞')
      fireEvent.change(maxInput1, { target: { value: '10' } })

      // Add second tier - it starts at 11 by default
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Now change first tier max to 5 (creates gap 6-10)
      const maxInputs = screen.getAllByPlaceholderText('∞')
      const firstMaxInput = maxInputs.find((input) => (input as HTMLInputElement).value === '10')
      fireEvent.change(firstMaxInput!, { target: { value: '5' } })

      // Submit should be disabled due to gap
      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })

    it('disables submit when rate is 0', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Fill basic fields
      const nameInput = screen.getByPlaceholderText('e.g. John Smith')
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      const emailInput = screen.getByPlaceholderText('e.g. john@example.com')
      fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })

      // Set rate to 0
      const rateInput = screen.getByDisplayValue('50')
      fireEvent.change(rateInput, { target: { value: '0' } })

      // Submit should be disabled
      expect(screen.getByRole('button', { name: 'Save Trainer' })).toBeDisabled()
    })

    it('limits maximum of 6 rate tiers', () => {
      render(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Add 5 more tiers (total 6)
      for (let i = 0; i < 5; i++) {
        // Need to set maxClasses for the last tier before adding next
        const maxInputs = screen.getAllByPlaceholderText('∞')
        const lastMaxInput = maxInputs[maxInputs.length - 1]
        fireEvent.change(lastMaxInput, { target: { value: String((i + 1) * 5) } })
        fireEvent.click(screen.getByText('+ Add Threshold'))
      }

      // Add threshold button should be hidden at 6 tiers
      expect(screen.queryByText('+ Add Threshold')).not.toBeInTheDocument()
    })

    it('resets pay rate tiers when modal closes and reopens', () => {
      const { rerender } = render(
        <AddTrainerForm isOpen={true} onClose={() => {}} />
      )

      // Set max and add a tier
      const maxInput = screen.getByPlaceholderText('∞')
      fireEvent.change(maxInput, { target: { value: '12' } })
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Should have 2 tiers (2 remove buttons)
      expect(screen.getAllByRole('button', { name: 'Remove tier' })).toHaveLength(2)

      // Close and reopen
      rerender(<AddTrainerForm isOpen={false} onClose={() => {}} />)
      rerender(<AddTrainerForm isOpen={true} onClose={() => {}} />)

      // Should be back to 1 tier (no remove buttons)
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()
    })
  })
})
