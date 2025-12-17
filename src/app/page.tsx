import { redirect } from 'next/navigation'
import { neonAuth } from '@neondatabase/neon-js/auth/next'

export default async function Page() {
  const { user } = await neonAuth()

  // If not logged in, redirect to sign in
  if (!user?.id) {
    redirect('/auth/sign-in')
  }

  // All authenticated users go to dashboard
  // Role-based restrictions are handled in the dashboard page
  redirect('/dashboard')
}
