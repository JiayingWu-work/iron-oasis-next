'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Client, Trainer, TrainingMode, Location } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './EditClientForm.module.css'

interface EditClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientName: string) => void
  onError?: (message: string) => void
}

export default function EditClientForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditClientFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<TrainingMode>('1v1')
  const [originalMode, setOriginalMode] = useState<TrainingMode>('1v1')
  const [primaryTrainerId, setPrimaryTrainerId] = useState<number | ''>('')
  const [secondaryTrainerId, setSecondaryTrainerId] = useState<number | ''>('')
  const [location, setLocation] = useState<Location>('west')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients and trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    Promise.all([
      fetch('/api/clients').then((res) => (res.ok ? res.json() : [])),
      fetch('/api/trainers').then((res) =>
        res.ok ? res.json().then((d) => d.trainers || []) : [],
      ),
    ])
      .then(([clientsData, trainersData]) => {
        setClients(clientsData)
        setTrainers(trainersData)
      })
      .catch(() => {
        setClients([])
        setTrainers([])
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClientId('')
      setName('')
      setMode('1v1')
      setOriginalMode('1v1')
      setPrimaryTrainerId('')
      setSecondaryTrainerId('')
      setLocation('west')
      setError(null)
    }
  }, [isOpen])

  // Update form fields when client is selected
  useEffect(() => {
    if (selectedClientId === '') {
      setName('')
      setMode('1v1')
      setOriginalMode('1v1')
      setPrimaryTrainerId('')
      setSecondaryTrainerId('')
      setLocation('west')
      return
    }

    const client = clients.find((c) => c.id === selectedClientId)
    if (client) {
      setName(client.name)
      const clientMode = client.mode ?? '1v1'
      setMode(clientMode)
      setOriginalMode(clientMode)
      setPrimaryTrainerId(client.trainerId)
      setSecondaryTrainerId(client.secondaryTrainerId ?? '')
      setLocation(client.location ?? 'west')
    }
  }, [selectedClientId, clients])

  // Determine mode transition type
  const modeTransition = useMemo(() => {
    if (originalMode === mode) return null

    // 1v1 <-> 1v2 transitions
    if (
      (originalMode === '1v1' && mode === '1v2') ||
      (originalMode === '1v2' && mode === '1v1')
    ) {
      return 'name-change'
    }

    // 1v1 -> 2v2: need to add secondary trainer
    if (originalMode === '1v1' && mode === '2v2') {
      return 'add-secondary-trainer'
    }

    // 1v2 -> 2v2: need to add secondary trainer
    if (originalMode === '1v2' && mode === '2v2') {
      return 'add-secondary-trainer'
    }

    // 2v2 -> 1v1: need to remove secondary trainer, confirm primary
    if (originalMode === '2v2' && mode === '1v1') {
      return 'remove-secondary-trainer'
    }

    // 2v2 -> 1v2: need to remove secondary trainer, confirm primary
    if (originalMode === '2v2' && mode === '1v2') {
      return 'remove-secondary-trainer'
    }

    return null
  }, [originalMode, mode])

  // Get hints based on mode transition
  const nameHints = useMemo(() => {
    if (!modeTransition) return undefined

    if (originalMode === '1v1' && mode === '1v2') {
      return [
        'Update name to include both clients (e.g. <strong>Alex &amp; Jamie</strong>)',
        'Session pricing will be updated to semi-private rates',
      ]
    }

    if (originalMode === '1v2' && mode === '1v1') {
      return [
        'Update name to single client only (e.g. <strong>Alex Smith</strong>)',
        'Session pricing will be updated to private rates',
      ]
    }

    if (
      (originalMode === '1v1' || originalMode === '1v2') &&
      mode === '2v2'
    ) {
      return [
        'Update name to include both clients (e.g. <strong>Alex &amp; Jamie</strong>)',
        'Session pricing will be updated to shared package rates',
      ]
    }

    if (originalMode === '2v2' && (mode === '1v1' || mode === '1v2')) {
      const targetDesc = mode === '1v1' ? 'private' : 'semi-private'
      return [
        mode === '1v1'
          ? 'Update name to single client only (e.g. <strong>Alex Smith</strong>)'
          : 'Keep name with both clients (e.g. <strong>Alex &amp; Jamie</strong>)',
        `Session pricing will be updated to ${targetDesc} rates`,
      ]
    }

    return undefined
  }, [modeTransition, originalMode, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedClientId === '') {
      setError('Please select a client')
      return
    }

    if (!name.trim()) {
      setError('Please enter a client name')
      return
    }

    // Validate trainer selection for 2v2
    if (mode === '2v2') {
      if (!primaryTrainerId) {
        setError('Please select a primary trainer')
        return
      }
      if (!secondaryTrainerId) {
        setError('Please select a secondary trainer')
        return
      }
    }

    // Validate trainer selection when going from 2v2 to 1v1/1v2
    if (modeTransition === 'remove-secondary-trainer' && !primaryTrainerId) {
      setError('Please select a primary trainer')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: {
        name: string
        mode: TrainingMode
        location: Location
        trainerId?: number
        secondaryTrainerId?: number | null
      } = {
        name: name.trim(),
        mode,
        location,
      }

      // Include trainer changes if mode involves trainer updates
      if (modeTransition === 'add-secondary-trainer') {
        payload.trainerId = primaryTrainerId as number
        payload.secondaryTrainerId = secondaryTrainerId as number
      } else if (modeTransition === 'remove-secondary-trainer') {
        payload.trainerId = primaryTrainerId as number
        payload.secondaryTrainerId = null
      }

      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update client')
      }

      const updated = await res.json()
      onClose()
      onSuccess?.(updated.name)
    } catch (err) {
      const errorMessage = 'Failed to update client. Please try again.'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [clients],
  )

  const modeOptions = useMemo(
    () => [
      { value: '1v1', label: '1v1 (private)' },
      { value: '1v2', label: '1v2 (semi-private)' },
      { value: '2v2', label: '2v2 (shared package)' },
    ],
    [],
  )

  const primaryTrainerOptions = useMemo(
    () =>
      trainers.map((t) => ({
        value: t.id,
        label: `${t.name} (Tier ${t.tier})`,
      })),
    [trainers],
  )

  const secondaryTrainerOptions = useMemo(
    () =>
      trainers
        .filter((t) => t.id !== primaryTrainerId)
        .map((t) => ({
          value: t.id,
          label: `${t.name} (Tier ${t.tier})`,
        })),
    [trainers, primaryTrainerId],
  )

  const locationOptions = useMemo(
    () => [
      { value: 'west', label: 'West (261 W 35th St)' },
      { value: 'east', label: 'East (321 E 22nd St)' },
    ],
    [],
  )

  const submitDisabled =
    selectedClientId === '' ||
    !name.trim() ||
    (mode === '2v2' && (!primaryTrainerId || !secondaryTrainerId)) ||
    (modeTransition === 'remove-secondary-trainer' && !primaryTrainerId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client"
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submitDisabled={submitDisabled}
      saving={saving}
      error={error}
    >
      <FormField label="Select client">
        {loading ? (
          <div className={styles.loading}>Loading clients...</div>
        ) : (
          <Select
            value={selectedClientId}
            onChange={(val) => setSelectedClientId(Number(val))}
            options={clientOptions}
            placeholder="Choose a client..."
          />
        )}
      </FormField>

      {selectedClientId !== '' && (
        <>
          <FormField label="Client name" hints={nameHints}>
            <input
              className={styles.input}
              placeholder="e.g. Alex Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <FormField label="Training mode">
            <Select
              value={mode}
              onChange={(val) => setMode(val as TrainingMode)}
              options={modeOptions}
            />
          </FormField>

          <FormField label="Location">
            <Select
              value={location}
              onChange={(val) => setLocation(val as Location)}
              options={locationOptions}
            />
          </FormField>

          {/* Show trainer fields when transitioning to 2v2 */}
          {modeTransition === 'add-secondary-trainer' && (
            <>
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

              <FormField label="Secondary trainer">
                <Select
                  value={secondaryTrainerId}
                  onChange={(val) => setSecondaryTrainerId(Number(val))}
                  options={secondaryTrainerOptions}
                  placeholder="Select trainer..."
                />
              </FormField>
            </>
          )}

          {/* Show primary trainer field when transitioning from 2v2 */}
          {modeTransition === 'remove-secondary-trainer' && (
            <FormField
              label="Primary trainer"
              hints={['Secondary trainer will be removed from this client']}
            >
              <Select
                value={primaryTrainerId}
                onChange={(val) => setPrimaryTrainerId(Number(val))}
                options={primaryTrainerOptions}
                placeholder="Select trainer..."
              />
            </FormField>
          )}
        </>
      )}
    </Modal>
  )
}
