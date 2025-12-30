import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Trainer, Location } from '@/types'
import { authClient } from '@/lib/auth/client'
import { LogOut, Settings, X } from 'lucide-react'
import styles from './SideBar.module.css'

type LocationFilter = Location | null

// Module-level caches to persist state across route navigations
let locationFilterCache: LocationFilter = null
let filteredTrainersCache: Trainer[] = []

// Export for testing - allows resetting the cache between tests
export function clearLocationFilterCache() {
  locationFilterCache = null
  filteredTrainersCache = []
}

interface SideBarProps {
  trainers: Trainer[]
  selectedTrainerId: number | null
  onSelectTrainer: (id: number) => void
  isOpen?: boolean
  onClose?: () => void
  readOnly?: boolean
}

export default function SideBar({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
  isOpen = true,
  onClose,
  readOnly = false,
}: SideBarProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userName = session?.user?.name || 'User'

  const selectedTrainer = useMemo(
    () => trainers.find((t) => t.id === selectedTrainerId),
    [trainers, selectedTrainerId],
  )

  // Track filter and last synced trainer ID to detect external navigation
  const [filterState, setFilterState] = useState<{
    filter: LocationFilter
    syncedTrainerId: number | null
  }>(() => {
    const trainer = trainers.find((t) => t.id === selectedTrainerId)
    const initialFilter = locationFilterCache ?? trainer?.location ?? 'west'
    return { filter: initialFilter, syncedTrainerId: selectedTrainerId }
  })

  // Derive effective filter - sync to trainer's location on external navigation
  const locationFilter = useMemo(() => {
    if (selectedTrainerId !== filterState.syncedTrainerId) {
      const trainer = selectedTrainer ?? trainers.find((t) => t.id === selectedTrainerId)
      if (trainer) return trainer.location
      return filterState.filter
    }
    return filterState.filter
  }, [selectedTrainerId, filterState, selectedTrainer, trainers])

  // Update location filter cache
  useEffect(() => {
    if (locationFilter !== null) {
      locationFilterCache = locationFilter
    }
  }, [locationFilter])

  const setLocationFilter = (newFilter: LocationFilter) => {
    if (newFilter !== null) {
      locationFilterCache = newFilter
    }
    setFilterState({ filter: newFilter, syncedTrainerId: selectedTrainerId })
  }

  // Filter trainers by location, using cache during loading to prevent flash
  const filteredTrainers = useMemo(() => {
    if (trainers.length === 0 && filteredTrainersCache.length > 0) {
      return filteredTrainersCache
    }
    if (locationFilter === null) return trainers
    return trainers.filter((t) => t.location === locationFilter)
  }, [trainers, locationFilter])

  // Update filtered trainers cache
  useEffect(() => {
    if (filteredTrainers.length > 0) {
      filteredTrainersCache = filteredTrainers
    }
  }, [filteredTrainers])

  const westCount = useMemo(
    () => trainers.filter((t) => t.location === 'west').length,
    [trainers],
  )
  const eastCount = useMemo(
    () => trainers.filter((t) => t.location === 'east').length,
    [trainers],
  )

  const handleSettings = () => {
    onClose?.()
    router.push('/settings')
  }

  const handleSelectTrainer = (id: number) => {
    onSelectTrainer(id)
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

  const displayedTrainers = readOnly
    ? trainers.filter((t) => t.id === selectedTrainerId)
    : filteredTrainers

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

        <div className={styles.trainersSection}>
          <h3 className={styles.sectionTitle}>
            {readOnly ? 'Trainer' : 'Trainers'}
          </h3>

          {!readOnly && (
            <div className={styles.locationTabs}>
              <button
                type="button"
                className={`${styles.locationTab} ${locationFilter === 'west' ? styles.locationTabActive : ''}`}
                onClick={() => setLocationFilter(locationFilter === 'west' ? null : 'west')}
              >
                West ({westCount})
              </button>
              <button
                type="button"
                className={`${styles.locationTab} ${locationFilter === 'east' ? styles.locationTabActive : ''}`}
                onClick={() => setLocationFilter(locationFilter === 'east' ? null : 'east')}
              >
                East ({eastCount})
              </button>
            </div>
          )}

          <ul className={styles.trainerList}>
            {displayedTrainers.map((t) => (
              <li
                key={t.id}
                className={`${styles.trainerItem} ${t.id === selectedTrainerId ? styles.trainerItemActive : ''} ${readOnly ? styles.trainerItemDisabled : ''}`}
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
