import type { ReactNode } from 'react'
import styles from './SettingsCard.module.css'

interface SettingsCardProps {
  title: string
  description: string
  icon: ReactNode
  badge?: string
}

export default function SettingsCard({
  title,
  description,
  icon,
  badge,
}: SettingsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  )
}
