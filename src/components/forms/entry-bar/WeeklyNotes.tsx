import { useState, useEffect } from 'react'
import styles from './entry-bar.module.css'

interface WeeklyNotesProps {
  trainerId: number
  weekStart: string
  readOnly?: boolean
  externalNotes?: string
  onNotesChange?: (notes: string) => void
}

export default function WeeklyNotes({
  trainerId,
  weekStart,
  readOnly = false,
  externalNotes,
  onNotesChange,
}: WeeklyNotesProps) {
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Use external notes if provided (for read-only display synced with editor)
  const displayNotes = externalNotes !== undefined ? externalNotes : notes

  useEffect(() => {
    // Clear immediately when week/trainer changes
    setNotes('')
    setSavedNotes('')

    fetch(`/api/weekly-notes?trainerId=${trainerId}&weekStart=${weekStart}`)
      .then((res) => (res.ok ? res.json() : { notes: '' }))
      .then((data) => {
        const fetchedNotes = data.notes ?? ''
        setNotes(fetchedNotes)
        setSavedNotes(fetchedNotes)
        onNotesChange?.(fetchedNotes)
      })
      .catch(() => {
        setNotes('')
        setSavedNotes('')
        onNotesChange?.('')
      })
  }, [trainerId, weekStart, onNotesChange])

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
      onNotesChange?.(notes)
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = notes !== savedNotes

  // If read-only and no notes, don't show anything
  if (readOnly && !displayNotes.trim()) {
    return null
  }

  return (
    <section className={readOnly ? styles.weeklyNotesSection : styles.section}>
      <h3 className={readOnly ? styles.weeklyNotesLabel : styles.title}>
        Notes
      </h3>
      {readOnly ? (
        <div className={styles.weeklyNotesReadOnly}>{displayNotes}</div>
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
