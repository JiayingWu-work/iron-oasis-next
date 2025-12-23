'use client'

import { useState, useMemo } from 'react'
import type { Client, Trainer, TrainingMode } from '@/types'
import Select from '@/components/ui/Select/Select'
import FormField from '@/components/ui/FormField/FormField'
import FullPageForm, {
  fullPageFormStyles as styles,
} from '@/components/ui/FullPageForm/FullPageForm'

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
        tierAtSignup: created.tierAtSignup,
        price1_12: created.price1_12,
        price13_20: created.price13_20,
        price21Plus: created.price21Plus,
        modePremium: created.modePremium,
        createdAt: created.createdAt,
      }

      onCreated(client)
    } catch (err) {
      console.error(err)
      setError(
        'Failed to create client. Please try again. If issue persists, reach out to developer!',
      )
    } finally {
      setSaving(false)
    }
  }

  const primaryTrainerOptions = useMemo(
    () =>
      trainers.map((t) => ({
        value: t.id,
        label: `${t.name} (Tier ${t.tier})`,
      })),
    [trainers],
  )

  const secondaryTrainerOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...trainers
        .filter((t) => t.id !== primaryTrainerId)
        .map((t) => ({
          value: t.id,
          label: `${t.name} (Tier ${t.tier})`,
        })),
    ],
    [trainers, primaryTrainerId],
  )

  const modeOptions = useMemo(
    () => [
      { value: '1v1', label: '1v1 (private)' },
      { value: '1v2', label: '1v2 (semi-private)' },
      { value: '2v2', label: '2v2 (shared package)' },
    ],
    [],
  )

  const submitDisabled =
    !name.trim() ||
    !primaryTrainerId ||
    (mode === '2v2' && secondaryTrainerId === '')

  return (
    <FullPageForm
      title="Add new client"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save client"
      submitDisabled={submitDisabled}
      saving={saving}
      error={error}
    >
      <FormField
        label="Client name"
        hints={[
          'For shared packages or 1v2 clients, use names like <strong>Angela &amp; Tom</strong>.',
          'For regular 1v1 or 1v2 clients, leave <em>Secondary trainer</em> unselected.',
        ]}
      >
        <input
          className={styles.input}
          placeholder="e.g. Angela Wang or Angela & Tom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField label="Primary trainer (package owner)">
        <Select
          value={primaryTrainerId}
          onChange={(val) => {
            const newId = Number(val)
            setPrimaryTrainerId(newId)
            if (secondaryTrainerId === newId) setSecondaryTrainerId('')
          }}
          options={primaryTrainerOptions}
          placeholder="Select trainer..."
        />
      </FormField>

      <FormField label="Training mode">
        <Select
          value={mode}
          onChange={(val) => setMode(val as TrainingMode)}
          options={modeOptions}
        />
      </FormField>

      <FormField label="Secondary trainer">
        <Select
          value={secondaryTrainerId}
          onChange={(val) =>
            setSecondaryTrainerId(val === '' ? '' : Number(val))
          }
          options={secondaryTrainerOptions}
        />
      </FormField>
    </FullPageForm>
  )
}
