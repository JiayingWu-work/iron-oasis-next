import styles from './dashboard-header.module.css'

interface DashboardHeaderProps {
  trainerName: string
  weekStart: string
  weekEnd: string
  onPrev: () => void
  onNext: () => void
}

export default function DashboardHeader({
  trainerName,
  weekStart,
  weekEnd,
  onPrev,
  onNext,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>Dashboard</h2>
        <p className={styles.subtitle}>
          Trainer: <strong>{trainerName}</strong> · Week {weekStart} → {weekEnd}
        </p>
      </div>
      <div className={styles.weekNav}>
        <button className={styles.weekBtn} onClick={onPrev}>
          <span className={styles.icon}>◀</span>
          <span className={styles.label}>Previous week</span>
        </button>
        <button className={styles.weekBtn} onClick={onNext}>
          <span className={styles.icon}>▶</span>
          <span className={styles.label}>Next week</span>
        </button>
      </div>
    </header>
  )
}
