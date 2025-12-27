import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PricingTable from '@/components/forms/settings/PricingTable/PricingTable'

describe('PricingTable', () => {
  const mockPricing = [
    { tier: 1, sessions_min: 1, sessions_max: 12, price: 150, mode_1v2_premium: 20 },
    { tier: 1, sessions_min: 13, sessions_max: 20, price: 140, mode_1v2_premium: 20 },
    { tier: 1, sessions_min: 21, sessions_max: null, price: 130, mode_1v2_premium: 20 },
    { tier: 2, sessions_min: 1, sessions_max: 12, price: 165, mode_1v2_premium: 25 },
    { tier: 2, sessions_min: 13, sessions_max: 20, price: 155, mode_1v2_premium: 25 },
    { tier: 2, sessions_min: 21, sessions_max: null, price: 145, mode_1v2_premium: 25 },
    { tier: 3, sessions_min: 1, sessions_max: 12, price: 180, mode_1v2_premium: 30 },
    { tier: 3, sessions_min: 13, sessions_max: 20, price: 170, mode_1v2_premium: 30 },
    { tier: 3, sessions_min: 21, sessions_max: null, price: 160, mode_1v2_premium: 30 },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupMockFetch = () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/pricing')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pricing: mockPricing }),
        } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })
  }

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<PricingTable isOpen={false} onClose={() => {}} />)
      expect(screen.queryByText('Update Pricing')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Update Pricing')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message while fetching pricing', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
      render(<PricingTable isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Loading pricing...')).toBeInTheDocument()
    })
  })

  describe('table content', () => {
    it('renders pricing table with headers', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Tier')).toBeInTheDocument()
        expect(screen.getByText('1-12 classes')).toBeInTheDocument()
        expect(screen.getByText('13-20 classes')).toBeInTheDocument()
        expect(screen.getByText('21+ classes')).toBeInTheDocument()
        expect(screen.getByText('1v2 Premium')).toBeInTheDocument()
      })
    })

    it('renders all tier rows', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Tier 1')).toBeInTheDocument()
        expect(screen.getByText('Tier 2')).toBeInTheDocument()
        expect(screen.getByText('Tier 3')).toBeInTheDocument()
      })
    })

    it('renders pricing values in inputs', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check some pricing values
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
        expect(screen.getByDisplayValue('140')).toBeInTheDocument()
        expect(screen.getByDisplayValue('130')).toBeInTheDocument()
      })
    })
  })

  describe('price editing', () => {
    it('allows editing price values', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      const priceInput = screen.getByDisplayValue('150')
      fireEvent.change(priceInput, { target: { value: '151' } })

      expect(screen.getByDisplayValue('151')).toBeInTheDocument()
    })

    it('enables submit button when changes are made', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      // Initially disabled
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()

      const priceInput = screen.getByDisplayValue('150')
      fireEvent.change(priceInput, { target: { value: '155' } })

      // Now enabled
      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled()
    })

    it('disables submit when a field is empty', async () => {
      setupMockFetch()
      render(<PricingTable isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      const priceInput = screen.getByDisplayValue('150')
      fireEvent.change(priceInput, { target: { value: '' } })

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls API and onSuccess on successful submit', async () => {
      const handleSuccess = vi.fn()
      const handleClose = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/pricing') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ pricing: mockPricing }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/api/pricing') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ pricing: mockPricing }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <PricingTable
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      const priceInput = screen.getByDisplayValue('150')
      fireEvent.change(priceInput, { target: { value: '155' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalled()
        expect(handleClose).toHaveBeenCalled()
      })
    })

    it('calls onError on API failure', async () => {
      const handleError = vi.fn()

      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/pricing') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ pricing: mockPricing }),
          } as Response)
        }
        if (typeof url === 'string' && url.includes('/api/pricing') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Failed to update pricing' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })

      render(
        <PricingTable
          isOpen={true}
          onClose={() => {}}
          onError={handleError}
        />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      const priceInput = screen.getByDisplayValue('150')
      fireEvent.change(priceInput, { target: { value: '151' } })

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled()
      })
    })
  })

  describe('cancel behavior', () => {
    it('closes modal without saving on cancel', async () => {
      const handleClose = vi.fn()
      setupMockFetch()

      render(<PricingTable isOpen={true} onClose={handleClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(handleClose).toHaveBeenCalled()
    })
  })
})
