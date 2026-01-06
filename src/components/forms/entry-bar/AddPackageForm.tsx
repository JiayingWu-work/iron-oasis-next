'use client'

import { useState, type FormEvent, useMemo } from 'react'
import type { Client } from '@/types'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import Select from '@/components/ui/Select/Select'
import styles from './entry-bar.module.css'

interface AddPackageFormProps {
  clients: Client[]
  date: string
  onDateChange: (value: string) => void
  onAddPackage: (
    clientId: number,
    sessionsPurchased: number,
    startDate: string,
  ) => void
  disabled?: boolean
}

export default function AddPackageForm({
  clients,
  date,
  onDateChange,
  onAddPackage,
  disabled = false,
}: AddPackageFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [sessionsPurchased, setSessionsPurchased] = useState(0)

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId || sessionsPurchased <= 0) return
    onAddPackage(clientId, sessionsPurchased, date)
    setSessionsPurchased(0)
  }

  return (
    <section className={`${styles.section} ${disabled ? styles.sectionDisabled : ''}`}>
      <h3 className={styles.title}>Add package</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <Select
            value={clientId}
            onChange={(val) => setClientId(Number(val))}
            options={clientOptions}
            placeholder="Select client..."
            disabled={disabled}
          />
        </div>
        <div className={styles.fieldRow}>
          <input
            type="number"
            className={styles.input}
            value={sessionsPurchased === 0 ? '' : sessionsPurchased}
            onChange={(e) => {
              const raw = e.target.value
              const num = Number(raw)
              if (Number.isNaN(num)) {
                setSessionsPurchased(0)
                return
              }
              setSessionsPurchased(num)
            }}
            placeholder="Number of sessions (e.g. 14)"
            disabled={disabled}
          />
        </div>
        <div className={styles.fieldRow}>
          <DatePicker value={date} onChange={onDateChange} disabled={disabled} />
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={disabled || !clientId || sessionsPurchased <= 0}
        >
          Add package
        </button>
      </form>
    </section>
  )
}
