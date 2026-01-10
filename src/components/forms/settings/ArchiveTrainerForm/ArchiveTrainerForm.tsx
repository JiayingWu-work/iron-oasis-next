'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Trainer } from '@/types'
import { Modal, FormField, SearchableSelect } from '@/components'
import styles from './ArchiveTrainerForm.module.css'

interface ArchiveTrainerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trainerName: string) => void
  onError?: (message: string) => void
}

export default function ArchiveTrainerForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ArchiveTrainerFormProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/trainers?active=true')
      .then((res) => (res.ok ? res.json().then((d) => d.trainers || []) : []))
      .then((trainersData) => {
        setTrainers(trainersData)
      })
      .catch(() => {
        setTrainers([])
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTrainerId('')
      setError(null)
    }
  }, [isOpen])

  const selectedTrainer = useMemo(
    () => trainers.find((t) => t.id === selectedTrainerId),
    [trainers, selectedTrainerId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTrainerId === '') {
      setError('Please select a trainer')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/trainers/${selectedTrainerId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to archive trainer')
      }

      const result = await res.json()
      onClose()
      onSuccess?.(result.name)
    } catch {
      const errorMessage = 'Failed to archive trainer. Please try again.'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const trainerOptions = useMemo(
    () =>
      trainers.map((t) => ({
        value: t.id,
        label: `${t.name} (Tier ${t.tier})`,
      })),
    [trainers],
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Trainer"
      onSubmit={handleSubmit}
      submitLabel="Archive"
      submitDisabled={selectedTrainerId === ''}
      saving={saving}
      error={error}
    >
      <FormField label="Select trainer to archive">
        {loading ? (
          <div className={styles.loading}>Loading trainers...</div>
        ) : trainers.length === 0 ? (
          <div className={styles.empty}>No active trainers to archive</div>
        ) : (
          <SearchableSelect
            value={selectedTrainerId}
            onChange={(val) => setSelectedTrainerId(Number(val))}
            options={trainerOptions}
            placeholder="Choose a trainer..."
          />
        )}
      </FormField>

      {selectedTrainer && (
        <div className={styles.info}>
          <strong>{selectedTrainer.name}</strong> will be hidden from the
          trainers list and selection dropdowns. Historical session data will be
          preserved.
        </div>
      )}
    </Modal>
  )
}
