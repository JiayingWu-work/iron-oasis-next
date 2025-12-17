import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddPackageForm from '@/components/forms/entry-bar/AddPackageForm'
import type { Client } from '@/types'

describe('AddPackageForm', () => {
  const mockClients: Client[] = [
    { id: 1, name: 'Alice', trainerId: 1 },
    { id: 2, name: 'Bob', trainerId: 1 },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('renders form title', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)
      expect(screen.getByRole('heading', { name: 'Add package' })).toBeInTheDocument()
    })

    it('renders client dropdown with placeholder', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)
      expect(screen.getByText('Select client...')).toBeInTheDocument()
    })

    it('renders sessions input with placeholder', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)
      expect(
        screen.getByPlaceholderText('Number of sessions (e.g. 14)'),
      ).toBeInTheDocument()
    })

    it('renders date picker with today as default', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
    })

    it('submit button is disabled initially', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)
      expect(screen.getByRole('button', { name: 'Add package' })).toBeDisabled()
    })
  })

  describe('client selection', () => {
    it('opens dropdown and shows client options', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      fireEvent.click(screen.getByText('Select client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('selects a client from dropdown', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      // Open and select
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Alice should now be displayed as selected
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByText('Select client...')).not.toBeInTheDocument()
    })
  })

  describe('sessions input', () => {
    it('accepts numeric input', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '10' } })

      expect(input).toHaveValue(10)
    })

    it('handles empty input', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '10' } })
      fireEvent.change(input, { target: { value: '' } })

      expect(input).toHaveValue(null)
    })

    it('handles invalid input gracefully', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: 'abc' } })

      // Should reset to empty (0 displays as empty)
      expect(input).toHaveValue(null)
    })
  })

  describe('date selection', () => {
    it('opens date picker and allows date selection', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      // Open date picker
      fireEvent.click(screen.getByText('January 15, 2025'))

      // Select a different day
      fireEvent.click(screen.getByRole('button', { name: '20' }))

      // New date should be displayed
      expect(screen.getByText('January 20, 2025')).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('enables submit when client and sessions are valid', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      const submitButton = screen.getByRole('button', { name: 'Add package' })
      expect(submitButton).toBeDisabled()

      // Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Still disabled without sessions
      expect(submitButton).toBeDisabled()

      // Enter sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '10' } })

      // Now enabled
      expect(submitButton).not.toBeDisabled()
    })

    it('remains disabled with zero sessions', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      // Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Enter 0 sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '0' } })

      expect(screen.getByRole('button', { name: 'Add package' })).toBeDisabled()
    })

    it('remains disabled with negative sessions', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      // Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Enter negative sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '-5' } })

      expect(screen.getByRole('button', { name: 'Add package' })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls onAddPackage with correct values', () => {
      const handleAddPackage = vi.fn()
      render(
        <AddPackageForm clients={mockClients} onAddPackage={handleAddPackage} />,
      )

      // Select client (Alice, id: 1)
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Enter sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '14' } })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add package' }))

      expect(handleAddPackage).toHaveBeenCalledWith(1, 14, '2025-01-15')
    })

    it('resets sessions count after submission', () => {
      render(<AddPackageForm clients={mockClients} onAddPackage={() => {}} />)

      // Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Enter sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '14' } })
      expect(input).toHaveValue(14)

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add package' }))

      // Sessions should reset to empty
      expect(input).toHaveValue(null)
    })

    it('does not submit if validation fails', () => {
      const handleAddPackage = vi.fn()
      render(
        <AddPackageForm clients={mockClients} onAddPackage={handleAddPackage} />,
      )

      // Only select client, no sessions
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Try to submit (button should be disabled, but let's test the handler)
      const form = screen
        .getByRole('button', { name: 'Add package' })
        .closest('form')!
      fireEvent.submit(form)

      expect(handleAddPackage).not.toHaveBeenCalled()
    })

    it('submits with custom date', () => {
      const handleAddPackage = vi.fn()
      render(
        <AddPackageForm clients={mockClients} onAddPackage={handleAddPackage} />,
      )

      // Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Bob'))

      // Enter sessions
      const input = screen.getByPlaceholderText('Number of sessions (e.g. 14)')
      fireEvent.change(input, { target: { value: '20' } })

      // Change date
      fireEvent.click(screen.getByText('January 15, 2025'))
      fireEvent.click(screen.getByRole('button', { name: '25' }))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add package' }))

      expect(handleAddPackage).toHaveBeenCalledWith(2, 20, '2025-01-25')
    })
  })

  describe('empty clients list', () => {
    it('renders dropdown with no options', () => {
      render(<AddPackageForm clients={[]} onAddPackage={() => {}} />)

      fireEvent.click(screen.getByText('Select client...'))

      expect(screen.getByText('No options available')).toBeInTheDocument()
    })
  })
})
