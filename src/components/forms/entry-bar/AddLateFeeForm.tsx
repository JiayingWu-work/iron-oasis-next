'use client'

import { useState, type FormEvent, useMemo } from 'react'
import type { Client } from '@/types'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import SearchableSelect from '@/components/ui/SearchableSelect/SearchableSelect'
import styles from './entry-bar.module.css'

interface AddLateFeeFormProps {
  clients: Client[]
  date: string
  onDateChange: (value: string) => void
  onAddLateFee: (clientId: number, date: string) => void
  disabled?: boolean
  lateFeeAmount: number
}

export default function AddLateFeeForm({
  clients,
  date,
  onDateChange,
  onAddLateFee,
  disabled = false,
  lateFeeAmount,
}: AddLateFeeFormProps) {
  const [clientId, setClientId] = useState<number>()

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId || !date) return
    onAddLateFee(clientId, date)
  }

  return (
    <section className={`${styles.section} ${disabled ? styles.sectionDisabled : ''}`}>
      <h3 className={styles.title}>Add ${lateFeeAmount} late fee</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <SearchableSelect
            value={clientId}
            onChange={(val) => setClientId(Number(val))}
            options={clientOptions}
            placeholder="Select client..."
            disabled={disabled}
          />
        </div>
        <div className={styles.fieldRow}>
          <DatePicker value={date} onChange={onDateChange} disabled={disabled} />
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={disabled || !clientId || !date}
        >
          Add late fee
        </button>
      </form>
    </section>
  )
}
