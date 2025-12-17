import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeeklyDashboard from '@/components/tables/WeeklyDashboard'
import type { Client, Session, Package, Trainer, LateFee } from '@/types'

describe('WeeklyDashboard', () => {
  const mockTrainer: Trainer = {
    id: 1,
    name: 'John Trainer',
    tier: 2,
  }

  const mockClients: Client[] = [
    { id: 1, name: 'Alice', trainerId: 1 },
    { id: 2, name: 'Bob', trainerId: 1 },
  ]

  const mockPackages: Package[] = [
    {
      id: 1,
      clientId: 1,
      trainerId: 1,
      sessionsPurchased: 10,
      startDate: '2025-01-13',
    },
    {
      id: 2,
      clientId: 2,
      trainerId: 1,
      sessionsPurchased: 10,
      startDate: '2025-01-10',
    },
  ]

  const mockSessions: Session[] = [
    { id: 1, clientId: 1, trainerId: 1, date: '2025-01-13' },
    { id: 2, clientId: 1, trainerId: 1, date: '2025-01-14' },
    { id: 3, clientId: 2, trainerId: 1, date: '2025-01-15' },
  ]

  const mockLateFees: LateFee[] = []

  const defaultProps = {
    clients: mockClients,
    packages: mockPackages,
    sessions: mockSessions,
    lateFees: mockLateFees,
    weekStart: '2025-01-13',
    weekEnd: '2025-01-19',
    selectedTrainer: mockTrainer,
    onDeleteSession: vi.fn(),
    onDeletePackage: vi.fn(),
    onDeleteLateFee: vi.fn(),
  }

  describe('structure and layout', () => {
    it('renders weekly summary heading', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
    })

    it('renders week date range', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      expect(
        screen.getByText('Week: 2025-01-13 → 2025-01-19'),
      ).toBeInTheDocument()
    })

    it('renders breakdown title', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      expect(screen.getByText('Breakdown of the week')).toBeInTheDocument()
    })
  })

  describe('client table integration', () => {
    it('renders client names in client table', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // Client names may appear in both client table and breakdown table
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    })

    it('renders client table headers', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // "Client" appears as column header in both tables
      expect(screen.getAllByText('Client').length).toBeGreaterThan(0)
      expect(screen.getByText('Package')).toBeInTheDocument()
      expect(screen.getByText('Used')).toBeInTheDocument()
      expect(screen.getByText('Remaining')).toBeInTheDocument()
      expect(screen.getByText('Classes This Week')).toBeInTheDocument()
    })
  })

  describe('income summary integration', () => {
    it('renders classes this week count', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // 3 sessions total in the week
      expect(screen.getByText(/Classes this week: 3/)).toBeInTheDocument()
    })

    it('renders rate percentage', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // Senior tier rate should be displayed
      expect(screen.getByText(/Rate:/)).toBeInTheDocument()
    })

    it('renders weekly income', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      expect(screen.getByText(/Weekly income:/)).toBeInTheDocument()
    })
  })

  describe('breakdown table integration', () => {
    it('renders breakdown table headers', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
    })

    it('renders session rows in breakdown', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // Sessions should appear as "Class" type
      const classCells = screen.getAllByText('Class')
      expect(classCells.length).toBeGreaterThan(0)
    })

    it('renders package rows in breakdown', () => {
      render(<WeeklyDashboard {...defaultProps} />)

      // Package should appear as "Package purchase"
      const packageCells = screen.getAllByText('Package purchase')
      expect(packageCells.length).toBeGreaterThan(0)
    })
  })

  describe('with late fees', () => {
    it('renders late fee in income summary when present', () => {
      const propsWithLateFees = {
        ...defaultProps,
        lateFees: [
          { id: 1, clientId: 1, trainerId: 1, date: '2025-01-14', amount: 45 },
        ],
      }

      render(<WeeklyDashboard {...propsWithLateFees} />)

      expect(screen.getByText(/Late fees:/)).toBeInTheDocument()
    })

    it('renders late fee in breakdown when present', () => {
      const propsWithLateFees = {
        ...defaultProps,
        lateFees: [
          { id: 1, clientId: 1, trainerId: 1, date: '2025-01-14', amount: 45 },
        ],
      }

      render(<WeeklyDashboard {...propsWithLateFees} />)

      expect(screen.getByText('Late fee')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders with no sessions', () => {
      const propsNoSessions = {
        ...defaultProps,
        sessions: [],
      }

      render(<WeeklyDashboard {...propsNoSessions} />)

      expect(screen.getByText('Classes this week: 0')).toBeInTheDocument()
    })

    it('renders with no clients', () => {
      const propsNoClients = {
        ...defaultProps,
        clients: [],
        sessions: [],
        packages: [],
      }

      render(<WeeklyDashboard {...propsNoClients} />)

      expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
    })
  })

  describe('different week ranges', () => {
    it('displays different week range', () => {
      const propsNewWeek = {
        ...defaultProps,
        weekStart: '2025-02-03',
        weekEnd: '2025-02-09',
        sessions: [],
      }

      render(<WeeklyDashboard {...propsNewWeek} />)

      expect(
        screen.getByText('Week: 2025-02-03 → 2025-02-09'),
      ).toBeInTheDocument()
    })

    it('filters sessions by week range', () => {
      // Sessions in January, but week range is February
      const propsNewWeek = {
        ...defaultProps,
        weekStart: '2025-02-03',
        weekEnd: '2025-02-09',
      }

      render(<WeeklyDashboard {...propsNewWeek} />)

      // No sessions in this week
      expect(screen.getByText('Classes this week: 0')).toBeInTheDocument()
    })
  })

  describe('rate based on session count', () => {
    it('renders 46% rate when 12 or fewer sessions', () => {
      // defaultProps has 3 sessions
      render(<WeeklyDashboard {...defaultProps} />)

      // <= 12 sessions = 46% rate
      expect(screen.getByText(/Rate: 46%/)).toBeInTheDocument()
    })

    it('renders 51% rate when more than 12 sessions', () => {
      // Create 13 sessions to trigger 51% rate
      const manySessions: Session[] = Array.from({ length: 13 }, (_, i) => ({
        id: i + 1,
        clientId: 1,
        trainerId: 1,
        date: `2025-01-${(13 + (i % 7)).toString().padStart(2, '0')}`,
        packageId: null,
      }))

      const propsManySessions = {
        ...defaultProps,
        sessions: manySessions,
      }

      render(<WeeklyDashboard {...propsManySessions} />)

      // > 12 sessions = 51% rate
      expect(screen.getByText(/Rate: 51%/)).toBeInTheDocument()
    })
  })

  describe('delete callbacks', () => {
    it('passes onDeleteSession to breakdown table', () => {
      const { container } = render(<WeeklyDashboard {...defaultProps} />)

      // Delete buttons should be present in breakdown table
      const deleteButtons = container.querySelectorAll('button')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  describe('data filtering', () => {
    it('only shows sessions for selected trainer', () => {
      const mixedSessions: Session[] = [
        { id: 1, clientId: 1, trainerId: 1, date: '2025-01-13' },
        { id: 2, clientId: 1, trainerId: 2, date: '2025-01-14' }, // Different trainer
      ]

      const props = {
        ...defaultProps,
        sessions: mixedSessions,
      }

      render(<WeeklyDashboard {...props} />)

      // Only 1 session for trainer 1
      expect(screen.getByText('Classes this week: 1')).toBeInTheDocument()
    })

    it('only shows packages for selected trainer', () => {
      const mixedPackages: Package[] = [
        {
          id: 1,
          clientId: 1,
          trainerId: 1,
          sessionsPurchased: 10,
          startDate: '2025-01-13',
        },
        {
          id: 2,
          clientId: 2,
          trainerId: 2, // Different trainer
          sessionsPurchased: 10,
          startDate: '2025-01-14',
        },
      ]

      const props = {
        ...defaultProps,
        packages: mixedPackages,
        sessions: [
          { id: 1, clientId: 1, trainerId: 1, date: '2025-01-13', packageId: 1 },
        ],
      }

      render(<WeeklyDashboard {...props} />)

      // Should only show 1 package row in breakdown
      const packageCells = screen.getAllByText('Package purchase')
      expect(packageCells).toHaveLength(1)
    })
  })
})
