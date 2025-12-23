import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SideBar from '@/components/layout/SideBar/SideBar'
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
    { id: 1, name: 'John', tier: 1, email: 'john@test.com', isActive: true },
    { id: 2, name: 'Jane', tier: 2, email: 'jane@test.com', isActive: true },
  ]

  const defaultProps = {
    trainers: mockTrainers,
    selectedTrainerId: 1,
    onSelectTrainer: vi.fn(),
    onAddClient: vi.fn(),
    onAddTrainer: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
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

      expect(screen.getByText('Tier 1')).toBeInTheDocument()
      expect(screen.getByText('Tier 2')).toBeInTheDocument()
    })

    it('calls onSelectTrainer when a trainer is clicked', () => {
      render(<SideBar {...defaultProps} />)

      fireEvent.click(screen.getByText('Jane'))

      expect(defaultProps.onSelectTrainer).toHaveBeenCalledWith(2)
    })
  })

  describe('action buttons', () => {
    it('renders add client button when not readOnly', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByText('+ Add new client')).toBeInTheDocument()
    })

    it('renders add trainer button when not readOnly', () => {
      render(<SideBar {...defaultProps} />)

      expect(screen.getByText('+ Add new trainer')).toBeInTheDocument()
    })

    it('hides action buttons when readOnly is true', () => {
      render(<SideBar {...defaultProps} readOnly />)

      expect(screen.queryByText('+ Add new client')).not.toBeInTheDocument()
      expect(screen.queryByText('+ Add new trainer')).not.toBeInTheDocument()
    })

    it('calls onAddClient when add client button is clicked', () => {
      render(<SideBar {...defaultProps} />)

      fireEvent.click(screen.getByText('+ Add new client'))

      expect(defaultProps.onAddClient).toHaveBeenCalled()
    })

    it('calls onAddTrainer when add trainer button is clicked', () => {
      render(<SideBar {...defaultProps} />)

      fireEvent.click(screen.getByText('+ Add new trainer'))

      expect(defaultProps.onAddTrainer).toHaveBeenCalled()
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
})
