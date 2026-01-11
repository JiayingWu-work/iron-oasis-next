import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddClassesForm from '@/components/forms/entry-bar/AddClassesForm'
import type { Client } from '@/types'

describe('AddClassesForm', () => {
  const mockClients: Client[] = [
    { id: 1, name: 'Alice', trainerId: 1, mode: '1v1', tierAtSignup: 1, price1_12: 150, price13_20: 140, price21Plus: 130, modePremium: 20, createdAt: '2025-01-01', isActive: true, location: 'west', isPersonalClient: false },
    { id: 2, name: 'Bob', trainerId: 1, mode: '1v1', tierAtSignup: 1, price1_12: 150, price13_20: 140, price21Plus: 130, modePremium: 20, createdAt: '2025-01-01', isActive: true, location: 'west', isPersonalClient: false },
    { id: 3, name: 'Charlie', trainerId: 1, mode: '1v1', tierAtSignup: 1, price1_12: 150, price13_20: 140, price21Plus: 130, modePremium: 20, createdAt: '2025-01-01', isActive: true, location: 'west', isPersonalClient: false },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('renders the form title', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )
      expect(screen.getByText('Add classes')).toBeInTheDocument()
    })

    it('renders date picker with provided date', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
    })

    it('renders all clients as checkboxes', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
    })

    it('shows hint when no clients exist', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={[]}
          onAddSessions={() => {}}
        />,
      )
      expect(
        screen.getByText('No clients for this trainer yet.'),
      ).toBeInTheDocument()
    })

    it('save button is disabled initially', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )
      expect(screen.getByRole('button', { name: 'Save classes' })).toBeDisabled()
    })
  })

  describe('client selection', () => {
    it('selects a client when checkbox is clicked', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const aliceCheckbox = screen.getByRole('checkbox', { name: /alice/i })
      expect(aliceCheckbox).not.toBeChecked()

      fireEvent.click(aliceCheckbox)
      expect(aliceCheckbox).toBeChecked()
    })

    it('deselects a client when checkbox is clicked again', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const aliceCheckbox = screen.getByRole('checkbox', { name: /alice/i })

      // Select
      fireEvent.click(aliceCheckbox)
      expect(aliceCheckbox).toBeChecked()

      // Deselect
      fireEvent.click(aliceCheckbox)
      expect(aliceCheckbox).not.toBeChecked()
    })

    it('can select multiple clients', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const aliceCheckbox = screen.getByRole('checkbox', { name: /alice/i })
      const bobCheckbox = screen.getByRole('checkbox', { name: /bob/i })
      const charlieCheckbox = screen.getByRole('checkbox', { name: /charlie/i })

      fireEvent.click(aliceCheckbox)
      fireEvent.click(bobCheckbox)
      fireEvent.click(charlieCheckbox)

      expect(aliceCheckbox).toBeChecked()
      expect(bobCheckbox).toBeChecked()
      expect(charlieCheckbox).toBeChecked()
    })

    it('enables save button when at least one client is selected', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const saveButton = screen.getByRole('button', { name: 'Save classes' })
      expect(saveButton).toBeDisabled()

      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))
      expect(saveButton).not.toBeDisabled()
    })

    it('disables save button when all clients are deselected', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const aliceCheckbox = screen.getByRole('checkbox', { name: /alice/i })
      const saveButton = screen.getByRole('button', { name: 'Save classes' })

      // Select then deselect
      fireEvent.click(aliceCheckbox)
      expect(saveButton).not.toBeDisabled()

      fireEvent.click(aliceCheckbox)
      expect(saveButton).toBeDisabled()
    })
  })

  describe('date picker interaction', () => {
    it('calls onDateChange when date is changed', () => {
      const handleDateChange = vi.fn()
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={handleDateChange}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      // Open date picker
      fireEvent.click(screen.getByText('January 15, 2025'))

      // Select day 20
      fireEvent.click(screen.getByRole('button', { name: '20' }))

      expect(handleDateChange).toHaveBeenCalledWith('2025-01-20')
    })
  })

  describe('disabled state', () => {
    it('disables all checkboxes when disabled prop is true', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
          disabled
        />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled()
      })
    })

    it('disables save button when disabled prop is true', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
          disabled
        />,
      )

      expect(screen.getByRole('button', { name: 'Save classes' })).toBeDisabled()
    })

    it('disables date picker when disabled prop is true', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
          disabled
        />,
      )

      // The date picker trigger button should be disabled
      const dateButton = screen.getByText('January 15, 2025').closest('button')
      expect(dateButton).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls onAddSessions with date and selected client IDs', () => {
      const handleAddSessions = vi.fn()
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={handleAddSessions}
        />,
      )

      // Select Alice (id: 1) and Charlie (id: 3)
      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))
      fireEvent.click(screen.getByRole('checkbox', { name: /charlie/i }))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      expect(handleAddSessions).toHaveBeenCalledWith('2025-01-15', [1, 3], undefined)
    })

    it('clears selection after submission', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const aliceCheckbox = screen.getByRole('checkbox', { name: /alice/i })
      const bobCheckbox = screen.getByRole('checkbox', { name: /bob/i })

      // Select
      fireEvent.click(aliceCheckbox)
      fireEvent.click(bobCheckbox)
      expect(aliceCheckbox).toBeChecked()
      expect(bobCheckbox).toBeChecked()

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      // Should be cleared
      expect(aliceCheckbox).not.toBeChecked()
      expect(bobCheckbox).not.toBeChecked()
    })

    it('does not call onAddSessions if no clients selected', () => {
      const handleAddSessions = vi.fn()
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={handleAddSessions}
        />,
      )

      // Try to submit without selecting
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      expect(handleAddSessions).not.toHaveBeenCalled()
    })

    it('save button becomes disabled after submission', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      const saveButton = screen.getByRole('button', { name: 'Save classes' })

      // Select and submit
      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))
      expect(saveButton).not.toBeDisabled()

      fireEvent.click(saveButton)

      // Should be disabled again after clearing
      expect(saveButton).toBeDisabled()
    })
  })

  describe('location override', () => {
    it('renders location override toggle button', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      expect(
        screen.getByRole('button', { name: 'Different location?' }),
      ).toBeInTheDocument()
    })

    it('shows location dropdown when override is enabled', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      // Click the override toggle
      fireEvent.click(
        screen.getByRole('button', { name: 'Different location?' }),
      )

      // Location dropdown should appear
      expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()
    })

    it('hides location dropdown when override is disabled', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      // Location dropdown should not be visible initially
      expect(
        screen.queryByText('West (261 W 35th St)'),
      ).not.toBeInTheDocument()

      // Enable override
      fireEvent.click(
        screen.getByRole('button', { name: 'Different location?' }),
      )
      expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()

      // Disable override
      fireEvent.click(
        screen.getByRole('button', { name: 'Different location?' }),
      )
      expect(
        screen.queryByText('West (261 W 35th St)'),
      ).not.toBeInTheDocument()
    })

    it('calls onAddSessions with locationOverride when enabled', () => {
      const handleAddSessions = vi.fn()
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={handleAddSessions}
        />,
      )

      // Select a client
      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))

      // Enable override and select East
      fireEvent.click(
        screen.getByRole('button', { name: 'Different location?' }),
      )
      fireEvent.click(screen.getByText('West (261 W 35th St)'))
      fireEvent.click(screen.getByText('East (321 E 22nd St)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      expect(handleAddSessions).toHaveBeenCalledWith('2025-01-15', [1], 'east')
    })

    it('calls onAddSessions without locationOverride when disabled', () => {
      const handleAddSessions = vi.fn()
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={handleAddSessions}
        />,
      )

      // Select a client
      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))

      // Submit without enabling location override
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      expect(handleAddSessions).toHaveBeenCalledWith(
        '2025-01-15',
        [1],
        undefined,
      )
    })

    it('resets location override after submission', () => {
      render(
        <AddClassesForm
          date="2025-01-15"
          onDateChange={() => {}}
          clients={mockClients}
          onAddSessions={() => {}}
        />,
      )

      // Select a client
      fireEvent.click(screen.getByRole('checkbox', { name: /alice/i }))

      // Enable override
      fireEvent.click(
        screen.getByRole('button', { name: 'Different location?' }),
      )
      expect(screen.getByText('West (261 W 35th St)')).toBeInTheDocument()

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save classes' }))

      // Location dropdown should be hidden after reset
      expect(
        screen.queryByText('West (261 W 35th St)'),
      ).not.toBeInTheDocument()
    })
  })
})
