import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Trainer, Location } from '@/types'
import { authClient } from '@/lib/auth/client'
import { LogOut, Settings, X } from 'lucide-react'
import styles from './SideBar.module.css'

type LocationFilter = 'all' | Location

interface SideBarProps {
  trainers: Trainer[]
  selectedTrainerId: number | null
  onSelectTrainer: (id: number) => void
  onAddClient: () => void
  onAddTrainer: () => void
  isOpen?: boolean // used for mobile drawer
  onClose?: () => void
  readOnly?: boolean
}

export default function SideBar({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
  onAddClient,
  onAddTrainer,
  isOpen = true,
  onClose,
  readOnly = false,
}: SideBarProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userName = session?.user?.name || 'User'
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all')

  const filteredTrainers = useMemo(() => {
    if (locationFilter === 'all') return trainers
    return trainers.filter((t) => t.location === locationFilter)
  }, [trainers, locationFilter])

  const westCount = useMemo(() => trainers.filter((t) => t.location === 'west').length, [trainers])
  const eastCount = useMemo(() => trainers.filter((t) => t.location === 'east').length, [trainers])

  const handleSettings = () => {
    onClose?.()
    router.push('/settings')
  }

  const handleSelectTrainer = (id: number) => {
    onSelectTrainer(id)
    onClose?.()
  }

  const handleAddClient = () => {
    onAddClient()
    onClose?.()
  }

  const handleAddTrainer = () => {
    onAddTrainer()
    onClose?.()
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/auth/sign-in'
  }

  const overlayClass = isOpen
    ? `${styles.overlay} ${styles.overlayShow}`
    : styles.overlay

  const sidebarClass = isOpen
    ? `${styles.sidebar} ${styles.sidebarOpen}`
    : styles.sidebar

  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <aside className={sidebarClass}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Iron Oasis</h1>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <p className={styles.subtitle}>Welcome, {userName}</p>
        </div>
        {!readOnly && (
          <div>
            <h3 className={styles.sectionTitle}>Forms</h3>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleAddClient}
            >
              + Add new client
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleAddTrainer}
            >
              + Add new trainer
            </button>
          </div>
        )}
        <div className={styles.trainersSection}>
          <h3 className={styles.sectionTitle}>{readOnly ? 'Trainer' : 'Trainers'}</h3>
          {!readOnly && (
            <div className={styles.locationTabs}>
              <button
                type="button"
                className={`${styles.locationTab} ${locationFilter === 'all' ? styles.locationTabActive : ''}`}
                onClick={() => setLocationFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`${styles.locationTab} ${locationFilter === 'west' ? styles.locationTabActive : ''}`}
                onClick={() => setLocationFilter('west')}
              >
                West ({westCount})
              </button>
              <button
                type="button"
                className={`${styles.locationTab} ${locationFilter === 'east' ? styles.locationTabActive : ''}`}
                onClick={() => setLocationFilter('east')}
              >
                East ({eastCount})
              </button>
            </div>
          )}
          <ul className={styles.trainerList}>
            {(readOnly ? trainers.filter((t) => t.id === selectedTrainerId) : filteredTrainers).map((t) => (
              <li
                key={t.id}
                className={`${styles.trainerItem} ${
                  t.id === selectedTrainerId ? styles.trainerItemActive : ''
                } ${readOnly ? styles.trainerItemDisabled : ''}`}
                onClick={readOnly ? undefined : () => handleSelectTrainer(t.id)}
                style={readOnly ? { cursor: 'default' } : undefined}
              >
                <span className={styles.trainerName}>{t.name}</span>
                <span className={styles.trainerTier}>Tier {t.tier}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.footer}>
          {!readOnly && (
            <button
              type="button"
              className={styles.settingsButton}
              onClick={handleSettings}
            >
              <Settings size={16} />
              Settings
            </button>
          )}
          <button
            type="button"
            className={styles.signOutButton}
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
