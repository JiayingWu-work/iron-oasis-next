import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/server for Neon auth compatibility
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: unknown) => ({ json: () => data })),
    redirect: vi.fn(),
    next: vi.fn(),
  },
  NextRequest: vi.fn(),
}))

// Mock Neon auth modules for tests
vi.mock('@neondatabase/neon-js/auth', () => ({
  NeonAuthClient: vi.fn().mockImplementation(() => ({
    useSession: vi.fn().mockReturnValue({
      data: null,
      isPending: false,
    }),
  })),
}))

vi.mock('@neondatabase/neon-js/auth/next', () => ({
  neonAuth: vi.fn().mockResolvedValue({ user: null }),
  authApiHandler: vi.fn(),
  createAuthClient: vi.fn().mockReturnValue({
    useSession: vi.fn().mockReturnValue({
      data: null,
      isPending: false,
    }),
  }),
}))
