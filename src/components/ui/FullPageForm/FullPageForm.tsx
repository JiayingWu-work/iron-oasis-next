'use client'

import type { ReactNode } from 'react'
import styles from './FullPageForm.module.css'

interface FullPageFormProps {
  title: string
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  submitDisabled?: boolean
  saving?: boolean
  error?: string | null
  children: ReactNode
}

export default function FullPageForm({
  title,
  onCancel,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  saving = false,
  error,
  children,
}: FullPageFormProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close"
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
        <h2 className={styles.title}>{title}</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.fields}>
            {children}
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving || submitDisabled}
            >
              {saving ? 'Saving…' : submitLabel}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Export styles for use in form fields (e.g., input styling)
export { styles as fullPageFormStyles }
