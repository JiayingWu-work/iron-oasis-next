import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from '@/app/settings/page'

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock auth client
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: { user: { id: 'user-123', name: 'Test User' } },
      isPending: false,
    }),
  },
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockFetch.mockClear()
  })

  describe('when user is owner', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'owner', trainer_id: null }),
      })
    })

    it('renders the settings page title', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
      })
    })

    it('renders the subtitle', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Manage trainers, clients, and pricing')).toBeInTheDocument()
      })
    })

    it('renders the back to dashboard button', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
      })
    })

    it('navigates to dashboard when back button is clicked', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('renders all settings cards', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        // Client Management
        expect(screen.getByText('Add Client')).toBeInTheDocument()
        expect(screen.getByText('Edit Client')).toBeInTheDocument()
        expect(screen.getByText('Archive Client')).toBeInTheDocument()
        expect(screen.getByText('Unarchive Client')).toBeInTheDocument()
        // Trainer Management
        expect(screen.getByText('Add Trainer')).toBeInTheDocument()
        expect(screen.getByText('Edit Trainer')).toBeInTheDocument()
        expect(screen.getByText('Archive Trainer')).toBeInTheDocument()
        expect(screen.getByText('Unarchive Trainer')).toBeInTheDocument()
        // Pricing
        expect(screen.getByText('Update Pricing')).toBeInTheDocument()
        expect(screen.getByText('Update Late Fee')).toBeInTheDocument()
      })
    })


    it('renders section labels', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Client Management')).toBeInTheDocument()
        expect(screen.getByText('Trainer Management')).toBeInTheDocument()
        expect(screen.getByText('Pricing')).toBeInTheDocument()
      })
    })
  })

  describe('when user is trainer', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'trainer', trainer_id: 1 }),
      })
    })

    it('redirects trainer to dashboard', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('loading state', () => {
    it('shows loading spinner while checking user role', () => {
      // Mock a slow fetch
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<SettingsPage />)

      // Should show loading state (the spinner component exists)
      expect(document.querySelector('[class*="spinner"]')).toBeInTheDocument()
    })
  })
})
