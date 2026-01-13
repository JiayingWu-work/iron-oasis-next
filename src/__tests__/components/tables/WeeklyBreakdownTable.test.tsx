import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WeeklyBreakdownTable from '@/components/tables/WeeklyBreakdownTable'
import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'

describe('WeeklyBreakdownTable', () => {
  const createRow = (
    id: number | string,
    type: 'session' | 'package' | 'bonus' | 'lateFee',
    date: string,
    clientName: string,
    amount: number,
  ): WeeklyBreakdownRow => ({
    id,
    type,
    date,
    clientName,
    amount,
  })

  const mockRows: WeeklyBreakdownRow[] = [
    createRow(1, 'session', '2025-01-06', 'Alice', 69),
    createRow(2, 'package', '2025-01-07', 'Bob', 1500),
    createRow('2-bonus', 'bonus', '2025-01-07', 'Bob', 50),
    createRow(3, 'lateFee', '2025-01-08', 'Charlie', 45),
  ]

  describe('empty state', () => {
    it('shows no records message when rows is empty', () => {
      render(
        <WeeklyBreakdownTable
          rows={[]}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('No records this week.')).toBeInTheDocument()
    })
  })

  describe('table rendering', () => {
    it('renders table with headers', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Client')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
    })

    it('renders all rows', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('Alice')).toBeInTheDocument()
      // Bob appears twice (package and bonus)
      expect(screen.getAllByText('Bob')).toHaveLength(2)
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('displays correct type labels', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('Class')).toBeInTheDocument()
      expect(screen.getByText('Package purchase')).toBeInTheDocument()
      expect(screen.getByText('Sales bonus')).toBeInTheDocument()
      expect(screen.getByText('Late fee')).toBeInTheDocument()
    })

    it('formats amounts with dollar sign, no trailing zeros', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('$69')).toBeInTheDocument()
      expect(screen.getByText('$1500')).toBeInTheDocument()
      expect(screen.getByText('$50')).toBeInTheDocument()
      expect(screen.getByText('$45')).toBeInTheDocument()
    })

    it('displays dates', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByText('2025-01-06')).toBeInTheDocument()
      expect(screen.getAllByText('2025-01-07')).toHaveLength(2)
      expect(screen.getByText('2025-01-08')).toBeInTheDocument()
    })
  })

  describe('delete buttons', () => {
    it('shows delete button for session rows', () => {
      const rows = [createRow(1, 'session', '2025-01-06', 'Alice', 69)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('shows delete button for package rows', () => {
      const rows = [createRow(1, 'package', '2025-01-06', 'Alice', 1500)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('shows delete button for lateFee rows', () => {
      const rows = [createRow(1, 'lateFee', '2025-01-06', 'Alice', 45)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('does NOT show delete button for bonus rows', () => {
      const rows = [createRow('1-bonus', 'bonus', '2025-01-06', 'Alice', 50)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      expect(
        screen.queryByRole('button', { name: 'Delete' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('delete session', () => {
    it('calls onDeleteSession when session delete is clicked', async () => {
      const handleDeleteSession = vi.fn().mockResolvedValue(undefined)
      const rows = [createRow(1, 'session', '2025-01-06', 'Alice', 69)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={handleDeleteSession}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(handleDeleteSession).toHaveBeenCalledWith(1)
      })
    })

    it('shows deleting state during session deletion', async () => {
      const handleDeleteSession = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      const rows = [createRow(1, 'session', '2025-01-06', 'Alice', 69)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={handleDeleteSession}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      expect(screen.getByText('Deleting')).toBeInTheDocument()
    })
  })

  describe('delete package', () => {
    it('calls onDeletePackage when package delete is clicked', async () => {
      const handleDeletePackage = vi.fn().mockResolvedValue(undefined)
      const rows = [createRow(5, 'package', '2025-01-06', 'Bob', 1500)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={handleDeletePackage}
          onDeleteLateFee={() => {}}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(handleDeletePackage).toHaveBeenCalledWith(5)
      })
    })

    it('shows deleting state during package deletion', async () => {
      const handleDeletePackage = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      const rows = [createRow(5, 'package', '2025-01-06', 'Bob', 1500)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={handleDeletePackage}
          onDeleteLateFee={() => {}}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      expect(screen.getByText('Deleting')).toBeInTheDocument()
    })
  })

  describe('delete late fee', () => {
    it('calls onDeleteLateFee when lateFee delete is clicked', async () => {
      const handleDeleteLateFee = vi.fn().mockResolvedValue(undefined)
      const rows = [createRow(7, 'lateFee', '2025-01-08', 'Charlie', 45)]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={handleDeleteLateFee}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(handleDeleteLateFee).toHaveBeenCalledWith(7)
      })
    })
  })

  describe('concurrent delete prevention', () => {
    it('prevents multiple simultaneous deletes', async () => {
      const handleDeleteSession = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      const handleDeletePackage = vi.fn()
      const rows = [
        createRow(1, 'session', '2025-01-06', 'Alice', 69),
        createRow(2, 'package', '2025-01-07', 'Bob', 1500),
      ]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={handleDeleteSession}
          onDeletePackage={handleDeletePackage}
          onDeleteLateFee={() => {}}
        />,
      )

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })

      // Click first delete
      fireEvent.click(deleteButtons[0])

      // Try to click second delete while first is in progress
      fireEvent.click(deleteButtons[1])

      // Only first should be called
      expect(handleDeleteSession).toHaveBeenCalledTimes(1)
      expect(handleDeletePackage).not.toHaveBeenCalled()
    })

    it('allows new delete after previous completes', async () => {
      let resolveFirst: () => void
      const handleDeleteSession = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve
          }),
      )
      const handleDeletePackage = vi.fn().mockResolvedValue(undefined)
      const rows = [
        createRow(1, 'session', '2025-01-06', 'Alice', 69),
        createRow(2, 'package', '2025-01-07', 'Bob', 1500),
      ]

      render(
        <WeeklyBreakdownTable
          rows={rows}
          onDeleteSession={handleDeleteSession}
          onDeletePackage={handleDeletePackage}
          onDeleteLateFee={() => {}}
        />,
      )

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })

      // Click first delete
      fireEvent.click(deleteButtons[0])
      expect(handleDeleteSession).toHaveBeenCalledTimes(1)

      // Complete first delete
      resolveFirst!()

      await waitFor(() => {
        expect(screen.queryByText('Deleting')).not.toBeInTheDocument()
      })

      // Now second delete should work
      fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])

      await waitFor(() => {
        expect(handleDeletePackage).toHaveBeenCalledWith(2)
      })
    })
  })

  describe('mixed rows', () => {
    it('renders all row types correctly in one table', () => {
      render(
        <WeeklyBreakdownTable
          rows={mockRows}
          onDeleteSession={() => {}}
          onDeletePackage={() => {}}
          onDeleteLateFee={() => {}}
        />,
      )

      // Should have 4 rows
      const rows = screen.getAllByRole('row')
      // 1 header + 4 data rows = 5
      expect(rows).toHaveLength(5)

      // Should have 3 delete buttons (session, package, lateFee - not bonus)
      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
      expect(deleteButtons).toHaveLength(3)
    })
  })
})
