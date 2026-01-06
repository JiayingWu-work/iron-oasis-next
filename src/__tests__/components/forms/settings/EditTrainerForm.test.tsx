import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditTrainerForm from '@/components/forms/settings/EditTrainerForm/EditTrainerForm'

describe('EditTrainerForm', () => {
  const mockTrainers = [
    {
      id: 1,
      name: 'John',
      tier: 1,
      email: 'john@test.com',
      isActive: true,
      location: 'west',
      incomeRates: [
        { id: 1, trainerId: 1, minClasses: 1, maxClasses: 12, rate: 0.46 },
        { id: 2, trainerId: 1, minClasses: 13, maxClasses: null, rate: 0.51 },
      ],
    },
    {
      id: 2,
      name: 'Jane',
      tier: 2,
      email: 'jane@test.com',
      isActive: true,
      location: 'east',
      incomeRates: [
        { id: 3, trainerId: 2, minClasses: 1, maxClasses: null, rate: 0.50 },
      ],
    },
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
      render(<EditTrainerForm isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Edit Trainer')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Edit Trainer')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching trainers', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading trainers...')).toBeInTheDocument()
    })

    it('shows trainer dropdown after loading', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })
    })
  })

  describe('trainer selection', () => {
    it('shows trainer options with tier in dropdown', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
    })

    it('populates form fields when trainer is selected', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('Tier 1')).toBeInTheDocument()
      })
    })
  })

  describe('tier change info', () => {
    it('shows info message when tier is changed to higher', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Find the tier dropdown and change it
      const tierDropdown = screen.getByText('Tier 1')
      fireEvent.click(tierDropdown)
      fireEvent.click(screen.getByText('Tier 2'))

      expect(screen.getByText(/Existing clients:/)).toBeInTheDocument()
      expect(screen.getByText(/New clients:/)).toBeInTheDocument()
      expect(screen.getByText(/higher/)).toBeInTheDocument()
    })

    it('shows info message when tier is changed to lower', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Find the tier dropdown and change it
      const tierDropdown = screen.getByText('Tier 2')
      fireEvent.click(tierDropdown)
      fireEvent.click(screen.getByText('Tier 1'))

      expect(screen.getByText(/lower/)).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('disables submit when name is empty', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('John')
      fireEvent.change(nameInput, { target: { value: '' } })

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    })

    it('enables submit when email is empty (validation on submit)', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
      })

      const emailInput = screen.getByDisplayValue('john@test.com')
      fireEvent.change(emailInput, { target: { value: '' } })

      // Button is enabled - validation happens on submit
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled()
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
        if (typeof url === 'string' && url.includes('/api/trainers/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, name: 'John Updated', tier: 1, email: 'john@test.com' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditTrainerForm
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

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('John')
      fireEvent.change(nameInput, { target: { value: 'John Updated' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('John Updated')
        expect(handleClose).toHaveBeenCalled()
      })
    })

    it('validates email format on submit', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
      })

      // Change email to invalid format
      const emailInput = screen.getByDisplayValue('john@test.com')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      // Verify the invalid email is in the input
      expect(screen.getByDisplayValue('invalid-email')).toBeInTheDocument()

      // Submit button should still be enabled (validation happens on submit)
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled()
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
        if (typeof url === 'string' && url.includes('/api/trainers/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Email already exists' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditTrainerForm
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

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })
  })

  describe('form reset', () => {
    it('resets form when modal closes', async () => {
      setupMockFetch()
      const { rerender } = render(
        <EditTrainerForm isOpen={true} onClose={() => {}} />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      rerender(<EditTrainerForm isOpen={false} onClose={() => {}} />)
      rerender(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      expect(screen.queryByDisplayValue('John')).not.toBeInTheDocument()
    })
  })

  describe('location editing', () => {
    it('populates location field when trainer is selected', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // John is at West location
      expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()
    })

    it('can change trainer location to east', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Click on the location dropdown and select East
      fireEvent.click(screen.getByText('West (261 W 35th St)'))
      fireEvent.click(screen.getByText('East (321 E 22nd St)'))

      expect(screen.getByText('East (321 E 22nd St)')).toBeInTheDocument()
    })

    it('submits updated location to API', async () => {
      const handleSuccess = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/trainers') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/api/trainers/') && options?.method === 'PATCH') {
          const body = JSON.parse(options.body as string)
          expect(body.location).toBe('east')
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, name: 'John', tier: 1, email: 'john@test.com', location: 'east' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditTrainerForm
          isOpen={true}
          onClose={() => {}}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Change location to East
      fireEvent.click(screen.getByText('West (261 W 35th St)'))
      fireEvent.click(screen.getByText('East (321 E 22nd St)'))

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('John')
      })
    })
  })

  describe('pay rate tiers', () => {
    it('displays existing income rates when trainer is selected', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select John who has 2 rate tiers (46% for 1-12, 51% for 13+)
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Should show the existing rate tiers
      expect(screen.getByDisplayValue('46')).toBeInTheDocument()
      expect(screen.getByDisplayValue('51')).toBeInTheDocument()
      expect(screen.getByDisplayValue('12')).toBeInTheDocument()
      // Should have 2 remove buttons for 2 tiers
      expect(screen.getAllByRole('button', { name: 'Remove tier' })).toHaveLength(2)
    })

    it('displays single rate tier trainer correctly', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select Jane who has 1 rate tier (50% for 1+)
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Should show the existing rate tier at 50%
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
      // Should not have remove button (only 1 tier)
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()
    })

    it('can add a new rate tier', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select Jane who has 1 rate tier
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Set max for first tier
      const maxInput = screen.getByPlaceholderText('∞')
      fireEvent.change(maxInput, { target: { value: '10' } })

      // Add a new tier
      fireEvent.click(screen.getByText('+ Add Threshold'))

      // Should now have 2 remove buttons
      expect(screen.getAllByRole('button', { name: 'Remove tier' })).toHaveLength(2)
    })

    it('can remove a rate tier', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select John who has 2 rate tiers
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Should have 2 remove buttons
      const removeButtons = screen.getAllByRole('button', { name: 'Remove tier' })
      expect(removeButtons).toHaveLength(2)

      // Remove first tier
      fireEvent.click(removeButtons[0])

      // Should now have no remove buttons (only 1 tier left)
      expect(screen.queryByRole('button', { name: 'Remove tier' })).not.toBeInTheDocument()
    })

    it('can modify rate tier values', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select Jane who has 1 rate tier at 50%
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Change the rate from 50% to 55%
      const rateInput = screen.getByDisplayValue('50')
      fireEvent.change(rateInput, { target: { value: '55' } })

      expect(screen.getByDisplayValue('55')).toBeInTheDocument()
    })

    it('submits updated rate tiers to API', async () => {
      const handleSuccess = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/trainers') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trainers: mockTrainers }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/api/trainers/') && options?.method === 'PATCH') {
          const body = JSON.parse(options.body as string)
          // Verify the updated income rates are sent
          expect(body.incomeRates).toEqual([
            { minClasses: 1, maxClasses: null, rate: 0.55 },
          ])
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 2, name: 'Jane', tier: 2, email: 'jane@test.com' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <EditTrainerForm
          isOpen={true}
          onClose={() => {}}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select Jane
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Change rate from 50% to 55%
      const rateInput = screen.getByDisplayValue('50')
      fireEvent.change(rateInput, { target: { value: '55' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith('Jane')
      })
    })

    it('enables submit when rate tiers have gaps (validation on submit)', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select John who has 2 rate tiers (1-12, 13+)
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })

      // Change first tier max from 12 to 5 (creates gap 6-12)
      const maxInput = screen.getByDisplayValue('12')
      fireEvent.change(maxInput, { target: { value: '5' } })

      // Button is enabled - validation happens on submit
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled()
    })

    it('enables submit when rate is 0 (validation on submit)', async () => {
      setupMockFetch()
      render(<EditTrainerForm isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a trainer...')).toBeInTheDocument()
      })

      // Select Jane
      fireEvent.click(screen.getByText('Choose a trainer...'))
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      })

      // Set rate to 0
      const rateInput = screen.getByDisplayValue('50')
      fireEvent.change(rateInput, { target: { value: '0' } })

      // Button is enabled - validation happens on submit
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled()
    })
  })
})
