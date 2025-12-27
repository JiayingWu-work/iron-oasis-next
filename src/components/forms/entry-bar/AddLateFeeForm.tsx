'use client'

import { useState, type FormEvent, useMemo } from 'react'
import type { Client } from '@/types'
import { formatDateToInput } from '@/lib/date'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import Select from '@/components/ui/Select/Select'
import styles from './entry-bar.module.css'

interface AddLateFeeFormProps {
  clients: Client[]
  onAddLateFee: (clientId: number, date: string) => void
  disabled?: boolean
  lateFeeAmount: number
}

export default function AddLateFeeForm({
  clients,
  onAddLateFee,
  disabled = false,
  lateFeeAmount,
}: AddLateFeeFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [date, setDate] = useState(formatDateToInput(new Date()))

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
          <Select
            value={clientId}
            onChange={(val) => setClientId(Number(val))}
            options={clientOptions}
            placeholder="Select client..."
            disabled={disabled}
          />
        </div>
        <div className={styles.fieldRow}>
          <DatePicker value={date} onChange={setDate} disabled={disabled} />
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
