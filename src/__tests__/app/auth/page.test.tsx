import { describe, it, expect } from 'vitest'

// Test the generateStaticParams function to ensure all auth paths are included
describe('Auth page static params', () => {
  // We test the expected paths that should be generated
  const expectedPaths = [
    'sign-in',
    'sign-up',
    'sign-out',
    'forgot-password',
    'reset-password',
  ]

  it('should include all required auth paths', async () => {
    // Import the generateStaticParams function from the auth page
    const { generateStaticParams } = await import('@/app/auth/[path]/page')
    const params = generateStaticParams()

    // Verify all expected paths are present
    const paths = params.map((p) => p.path)

    expectedPaths.forEach((expectedPath) => {
      expect(paths).toContain(expectedPath)
    })
  })

  describe('sign-in page', () => {
    it('should include sign-in path for user authentication', async () => {
      const { generateStaticParams } = await import('@/app/auth/[path]/page')
      const params = generateStaticParams()
      const paths = params.map((p) => p.path)

      expect(paths).toContain('sign-in')
    })
  })

  describe('sign-up page', () => {
    it('should include sign-up path for user registration', async () => {
      const { generateStaticParams } = await import('@/app/auth/[path]/page')
      const params = generateStaticParams()
      const paths = params.map((p) => p.path)

      expect(paths).toContain('sign-up')
    })
  })

  describe('sign-out page', () => {
    it('should include sign-out path for user logout', async () => {
      const { generateStaticParams } = await import('@/app/auth/[path]/page')
      const params = generateStaticParams()
      const paths = params.map((p) => p.path)

      expect(paths).toContain('sign-out')
    })
  })

  describe('forgot-password page', () => {
    it('should include forgot-password path for password reset flow', async () => {
      const { generateStaticParams } = await import('@/app/auth/[path]/page')
      const params = generateStaticParams()
      const paths = params.map((p) => p.path)

      expect(paths).toContain('forgot-password')
    })
  })

  describe('reset-password page', () => {
    it('should include reset-password path for password reset completion', async () => {
      const { generateStaticParams } = await import('@/app/auth/[path]/page')
      const params = generateStaticParams()
      const paths = params.map((p) => p.path)

      expect(paths).toContain('reset-password')
    })
  })
})
