'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import {
  SettingsCard,
  AddClientSettingsForm,
  AddTrainerSettingsForm,
  EditClientForm,
  EditTrainerForm,
  PricingTable,
  ArchiveClientForm,
  ArchiveTrainerForm,
  UnarchiveClientForm,
  UnarchiveTrainerForm,
  LateFeeForm,
  ToastContainer,
  useToast,
  Spinner,
} from '@/components'
import {
  ArrowLeft,
  UserPen,
  UserPlus,
  Archive,
  ArchiveRestore,
  DollarSign,
  Clock,
} from 'lucide-react'
import styles from './page.module.css'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [userRole, setUserRole] = useState<'owner' | 'trainer' | null>(null)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isEditTrainerOpen, setIsEditTrainerOpen] = useState(false)
  const [isPricingTableOpen, setIsPricingTableOpen] = useState(false)
  const [isArchiveClientOpen, setIsArchiveClientOpen] = useState(false)
  const [isArchiveTrainerOpen, setIsArchiveTrainerOpen] = useState(false)
  const [isUnarchiveClientOpen, setIsUnarchiveClientOpen] = useState(false)
  const [isUnarchiveTrainerOpen, setIsUnarchiveTrainerOpen] = useState(false)
  const [isLateFeeOpen, setIsLateFeeOpen] = useState(false)
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
          <Spinner size="lg" />
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
                title="Add Client"
                description="Create a new client for a trainer"
                icon={<UserPlus size={20} />}
                onClick={() => setIsAddClientOpen(true)}
              />
              <SettingsCard
                title="Edit Client"
                description="Update client details, transfer, or adjust pricing"
                icon={<UserPen size={20} />}
                onClick={() => setIsEditClientOpen(true)}
              />
              <SettingsCard
                title="Archive Client"
                description="Hide a client who no longer trains here"
                icon={<Archive size={20} />}
                onClick={() => setIsArchiveClientOpen(true)}
              />
              <SettingsCard
                title="Unarchive Client"
                description="Restore a previously archived client"
                icon={<ArchiveRestore size={20} />}
                onClick={() => setIsUnarchiveClientOpen(true)}
              />
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h2 className={styles.sectionLabel}>Trainer Management</h2>
            <div className={styles.cardsGrid}>
              <SettingsCard
                title="Add Trainer"
                description="Create a new trainer for the gym"
                icon={<UserPlus size={20} />}
                onClick={() => setIsAddTrainerOpen(true)}
              />
              <SettingsCard
                title="Edit Trainer"
                description="Update trainer name, email, or tier"
                icon={<UserPen size={20} />}
                onClick={() => setIsEditTrainerOpen(true)}
              />
              <SettingsCard
                title="Archive Trainer"
                description="Hide a trainer who no longer works here"
                icon={<Archive size={20} />}
                onClick={() => setIsArchiveTrainerOpen(true)}
              />
              <SettingsCard
                title="Unarchive Trainer"
                description="Restore a previously archived trainer"
                icon={<ArchiveRestore size={20} />}
                onClick={() => setIsUnarchiveTrainerOpen(true)}
              />
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h2 className={styles.sectionLabel}>Pricing</h2>
            <div className={styles.cardsGrid}>
              <SettingsCard
                title="Update Pricing"
                description="View session rates for each tier"
                icon={<DollarSign size={20} />}
                onClick={() => setIsPricingTableOpen(true)}
              />
              <SettingsCard
                title="Update Late Fee"
                description="Adjust the late cancellation fee amount"
                icon={<Clock size={20} />}
                onClick={() => setIsLateFeeOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <AddClientSettingsForm
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={(clientName) => {
          showSuccess(`${clientName} created successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <AddTrainerSettingsForm
        isOpen={isAddTrainerOpen}
        onClose={() => setIsAddTrainerOpen(false)}
        onSuccess={(trainerName) => {
          showSuccess(`${trainerName} created successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

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

      <PricingTable
        isOpen={isPricingTableOpen}
        onClose={() => setIsPricingTableOpen(false)}
        onSuccess={() => {
          showSuccess('Pricing updated successfully')
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <ArchiveClientForm
        isOpen={isArchiveClientOpen}
        onClose={() => setIsArchiveClientOpen(false)}
        onSuccess={(clientName) => {
          showSuccess(`${clientName} archived successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <ArchiveTrainerForm
        isOpen={isArchiveTrainerOpen}
        onClose={() => setIsArchiveTrainerOpen(false)}
        onSuccess={(trainerName) => {
          showSuccess(`${trainerName} archived successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <UnarchiveClientForm
        isOpen={isUnarchiveClientOpen}
        onClose={() => setIsUnarchiveClientOpen(false)}
        onSuccess={(clientName) => {
          showSuccess(`${clientName} restored successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <UnarchiveTrainerForm
        isOpen={isUnarchiveTrainerOpen}
        onClose={() => setIsUnarchiveTrainerOpen(false)}
        onSuccess={(trainerName) => {
          showSuccess(`${trainerName} restored successfully`)
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <LateFeeForm
        isOpen={isLateFeeOpen}
        onClose={() => setIsLateFeeOpen(false)}
        onSuccess={() => {
          showSuccess('Late fee updated successfully')
        }}
        onError={(message) => {
          showError(message)
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
