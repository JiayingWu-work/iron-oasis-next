import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeeklyClientTable from '@/components/tables/WeeklyClientTable'

interface WeeklyClientRow {
  clientId: number
  clientName: string
  packageDisplay: string
  usedDisplay: string
  remainingDisplay: string
  weekCount: number
  totalRemaining: number
}

describe('WeeklyClientTable', () => {
  const createRow = (
    clientId: number,
    clientName: string,
    packageDisplay: string,
    usedDisplay: string,
    remainingDisplay: string,
    weekCount: number,
    totalRemaining: number,
  ): WeeklyClientRow => ({
    clientId,
    clientName,
    packageDisplay,
    usedDisplay,
    remainingDisplay,
    weekCount,
    totalRemaining,
  })

  describe('table structure', () => {
    it('renders table headers', () => {
      render(<WeeklyClientTable rows={[]} />)

      expect(screen.getByText('Client')).toBeInTheDocument()
      expect(screen.getByText('Package')).toBeInTheDocument()
      expect(screen.getByText('Used')).toBeInTheDocument()
      expect(screen.getByText('Remaining')).toBeInTheDocument()
      expect(screen.getByText('Classes This Week')).toBeInTheDocument()
    })

    it('renders empty table when no rows', () => {
      render(<WeeklyClientTable rows={[]} />)

      const tbody = screen.getByRole('table').querySelector('tbody')
      expect(tbody?.children).toHaveLength(0)
    })
  })

  describe('row rendering', () => {
    it('renders client data in rows', () => {
      const rows = [
        createRow(1, 'Alice', '10', '3', '7', 2, 7),
        createRow(2, 'Bob', '20', '15', '5', 3, 5),
      ]

      render(<WeeklyClientTable rows={rows} />)

      // Alice's row
      expect(screen.getByText('Alice')).toBeInTheDocument()
      // Bob's row
      expect(screen.getByText('Bob')).toBeInTheDocument()

      // Package values (may appear multiple times)
      expect(screen.getAllByText('10').length).toBeGreaterThan(0)
      expect(screen.getByText('20')).toBeInTheDocument()

      // Used values (may appear in week count column too)
      expect(screen.getAllByText('3').length).toBeGreaterThan(0)
      expect(screen.getByText('15')).toBeInTheDocument()

      // Remaining values (may appear in week count column too)
      expect(screen.getAllByText('7').length).toBeGreaterThan(0)
      expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    })

    it('renders combined package displays', () => {
      const rows = [createRow(1, 'Alice', '10 + 5', '8 + 0', '2 + 5', 1, 7)]

      render(<WeeklyClientTable rows={rows} />)

      expect(screen.getByText('10 + 5')).toBeInTheDocument()
      expect(screen.getByText('8 + 0')).toBeInTheDocument()
      expect(screen.getByText('2 + 5')).toBeInTheDocument()
    })

    it('renders week count for each client', () => {
      const rows = [
        createRow(1, 'Alice', '10', '3', '7', 4, 7),
        createRow(2, 'Bob', '10', '5', '5', 2, 5),
      ]

      render(<WeeklyClientTable rows={rows} />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('remaining sessions styling', () => {
    it('applies red styling when remaining is 0', () => {
      const rows = [createRow(1, 'Alice', '10', '10', '0', 2, 0)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      // Find cells with red class
      const redCells = container.querySelectorAll('[class*="textRedRemaining"]')
      expect(redCells.length).toBeGreaterThan(0)
    })

    it('applies red styling when remaining is negative', () => {
      const rows = [createRow(1, 'Alice', '0', '3', '-3', 1, -3)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      const redCells = container.querySelectorAll('[class*="textRedRemaining"]')
      expect(redCells.length).toBeGreaterThan(0)
    })

    it('applies yellow styling when remaining is 1', () => {
      const rows = [createRow(1, 'Alice', '10', '9', '1', 2, 1)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      const yellowCells = container.querySelectorAll(
        '[class*="textYellowWarning"]',
      )
      expect(yellowCells.length).toBeGreaterThan(0)
    })

    it('applies yellow styling when remaining is 2', () => {
      const rows = [createRow(1, 'Alice', '10', '8', '2', 2, 2)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      const yellowCells = container.querySelectorAll(
        '[class*="textYellowWarning"]',
      )
      expect(yellowCells.length).toBeGreaterThan(0)
    })

    it('applies no special styling when remaining is 3 or more', () => {
      const rows = [createRow(1, 'Alice', '10', '7', '3', 2, 3)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      const redCells = container.querySelectorAll('[class*="textRedRemaining"]')
      const yellowCells = container.querySelectorAll(
        '[class*="textYellowWarning"]',
      )

      expect(redCells.length).toBe(0)
      expect(yellowCells.length).toBe(0)
    })

    it('applies styling to both client name and remaining cells', () => {
      const rows = [createRow(1, 'Alice', '10', '10', '0', 2, 0)]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      // Should have red styling on 2 cells: client name and remaining
      const redCells = container.querySelectorAll('[class*="textRedRemaining"]')
      expect(redCells.length).toBe(2)
    })
  })

  describe('multiple clients with different states', () => {
    it('renders mixed styling for different remaining values', () => {
      const rows = [
        createRow(1, 'Alice', '10', '10', '0', 2, 0), // Red (0)
        createRow(2, 'Bob', '10', '9', '1', 3, 1), // Yellow (1)
        createRow(3, 'Charlie', '10', '5', '5', 1, 5), // Normal (5)
      ]

      const { container } = render(<WeeklyClientTable rows={rows} />)

      // All three clients rendered
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()

      // Check styling exists
      const redCells = container.querySelectorAll('[class*="textRedRemaining"]')
      const yellowCells = container.querySelectorAll(
        '[class*="textYellowWarning"]',
      )

      expect(redCells.length).toBeGreaterThan(0)
      expect(yellowCells.length).toBeGreaterThan(0)
    })
  })

  describe('drop-in clients', () => {
    it('renders negative remaining for drop-in clients', () => {
      const rows = [createRow(1, 'Alice', '0', '5', '-5', 2, -5)]

      render(<WeeklyClientTable rows={rows} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('-5')).toBeInTheDocument()
    })
  })
})
