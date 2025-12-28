import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddLateFeeForm from '@/components/forms/entry-bar/AddLateFeeForm'
import type { Client } from '@/types'

describe('AddLateFeeForm', () => {
  const mockClients: Client[] = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1', tierAtSignup: 1, price1_12: 150, price13_20: 140, price21Plus: 130, modePremium: 20, createdAt: '2025-01-01', isActive: true, location: 'west' },
    { id: 2, name: 'Bob', trainerId: 1, mode: '1v1', tierAtSignup: 1, price1_12: 150, price13_20: 140, price21Plus: 130, modePremium: 20, createdAt: '2025-01-01', isActive: true, location: 'west' },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('renders form title with fee amount', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)
      expect(screen.getByText('Add $45 late fee')).toBeInTheDocument()
    })

    it('renders client dropdown with placeholder', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)
      expect(screen.getByText('Select client...')).toBeInTheDocument()
    })

    it('renders date picker with today as default', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
    })

    it('submit button is disabled initially (no client selected)', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)
      expect(screen.getByRole('button', { name: 'Add late fee' })).toBeDisabled()
    })
  })

  describe('client selection', () => {
    it('opens dropdown and shows client options', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)

      fireEvent.click(screen.getByText('Select client...'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('selects a client from dropdown', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)

      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('enables submit button after selecting client', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)

      const submitButton = screen.getByRole('button', { name: 'Add late fee' })
      expect(submitButton).toBeDisabled()

      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('date selection', () => {
    it('allows changing the date', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)

      // Open date picker
      fireEvent.click(screen.getByText('January 15, 2025'))

      // Select a different day
      fireEvent.click(screen.getByRole('button', { name: '10' }))

      expect(screen.getByText('January 10, 2025')).toBeInTheDocument()
    })

    it('can navigate to different month and select', () => {
      render(<AddLateFeeForm clients={mockClients} onAddLateFee={() => {}} lateFeeAmount={45} />)

      // Open date picker
      fireEvent.click(screen.getByText('January 15, 2025'))

      // Navigate to previous month
      const header = document.querySelector('[class*="header"]')!
      const prevButton = header.querySelectorAll('button')[0]
      fireEvent.click(prevButton)

      // Select Dec 20
      fireEvent.click(screen.getByRole('button', { name: '20' }))

      expect(screen.getByText('December 20, 2024')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls onAddLateFee with client ID and date', () => {
      const handleAddLateFee = vi.fn()
      render(
        <AddLateFeeForm clients={mockClients} onAddLateFee={handleAddLateFee} lateFeeAmount={45} />,
      )

      // Select client (Alice, id: 1)
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Alice'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add late fee' }))

      expect(handleAddLateFee).toHaveBeenCalledWith(1, '2025-01-15')
    })

    it('submits with custom date', () => {
      const handleAddLateFee = vi.fn()
      render(
        <AddLateFeeForm clients={mockClients} onAddLateFee={handleAddLateFee} lateFeeAmount={45} />,
      )

      // Select client (Bob, id: 2)
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Bob'))

      // Change date
      fireEvent.click(screen.getByText('January 15, 2025'))
      fireEvent.click(screen.getByRole('button', { name: '5' }))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add late fee' }))

      expect(handleAddLateFee).toHaveBeenCalledWith(2, '2025-01-05')
    })

    it('does not submit without client selected', () => {
      const handleAddLateFee = vi.fn()
      render(
        <AddLateFeeForm clients={mockClients} onAddLateFee={handleAddLateFee} lateFeeAmount={45} />,
      )

      // Try to submit without selecting client
      const form = screen
        .getByRole('button', { name: 'Add late fee' })
        .closest('form')!
      fireEvent.submit(form)

      expect(handleAddLateFee).not.toHaveBeenCalled()
    })
  })

  describe('empty clients list', () => {
    it('shows no options message', () => {
      render(<AddLateFeeForm clients={[]} onAddLateFee={() => {}} lateFeeAmount={45} />)

      fireEvent.click(screen.getByText('Select client...'))

      expect(screen.getByText('No options available')).toBeInTheDocument()
    })

    it('keeps submit disabled with no clients', () => {
      render(<AddLateFeeForm clients={[]} onAddLateFee={() => {}} lateFeeAmount={45} />)

      expect(screen.getByRole('button', { name: 'Add late fee' })).toBeDisabled()
    })
  })

  describe('user workflow', () => {
    it('complete workflow: select client, change date, submit', () => {
      const handleAddLateFee = vi.fn()
      render(
        <AddLateFeeForm clients={mockClients} onAddLateFee={handleAddLateFee} lateFeeAmount={45} />,
      )

      // Step 1: Select client
      fireEvent.click(screen.getByText('Select client...'))
      fireEvent.click(screen.getByText('Bob'))

      // Step 2: Change date
      fireEvent.click(screen.getByText('January 15, 2025'))
      fireEvent.click(screen.getByRole('button', { name: '22' }))

      // Step 3: Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add late fee' }))

      expect(handleAddLateFee).toHaveBeenCalledWith(2, '2025-01-22')
    })
  })
})
