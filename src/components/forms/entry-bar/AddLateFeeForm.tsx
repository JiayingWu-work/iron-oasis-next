import { useState, type FormEvent } from 'react'
import type { Client } from '@/types'
import { formatDateToInput } from '@/lib/date'
import styles from './entry-bar.module.css'

interface AddLateFeeFormProps {
  clients: Client[]
  onAddLateFee: (clientId: number, date: string) => void
}

export default function AddLateFeeForm({
  clients,
  onAddLateFee,
}: AddLateFeeFormProps) {
  const [clientId, setClientId] = useState<number>()
  const [date, setDate] = useState(formatDateToInput(new Date()))

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId || !date) return
    onAddLateFee(clientId, date)
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Add $45 late fee</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <select
            className={styles.select}
            value={clientId}
            onChange={(e) => setClientId(Number(e.target.value))}
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.fieldRow}>
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={!clientId || !date}
        >
          Add late fee
        </button>
      </form>
    </section>
  )
}
