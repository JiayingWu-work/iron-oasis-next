import type { Trainer } from '@/types'
import { authClient } from '@/lib/auth/client'
import styles from './SideBar.module.css'

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
  const { data: session } = authClient.useSession()
  const userName = session?.user?.name || 'User'

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
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
          <ul className={styles.trainerList}>
            {(readOnly ? trainers.filter((t) => t.id === selectedTrainerId) : trainers).map((t) => (
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
          <button
            type="button"
            className={styles.signOutButton}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
