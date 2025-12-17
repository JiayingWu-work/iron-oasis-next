import { useState } from 'react'
import type { Client, Trainer, TrainingMode } from '@/types'
import styles from './fullpage-form.module.css'

interface AddClientFormProps {
  trainers: Trainer[]
  onCreated: (client: Client) => void
  onCancel: () => void
}

export default function AddClientForm({
  trainers,
  onCreated,
  onCancel,
}: AddClientFormProps) {
  const [name, setName] = useState('')
  const [primaryTrainerId, setPrimaryTrainerId] = useState<number | ''>('')
  const [secondaryTrainerId, setSecondaryTrainerId] = useState<number | ''>('')
  const [mode, setMode] = useState<TrainingMode>('1v1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a client name')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          trainerId: primaryTrainerId,
          secondaryTrainerId:
            secondaryTrainerId === '' ? null : secondaryTrainerId,
          mode,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create client')
      }

      const created = await res.json()

      const client: Client = {
        id: created.id,
        name: created.name,
        trainerId: created.trainerId,
        secondaryTrainerId: created.secondaryTrainerId ?? undefined,
        mode: created.mode ?? '1v1',
      }

      onCreated(client)
    } catch (err) {
      console.error(err)
      setError(
        'Failed to create client. Please try again! If issue persists, reach out to developer!',
      )
    } finally {
      setSaving(false)
    }
  }

  const secondaryOptions = trainers.filter((t) => t.id !== primaryTrainerId)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>Add new client</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>Client name</label>
              <input
                className={styles.input}
                placeholder="e.g. Angela Wang or Angela & Tom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <ul className={styles.hints}>
                <li>
                  For shared packages or 1v2 clients, use names like{' '}
                  <strong>Angela &amp; Tom</strong>.
                </li>
                <li>
                  For regular 1v1 or 1v2 clients, leave{' '}
                  <em>Secondary trainer</em> unselected.
                </li>
              </ul>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Primary trainer (package owner)
              </label>
              <select
                className={styles.select}
                value={primaryTrainerId}
                onChange={(e) => {
                  const newId = Number(e.target.value)
                  setPrimaryTrainerId(newId)
                  if (secondaryTrainerId === newId) setSecondaryTrainerId('')
                }}
              >
                <option value="">Select trainer...</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Tier {t.tier})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Training mode</label>
              <select
                className={styles.select}
                value={mode}
                onChange={(e) => setMode(e.target.value as TrainingMode)}
              >
                <option value="1v1">1v1 (private)</option>
                <option value="1v2">1v2 (semi-private)</option>
                <option value="2v2">2v2 (shared package)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Secondary trainer</label>
              <select
                className={styles.select}
                value={secondaryTrainerId}
                onChange={(e) =>
                  setSecondaryTrainerId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              >
                <option value="">None</option>
                {secondaryOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Tier {t.tier})
                  </option>
                ))}
              </select>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving || !name.trim() || !primaryTrainerId}
            >
              {saving ? 'Saving…' : 'Save client'}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
