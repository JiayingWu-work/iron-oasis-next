'use client'

import { useState, useMemo } from 'react'
import type { Client, Location } from '@/types'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import Select from '@/components/ui/Select/Select'
import styles from './entry-bar.module.css'

interface AddClassesFormProps {
  date: string
  onDateChange: (value: string) => void
  clients: Client[]
  onAddSessions: (
    date: string,
    clientIds: number[],
    locationOverride?: Location,
  ) => void
  disabled?: boolean
}

export default function AddClassesForm({
  date,
  onDateChange,
  clients,
  onAddSessions,
  disabled = false,
}: AddClassesFormProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
  const [overrideLocation, setOverrideLocation] = useState(false)
  const [locationOverride, setLocationOverride] = useState<Location>('west')

  const locationOptions = useMemo(
    () => [
      { value: 'west', label: 'West (261 W 35th St)' },
      { value: 'east', label: 'East (321 E 22nd St)' },
    ],
    [],
  )

  const handleToggleClient = (id: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleSave = () => {
    if (selectedClientIds.length === 0) return
    onAddSessions(
      date,
      selectedClientIds,
      overrideLocation ? locationOverride : undefined,
    )
    setSelectedClientIds([])
    setOverrideLocation(false)
  }

  return (
    <section
      className={`${styles.section} ${styles.sectionFirst} ${
        disabled ? styles.sectionDisabled : ''
      }`}
    >
      <h3 className={styles.title}>Add classes</h3>
      <div className={styles.fieldRow}>
        <DatePicker value={date} onChange={onDateChange} disabled={disabled} />
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
                disabled={disabled}
              />
              <span>{client.name}</span>
            </label>
          ))}
        </div>
      )}
      <div className={styles.locationOverrideRow}>
        <button
          type="button"
          className={`${styles.locationToggle} ${
            overrideLocation ? styles.locationToggleActive : ''
          }`}
          onClick={() => setOverrideLocation(!overrideLocation)}
          disabled={disabled}
        >
          Different location?
        </button>
        {overrideLocation && (
          <Select
            value={locationOverride}
            onChange={(val) => setLocationOverride(val as Location)}
            options={locationOptions}
            disabled={disabled}
          />
        )}
      </div>
      <button
        className={styles.primaryButton}
        onClick={handleSave}
        disabled={disabled || selectedClientIds.length === 0}
      >
        Save classes
      </button>
    </section>
  )
}
