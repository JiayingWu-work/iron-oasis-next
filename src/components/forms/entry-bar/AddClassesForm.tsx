'use client'

import { useState } from 'react'
import type { Client } from '@/types'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import styles from './entry-bar.module.css'

interface AddClassesFormProps {
  date: string
  onDateChange: (value: string) => void
  clients: Client[]
  onAddSessions: (date: string, clientIds: number[]) => void
}

export default function AddClassesForm({
  date,
  onDateChange,
  clients,
  onAddSessions,
}: AddClassesFormProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])

  const handleToggleClient = (id: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleSave = () => {
    if (selectedClientIds.length === 0) return
    onAddSessions(date, selectedClientIds)
    setSelectedClientIds([])
  }

  return (
    <section className={`${styles.section} ${styles.sectionFirst}`}>
      <h3 className={styles.title}>Add classes</h3>
      <div className={styles.fieldRow}>
        <DatePicker value={date} onChange={onDateChange} />
      </div>
      {clients.length === 0 ? (
        <p className={styles.hint}>No clients for this trainer yet.</p>
      ) : (
        <div className={styles.clientList}>
          {clients.map((client) => (
            <label key={client.id} className={styles.clientItem}>
              <input
                type="checkbox"
                checked={selectedClientIds.includes(client.id)}
                onChange={() => handleToggleClient(client.id)}
              />
              <span>{client.name}</span>
            </label>
          ))}
        </div>
      )}
      <button
        className={styles.primaryButton}
        onClick={handleSave}
        disabled={selectedClientIds.length === 0}
      >
        Save Classes
      </button>
    </section>
  )
}
