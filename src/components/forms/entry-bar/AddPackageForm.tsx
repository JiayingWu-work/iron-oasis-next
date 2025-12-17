'use client'

import { useState, type FormEvent, useMemo } from 'react'
import type { Client } from '@/types'
import { formatDateToInput } from '@/lib/date'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import Select from '@/components/ui/Select/Select'
import styles from './entry-bar.module.css'

interface AddPackageFormProps {
  clients: Client[]
  onAddPackage: (
    clientId: number,
    sessionsPurchased: number,
    startDate: string,
  ) => void
}

export default function AddPackageForm({
  clients,
  onAddPackage,
}: AddPackageFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [sessionsPurchased, setSessionsPurchased] = useState(0)
  const [startDate, setStartDate] = useState(formatDateToInput(new Date()))

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId || sessionsPurchased <= 0) return
    onAddPackage(clientId, sessionsPurchased, startDate)
    setSessionsPurchased(0)
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Add package</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <Select
            value={clientId}
            onChange={(val) => setClientId(Number(val))}
            options={clientOptions}
            placeholder="Select client..."
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
          />
        </div>
        <div className={styles.fieldRow}>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={!clientId || sessionsPurchased <= 0}
        >
          Add package
        </button>
      </form>
    </section>
  )
}
