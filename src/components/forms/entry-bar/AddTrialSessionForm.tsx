'use client'

import { type FormEvent } from 'react'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import styles from './entry-bar.module.css'

interface AddTrialSessionFormProps {
  date: string
  onDateChange: (value: string) => void
  onAddTrialSession: (date: string) => void
  disabled?: boolean
  trialSessionFee: number
}

export default function AddTrialSessionForm({
  date,
  onDateChange,
  onAddTrialSession,
  disabled = false,
  trialSessionFee,
}: AddTrialSessionFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!date) return
    onAddTrialSession(date)
  }

  return (
    <section className={`${styles.section} ${disabled ? styles.sectionDisabled : ''}`}>
      <h3 className={styles.title}>Add ${trialSessionFee} trial fee</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <DatePicker value={date} onChange={onDateChange} disabled={disabled} />
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={disabled || !date}
        >
          Add trial session
        </button>
      </form>
    </section>
  )
}
