import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddClientForm from '@/components/forms/fullpage/AddClientForm'
import type { Trainer } from '@/types'

describe('AddClientForm', () => {
  const mockTrainers: Trainer[] = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com' },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com' },
    { id: 3, name: 'Bob', tier: 3, email: 'bob@test.com' },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial render', () => {
    it('renders form title', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      expect(screen.getByText('Add new client')).toBeInTheDocument()
    })

    it('renders client name input', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      expect(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
      ).toBeInTheDocument()
    })

    it('renders trainer selection dropdown', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      expect(screen.getByText('Select trainer...')).toBeInTheDocument()
    })

    it('renders training mode dropdown with default 1v1', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      expect(screen.getByText('1v1 (private)')).toBeInTheDocument()
    })

    it('renders secondary trainer dropdown with None when 2v2 mode is selected', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      // Secondary trainer is hidden by default, switch to 2v2 mode first
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Find by looking at all select triggers and finding the one with None
      const selectTriggers = screen.getAllByRole('button')
      const hasNone = selectTriggers.some((btn) =>
        btn.textContent?.includes('None'),
      )
      expect(hasNone).toBe(true)
    })

    it('save button is disabled without required fields', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )
      expect(screen.getByRole('button', { name: 'Save client' })).toBeDisabled()
    })
  })

  describe('name input', () => {
    it('accepts text input', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      const input = screen.getByPlaceholderText(
        'e.g. Angela Wang or Angela & Tom',
      )
      fireEvent.change(input, { target: { value: 'Alice Smith' } })

      expect(input).toHaveValue('Alice Smith')
    })
  })

  describe('primary trainer selection', () => {
    it('shows trainer options with tier info', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      fireEvent.click(screen.getByText('Select trainer...'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
      expect(screen.getByText('Jane (Tier 2)')).toBeInTheDocument()
      expect(screen.getByText('Bob (Tier 3)')).toBeInTheDocument()
    })

    it('selects a primary trainer', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      expect(screen.getByText('John (Tier 1)')).toBeInTheDocument()
    })
  })

  describe('training mode selection', () => {
    it('shows all training mode options', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      fireEvent.click(screen.getByText('1v1 (private)'))

      expect(screen.getByText('1v2 (semi-private)')).toBeInTheDocument()
      expect(screen.getByText('2v2 (shared package)')).toBeInTheDocument()
    })

    it('changes training mode', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('1v2 (semi-private)'))

      expect(screen.getByText('1v2 (semi-private)')).toBeInTheDocument()
    })
  })

  describe('secondary trainer selection', () => {
    it('excludes primary trainer from secondary options', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Select John as primary
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Switch to 2v2 mode to show secondary trainer dropdown
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Open secondary trainer dropdown (find the one with "None")
      const buttons = screen.getAllByRole('button')
      const noneButton = buttons.find((btn) => btn.textContent === 'None')!
      fireEvent.click(noneButton)

      // John should not be in secondary options
      const options = screen.getAllByRole('button')
      const johnInSecondary = options.filter((btn) =>
        btn.textContent?.includes('John'),
      )
      // Only the display (already selected primary) should show John
      expect(johnInSecondary.length).toBeLessThanOrEqual(1)
    })
  })

  describe('form validation', () => {
    it('enables submit with name and primary trainer', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      const saveButton = screen.getByRole('button', { name: 'Save client' })
      expect(saveButton).toBeDisabled()

      // Enter name
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice' } },
      )

      // Still disabled without trainer
      expect(saveButton).toBeDisabled()

      // Select trainer
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Now enabled
      expect(saveButton).not.toBeDisabled()
    })

    it('requires secondary trainer for 2v2 mode', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Enter name and select primary trainer
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice & Bob' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Should be enabled for 1v1
      const saveButton = screen.getByRole('button', { name: 'Save client' })
      expect(saveButton).not.toBeDisabled()

      // Switch to 2v2
      fireEvent.click(screen.getByText('1v1 (private)'))
      fireEvent.click(screen.getByText('2v2 (shared package)'))

      // Should be disabled without secondary trainer
      expect(saveButton).toBeDisabled()

      // Select secondary trainer
      const buttons = screen.getAllByRole('button')
      const noneButton = buttons.find((btn) => btn.textContent === 'None')!
      fireEvent.click(noneButton)
      fireEvent.click(screen.getByText('Jane (Tier 2)'))

      // Now enabled
      expect(saveButton).not.toBeDisabled()
    })

    it('disables submit with whitespace-only name', () => {
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Enter whitespace name
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: '   ' } },
      )

      // Select trainer
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      expect(screen.getByRole('button', { name: 'Save client' })).toBeDisabled()
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
            trainerId: 1,
            secondaryTrainerId: null,
            mode: '1v1',
          }),
      } as Response)

      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={handleCreated}
          onCancel={() => {}}
        />,
      )

      // Fill form
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Save client' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice',
            trainerId: 1,
            secondaryTrainerId: null,
            mode: '1v1',
          }),
        })
      })

      await waitFor(() => {
        expect(handleCreated).toHaveBeenCalledWith({
          id: 123,
          name: 'Alice',
          trainerId: 1,
          secondaryTrainerId: undefined,
          mode: '1v1',
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

      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Fill and submit
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))
      fireEvent.click(screen.getByRole('button', { name: 'Save client' }))

      // Should show saving state
      expect(screen.getByText('Saving…')).toBeInTheDocument()

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', trainerId: 1 }),
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

      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Fill and submit
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))
      fireEvent.click(screen.getByRole('button', { name: 'Save client' }))

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to create client/),
        ).toBeInTheDocument()
      })
    })

    it('trims name before submission', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ id: 1, name: 'Alice', trainerId: 1 }),
      } as Response)

      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Enter name with whitespace
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: '  Alice  ' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))
      fireEvent.click(screen.getByRole('button', { name: 'Save client' }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice', // trimmed
            trainerId: 1,
            secondaryTrainerId: null,
            mode: '1v1',
          }),
        })
      })
    })
  })

  describe('close button', () => {
    it('calls onCancel when close button is clicked', () => {
      const handleCancel = vi.fn()
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={handleCancel}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(handleCancel).toHaveBeenCalled()
    })
  })

  describe('cancel button', () => {
    it('calls onCancel when clicked', () => {
      const handleCancel = vi.fn()
      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={handleCancel}
        />,
      )

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

      render(
        <AddClientForm
          trainers={mockTrainers}
          onCreated={() => {}}
          onCancel={() => {}}
        />,
      )

      // Fill and submit
      fireEvent.change(
        screen.getByPlaceholderText('e.g. Angela Wang or Angela & Tom'),
        { target: { value: 'Alice' } },
      )
      fireEvent.click(screen.getByText('Select trainer...'))
      fireEvent.click(screen.getByText('John (Tier 1)'))
      fireEvent.click(screen.getByRole('button', { name: 'Save client' }))

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Alice', trainerId: 1 }),
      } as Response)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
      })
    })
  })
})
