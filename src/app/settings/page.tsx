'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import {
  SettingsCard,
  EditClientForm,
  EditTrainerForm,
  ToastContainer,
  useToast,
} from '@/components'
import {
  ArrowLeft,
  ArrowLeftRight,
  UserPen,
  Archive,
  DollarSign,
  Clock,
} from 'lucide-react'
import styles from './page.module.css'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [userRole, setUserRole] = useState<'owner' | 'trainer' | null>(null)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isEditTrainerOpen, setIsEditTrainerOpen] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Check user role
  useEffect(() => {
    if (isPending || userRole) return
    if (!session?.user?.id) return

    fetch(`/api/user-profile?authUserId=${session.user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile?.role === 'trainer') {
          setUserRole('trainer')
          router.replace('/dashboard')
        } else {
          setUserRole('owner')
        }
      })
      .catch(() => setUserRole('owner'))
  }, [session, isPending, userRole, router])

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (isPending || userRole === null) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    )
  }

  if (userRole === 'trainer') {
    return null
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToDashboard}
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>
              Manage trainers, clients, and pricing
            </p>
          </div>
        </header>

        <div className={styles.sections}>
          <div className={styles.sectionGroup}>
            <h2 className={styles.sectionLabel}>Client Management</h2>
            <div className={styles.cardsGrid}>
              <SettingsCard
                title="Transfer Client"
                description="Reassign a client to a different trainer"
                icon={<ArrowLeftRight size={20} />}
                badge="Coming Soon"
              />
              <SettingsCard
                title="Edit Client"
                description="Update client name or training mode"
                icon={<UserPen size={20} />}
                onClick={() => setIsEditClientOpen(true)}
              />
              <SettingsCard
                title="Archive Client"
                description="Deactivate a client who no longer trains here"
                icon={<Archive size={20} />}
                badge="Coming Soon"
              />
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h2 className={styles.sectionLabel}>Trainer Management</h2>
            <div className={styles.cardsGrid}>
              <SettingsCard
                title="Edit Trainer"
                description="Update trainer name, email, or tier"
                icon={<UserPen size={20} />}
                onClick={() => setIsEditTrainerOpen(true)}
              />
              <SettingsCard
                title="Archive Trainer"
                description="Deactivate a trainer who no longer works here"
                icon={<Archive size={20} />}
                badge="Coming Soon"
              />
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h2 className={styles.sectionLabel}>Pricing</h2>
            <div className={styles.cardsGrid}>
              <SettingsCard
                title="Update Pricing"
                description="Adjust session rates for each tier"
                icon={<DollarSign size={20} />}
                badge="Coming Soon"
              />
              <SettingsCard
                title="Update Late Fee"
                description="Adjust the late cancellation fee amount"
                icon={<Clock size={20} />}
                badge="Coming Soon"
              />
            </div>
          </div>
        </div>
      </div>

      <EditClientForm
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        onSuccess={(clientName) => {
          showSuccess(`${clientName} updated successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <EditTrainerForm
        isOpen={isEditTrainerOpen}
        onClose={() => setIsEditTrainerOpen(false)}
        onSuccess={(trainerName) => {
          showSuccess(`${trainerName} updated successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
