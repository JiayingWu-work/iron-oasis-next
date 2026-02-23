'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Spinner, SideBar, Card } from '@/components'
import styles from './page.module.css'

/** Convert trainer name and ID to URL-safe slug (e.g., "jiaying-1") */
function toSlug(name: string, id: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${id}`
}

/**
 * Dashboard router page.
 * - For trainers: redirects to /dashboard/[theirTrainerName]
 * - For owners: redirects to /dashboard/[firstTrainerName] (first trainer in the list)
 * - If no trainers exist and user is owner: shows empty dashboard with sidebar
 *
 * This ensures the URL always reflects the current trainer, avoiding race conditions
 * between role checking and data fetching.
 */
export default function DashboardRouter() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showEmptyDashboard, setShowEmptyDashboard] = useState(false)

  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    if (!session?.user?.id) {
      router.replace('/auth/sign-in')
      return
    }

    async function determineRedirect() {
      try {
        // Load trainers first (we need names for URLs)
        const trainersRes = await fetch('/api/trainers')
        if (!trainersRes.ok) {
          setError('Failed to load trainers')
          return
        }

        const { trainers } = await trainersRes.json()

        // Check if user profile exists
        const profileRes = await fetch(`/api/user-profile?authUserId=${session!.user.id}`)

        let profile = null

        if (profileRes.ok) {
          profile = await profileRes.json()
        } else if (profileRes.status === 404) {
          // Profile doesn't exist - create one based on email
          const userEmail = session!.user.email
          if (!userEmail) {
            setError('Unable to determine your email. Please try logging in again.')
            return
          }

          const createRes = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authUserId: session!.user.id,
              email: userEmail,
            }),
          })

          if (createRes.status === 403) {
            const data = await createRes.json()
            setError(data.error || "Your email isn't registered. Contact the gym owner.")
            return
          }

          if (!createRes.ok) {
            setError('Failed to create profile. Please try again.')
            return
          }

          profile = await createRes.json()
        }

        // If no trainers exist
        if (trainers.length === 0) {
          if (profile?.role === 'owner') {
            // Show empty dashboard with sidebar for owners
            setShowEmptyDashboard(true)
            return
          }
          setError('No trainers found. Please contact the gym owner.')
          return
        }

        if (profile?.role === 'trainer' && profile.trainer_id) {
          // Trainer: redirect to their specific dashboard
          const userTrainer = trainers.find((t: { id: number }) => t.id === profile.trainer_id)
          if (userTrainer) {
            router.replace(`/dashboard/${toSlug(userTrainer.name, userTrainer.id)}`)
            return
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

  // Show empty dashboard for owners when no trainers exist
  if (showEmptyDashboard) {
    return (
      <div className={styles.app}>
        <SideBar
          trainers={[]}
          selectedTrainerId={null}
          onSelectTrainer={() => {}}
          isOpen={false}
          onClose={() => {}}
          readOnly={false}
        />
        <div className={styles.main}>
          <div className={styles.emptyDashboard}>
            <Card>
              <div className={styles.emptyContent}>
                <h2 className={styles.emptyTitle}>No Trainers Yet</h2>
                <p className={styles.emptyText}>
                  Go to Settings to add your first trainer.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.app}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.goBackButton}
            onClick={async () => {
              await authClient.signOut()
              window.location.href = '/auth/sign-in'
            }}
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <div className={styles.loadingContent}>
        <Spinner size="lg" />
      </div>
    </div>
  )
}
