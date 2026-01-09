import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { configure } from '@testing-library/react'

// Configure React Testing Library to use legacy root API which has better act() handling
configure({ reactStrictMode: false })

// Suppress React act() warnings that occur with async state updates in useEffect
// These warnings are noise when using waitFor correctly
const originalError = console.error
console.error = (...args: unknown[]) => {
  const message = args[0]
  if (
    typeof message === 'string' &&
    message.includes('was not wrapped in act')
  ) {
    return
  }
  originalError.apply(console, args)
}

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
