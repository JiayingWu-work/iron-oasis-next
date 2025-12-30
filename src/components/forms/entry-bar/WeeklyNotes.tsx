import { useState, useEffect } from 'react'
import styles from './entry-bar.module.css'

interface WeeklyNotesProps {
  trainerId: number
  weekStart: string
  readOnly?: boolean
}

export default function WeeklyNotes({
  trainerId,
  weekStart,
  readOnly = false,
}: WeeklyNotesProps) {
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Clear immediately when week/trainer changes
    setNotes('')
    setSavedNotes('')

    fetch(`/api/weekly-notes?trainerId=${trainerId}&weekStart=${weekStart}`)
      .then((res) => (res.ok ? res.json() : { notes: '' }))
      .then((data) => {
        setNotes(data.notes ?? '')
        setSavedNotes(data.notes ?? '')
      })
      .catch(() => {
        setNotes('')
        setSavedNotes('')
      })
  }, [trainerId, weekStart])

  const handleSave = async () => {
    if (notes === savedNotes) return
    setIsSaving(true)
    try {
      await fetch('/api/weekly-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId, weekStart, notes }),
      })
      setSavedNotes(notes)
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = notes !== savedNotes

  // If read-only and no notes, don't show anything
  if (readOnly && !notes.trim()) {
    return null
  }

  return (
    <section className={readOnly ? styles.weeklyNotesSection : styles.section}>
      <h3 className={readOnly ? styles.weeklyNotesLabel : styles.title}>
        Notes
      </h3>
      {readOnly ? (
        <div className={styles.weeklyNotesReadOnly}>{notes}</div>
      ) : (
        <>
          <textarea
            className={styles.weeklyNotesTextarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this week..."
            rows={3}
          />
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save notes'}
          </button>
        </>
      )}
    </section>
  )
}
