import type { Trainer } from '@/types'
import styles from './SideBar.module.css'

interface SideBarProps {
  trainers: Trainer[]
  selectedTrainerId: number | null
  onSelectTrainer: (id: number) => void
  onAddClient: () => void
  isOpen?: boolean // used for mobile drawer
  onClose?: () => void
}

export default function SideBar({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
  onAddClient,
  isOpen = true,
  onClose,
}: SideBarProps) {
  const handleSelectTrainer = (id: number) => {
    onSelectTrainer(id)
    onClose?.()
  }

  const handleAddClient = () => {
    onAddClient()
    onClose?.()
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
          <p className={styles.subtitle}>Class Tracker MVP</p>
        </div>
        <div>
          <h3 className={styles.sectionTitle}>Forms</h3>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleAddClient}
          >
            + Add new client
          </button>
          <button type="button" className={styles.actionButton} disabled>
            + Add new trainer
          </button>
        </div>
        <div>
          <h3 className={styles.sectionTitle}>Trainers</h3>
          <ul className={styles.trainerList}>
            {trainers.map((t) => (
              <li
                key={t.id}
                className={`${styles.trainerItem} ${
                  t.id === selectedTrainerId ? styles.trainerItemActive : ''
                }`}
                onClick={() => handleSelectTrainer(t.id)}
              >
                <span className={styles.trainerName}>{t.name}</span>
                <span className={styles.trainerTier}>Tier {t.tier}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  )
}
