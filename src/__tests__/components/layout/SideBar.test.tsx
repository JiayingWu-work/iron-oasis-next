import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SideBar, { clearLocationFilterCache } from '@/components/layout/SideBar/SideBar'
import type { Trainer } from '@/types'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}))

// Mock the auth client
const mockSignOut = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: { user: { name: 'Test User' } },
      isPending: false,
    }),
    signOut: () => mockSignOut(),
  },
}))

describe('SideBar', () => {
  const mockTrainers: Trainer[] = [
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true, location: 'west' },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true, location: 'west' },
    { id: 3, name: 'Mike', tier: 1, email: 'mike@test.com', isActive: true, location: 'east' },
  ]

  const defaultProps = {
    trainers: mockTrainers,
    selectedTrainerId: 1,
    onSelectTrainer: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    clearLocationFilterCache()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  describe('sign out button', () => {
    it('renders the sign out button', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    })

    it('calls signOut and redirects to sign-in page when clicked', async () => {
      render(<SideBar {...defaultProps} />)

      const signOutButton = screen.getByRole('button', { name: 'Sign out' })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(window.location.href).toBe('/auth/sign-in')
      })
    })
  })

  describe('user welcome message', () => {
    it('displays the user name from session', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument()
    })
  })

  describe('trainer list', () => {
    it('renders all trainers', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })

    it('shows tier information for each trainer', () => {
      render(<SideBar {...defaultProps} />)

      // By default, only West trainers are shown (John Tier 1, Jane Tier 2)
      expect(screen.getByText('Tier 1')).toBeInTheDocument()
      expect(screen.getByText('Tier 2')).toBeInTheDocument()
    })

    it('calls onSelectTrainer when a trainer is clicked', () => {
      render(<SideBar {...defaultProps} />)

      fireEvent.click(screen.getByText('Jane'))

      expect(defaultProps.onSelectTrainer).toHaveBeenCalledWith(2)
    })
  })

  
  describe('settings button', () => {
    it('renders the settings button when not readOnly', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })

    it('hides the settings button when readOnly is true', () => {
      render(<SideBar {...defaultProps} readOnly />)

      expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
    })

    it('navigates to /settings when clicked', () => {
      render(<SideBar {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /settings/i }))

      expect(mockPush).toHaveBeenCalledWith('/settings')
    })

    it('calls onClose when settings is clicked and onClose is provided', () => {
      const onClose = vi.fn()
      render(<SideBar {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /settings/i }))

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('location tabs', () => {
    it('shows location tab buttons (West, East)', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByRole('button', { name: /West/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /East/ })).toBeInTheDocument()
    })

    it('shows trainer counts in location tabs', () => {
      render(<SideBar {...defaultProps} />)

      // 2 trainers at West (John, Jane), 1 at East (Mike)
      expect(screen.getByRole('button', { name: 'West (2)' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'East (1)' })).toBeInTheDocument()
    })

    it('shows only West trainers by default', () => {
      render(<SideBar {...defaultProps} />)

      // West trainers should be visible
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
      // East trainer should not be visible
      expect(screen.queryByText('Mike')).not.toBeInTheDocument()
    })

    it('shows all trainers when West tab is clicked (toggle off)', () => {
      render(<SideBar {...defaultProps} />)

      // West is selected by default, clicking it should show all trainers
      fireEvent.click(screen.getByRole('button', { name: 'West (2)' }))

      // All trainers should be visible
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
      expect(screen.getByText('Mike')).toBeInTheDocument()
    })

    it('filters trainers when East tab is clicked', () => {
      render(<SideBar {...defaultProps} />)

      // Click East to filter (first click filters to East only)
      fireEvent.click(screen.getByRole('button', { name: 'East (1)' }))

      // East trainer should be visible
      expect(screen.getByText('Mike')).toBeInTheDocument()
      // West trainers should not be visible
      expect(screen.queryByText('John')).not.toBeInTheDocument()
      expect(screen.queryByText('Jane')).not.toBeInTheDocument()
    })

    it('can toggle between locations', () => {
      render(<SideBar {...defaultProps} />)

      // Default is West - only West trainers visible
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.queryByText('Mike')).not.toBeInTheDocument()

      // Click East to filter to East only
      fireEvent.click(screen.getByRole('button', { name: 'East (1)' }))
      expect(screen.getByText('Mike')).toBeInTheDocument()
      expect(screen.queryByText('John')).not.toBeInTheDocument()

      // Click East again to show all
      fireEvent.click(screen.getByRole('button', { name: 'East (1)' }))
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Mike')).toBeInTheDocument()
    })

    it('hides location tabs when readOnly is true', () => {
      render(<SideBar {...defaultProps} readOnly />)

      expect(screen.queryByRole('button', { name: /West/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /East/ })).not.toBeInTheDocument()
    })
  })
})
