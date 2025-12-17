'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import styles from './page.module.css'

/** Convert trainer name and ID to URL-safe slug (e.g., "jiaying-1") */
function toSlug(name: string, id: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${id}`
}

/**
 * Dashboard router page.
 * - For trainers: redirects to /dashboard/[theirTrainerName]
 * - For owners: redirects to /dashboard/[firstTrainerName] (first trainer in the list)
 *
 * This ensures the URL always reflects the current trainer, avoiding race conditions
 * between role checking and data fetching.
 */
export default function DashboardRouter() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    if (!session?.user?.id) return

    async function determineRedirect() {
      try {
        // Load trainers first (we need names for URLs)
        const trainersRes = await fetch('/api/trainers')
        if (!trainersRes.ok) {
          setError('Failed to load trainers')
          return
        }

        const { trainers } = await trainersRes.json()
        if (trainers.length === 0) {
          setError('No trainers found')
          return
        }

        // Check user role
        const profileRes = await fetch(`/api/user-profile?authUserId=${session!.user.id}`)

        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile?.role === 'trainer' && profile.trainer_id) {
            // Trainer: redirect to their specific dashboard
            const userTrainer = trainers.find((t: { id: number }) => t.id === profile.trainer_id)
            if (userTrainer) {
              router.replace(`/dashboard/${toSlug(userTrainer.name, userTrainer.id)}`)
              return
            }
          }
        }

        // Owner or no profile: redirect to first trainer
        router.replace(`/dashboard/${toSlug(trainers[0].name, trainers[0].id)}`)
      } catch {
        setError('Failed to load dashboard')
      }
    }

    determineRedirect()
  }, [session, isPending, router])

  if (error) {
    return <div className={styles.app}>{error}</div>
  }

  return <div className={styles.app}>Loading…</div>
}
