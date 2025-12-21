import type { ReactNode } from 'react'
import styles from './SettingsCard.module.css'

interface SettingsCardProps {
  title: string
  description: string
  icon: ReactNode
  badge?: string
  onClick?: () => void
}

export default function SettingsCard({
  title,
  description,
  icon,
  badge,
  onClick,
}: SettingsCardProps) {
  const isClickable = !!onClick && !badge

  return (
    <div
      className={`${styles.card} ${isClickable ? styles.clickable : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  )
}
