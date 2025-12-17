'use client'

import { useState, useMemo } from 'react'
import type { Trainer } from '@/types'
import Select from '@/components/ui/Select/Select'
import FormField from '@/components/ui/FormField/FormField'
import FullPageForm, {
  fullPageFormStyles as styles,
} from '@/components/ui/FullPageForm/FullPageForm'

interface AddTrainerFormProps {
  onCreated: (trainer: Trainer) => void
  onCancel: () => void
}

export default function AddTrainerForm({
  onCreated,
  onCancel,
}: AddTrainerFormProps) {
  const [name, setName] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a trainer name')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tier,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create trainer')
      }

      const created = await res.json()

      const trainer: Trainer = {
        id: created.id,
        name: created.name,
        tier: created.tier,
      }

      onCreated(trainer)
    } catch (err) {
      console.error(err)
      setError(
        'Failed to create trainer. Please try again! If issue persists, reach out to developer!',
      )
    } finally {
      setSaving(false)
    }
  }

  const tierOptions = useMemo(
    () => [
      { value: 1, label: 'Tier 1' },
      { value: 2, label: 'Tier 2' },
      { value: 3, label: 'Tier 3' },
    ],
    [],
  )

  return (
    <FullPageForm
      title="Add new trainer"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save trainer"
      submitDisabled={!name.trim()}
      saving={saving}
      error={error}
    >
      <FormField label="Trainer name">
        <input
          className={styles.input}
          placeholder="e.g. John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField label="Tier" hints={["Tier determines the trainer's pay rate."]}>
        <Select
          value={tier}
          onChange={(val) => setTier(Number(val) as 1 | 2 | 3)}
          options={tierOptions}
        />
      </FormField>
    </FullPageForm>
  )
}
