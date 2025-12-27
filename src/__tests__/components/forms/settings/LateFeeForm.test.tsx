import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LateFeeForm from '@/components/forms/settings/LateFeeForm/LateFeeForm'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LateFeeForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial render', () => {
    it('renders the modal title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      expect(screen.getByText('Update Late Fee')).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<LateFeeForm {...defaultProps} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('loads and displays current late fee amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })
    })

    it('displays the dollar sign', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('$')).toBeInTheDocument()
      })
    })

    it('displays the info text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/This fee is charged when clients cancel/)).toBeInTheDocument()
      })
    })
  })

  describe('form interaction', () => {
    it('allows changing the late fee amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    it('disables save button when no changes made', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      expect(saveButton).toBeDisabled()
    })

    it('enables save button when value changes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      expect(saveButton).not.toBeDisabled()
    })

    it('disables save button when input is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      expect(saveButton).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls PATCH endpoint with new amount on submit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 45 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 50 }),
        })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/late-fees/amount', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 50 }),
        })
      })
    })

    it('calls onSuccess callback after successful save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 45 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 50 }),
        })

      const onSuccess = vi.fn()
      render(<LateFeeForm {...defaultProps} onSuccess={onSuccess} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('calls onClose after successful save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 45 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 50 }),
        })

      const onClose = vi.fn()
      render(<LateFeeForm {...defaultProps} onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to load' }),
      })

      render(<LateFeeForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load settings')).toBeInTheDocument()
      })
    })

    it('shows error when save fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ amount: 45 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to update' }),
        })

      const onError = vi.fn()
      render(<LateFeeForm {...defaultProps} onError={onError} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const input = screen.getByDisplayValue('45')
      fireEvent.change(input, { target: { value: '50' } })

      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('modal closed state', () => {
    it('does not fetch when modal is closed', () => {
      render(<LateFeeForm {...defaultProps} isOpen={false} />)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('cancel button', () => {
    it('calls onClose when cancel button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 45 }),
      })

      const onClose = vi.fn()
      render(<LateFeeForm {...defaultProps} onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('45')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })
  })
})
