'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import type { Trainer, TrainingMode, Location } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './AddClientForm.module.css'

interface AddClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientName: string) => void
  onError?: (message: string) => void
}

export default function AddClientForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddClientFormProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [primaryTrainerId, setPrimaryTrainerId] = useState<number | ''>('')
  const [secondaryTrainerId, setSecondaryTrainerId] = useState<number | ''>('')
  const [mode, setMode] = useState<TrainingMode>('1v1')
  const [location, setLocation] = useState<Location>('west')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ReactNode>(null)

  // Fetch trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/trainers')
      .then((res) => (res.ok ? res.json().then((d) => d.trainers || []) : []))
      .then((trainersData) => setTrainers(trainersData))
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setPrimaryTrainerId('')
      setSecondaryTrainerId('')
      setMode('1v1')
      setLocation('west')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a client name')
      return
    }

    // Validate name format for semi-private (1v2) - must contain "/"
    if (mode === '1v2' && !name.includes('/')) {
      setError(<>For 1v2 (semi-private), client name must include &quot;/&quot; to separate names, e.g. <strong>Alex Smith/Jamie Lee</strong></>)
      return
    }

    // Validate name format for shared package (2v2) - must contain "+"
    if (mode === '2v2' && !name.includes('+')) {
      setError(<>For 2v2 (shared package), client name must include &quot;+&quot; between names, e.g. <strong>Alex Smith+Jamie Lee</strong></>)
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
          location,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create client')
      }

      const created = await res.json()
      onClose()
      onSuccess?.(created.name)
    } catch {
      const errorMessage = 'Failed to create client. Please try again.'
      setError(errorMessage)
      onError?.(errorMessage)
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

  const locationOptions = useMemo(
    () => [
      { value: 'west', label: 'West (261 W 35th St)' },
      { value: 'east', label: 'East (321 E 22nd St)' },
    ],
    [],
  )

  const submitDisabled =
    !name.trim() ||
    !primaryTrainerId ||
    (mode === '2v2' && secondaryTrainerId === '')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Client"
      onSubmit={handleSubmit}
      submitLabel="Save Client"
      submitDisabled={submitDisabled}
      saving={saving}
      error={error}
    >
      <FormField
        label="Client name"
        hints={
          mode === '1v2'
            ? [<>For 1v2 clients, use name e.g. <strong>Alex Smith/Jamie Lee</strong></>]
            : mode === '2v2'
              ? [<>For 2v2 clients, use name e.g. <strong>Alex Smith+Jamie Lee</strong></>]
              : undefined
        }
      >
        <input
          className={styles.input}
          placeholder={
            mode === '1v2'
              ? 'e.g. Alex Smith/Jamie Lee'
              : mode === '2v2'
                ? 'e.g. Alex Smith+Jamie Lee'
                : 'e.g. Alex Smith'
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField label="Primary trainer (package owner)">
        {loading ? (
          <div className={styles.loading}>Loading trainers...</div>
        ) : (
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
        )}
      </FormField>

      <FormField label="Training mode">
        <Select
          value={mode}
          onChange={(val) => setMode(val as TrainingMode)}
          options={modeOptions}
        />
      </FormField>

      <FormField
        label="Location"
        hints={['Primary gym location for this client.']}
      >
        <Select
          value={location}
          onChange={(val) => setLocation(val as Location)}
          options={locationOptions}
        />
      </FormField>

      {mode === '2v2' && (
        <FormField
          label="Secondary trainer"
          hints={[
            'The secondary trainer shares this package and splits sessions with the primary trainer.',
          ]}
        >
          <Select
            value={secondaryTrainerId}
            onChange={(val) =>
              setSecondaryTrainerId(val === '' ? '' : Number(val))
            }
            options={secondaryTrainerOptions}
          />
        </FormField>
      )}
    </Modal>
  )
}
