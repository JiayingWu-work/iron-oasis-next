'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Trainer } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './UnarchiveTrainerForm.module.css'

interface UnarchiveTrainerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trainerName: string) => void
  onError?: (message: string) => void
}

export default function UnarchiveTrainerForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: UnarchiveTrainerFormProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch archived trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/trainers')
      .then((res) => (res.ok ? res.json().then((d) => d.trainers || []) : []))
      .then((trainersData: Trainer[]) => {
        // Filter to only show archived (inactive) trainers
        const archivedTrainers = trainersData.filter((t) => t.isActive === false)
        setTrainers(archivedTrainers)
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
        body: JSON.stringify({ isActive: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to unarchive trainer')
      }

      const result = await res.json()
      onClose()
      onSuccess?.(result.name)
    } catch {
      const errorMessage = 'Failed to unarchive trainer. Please try again.'
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
      title="Unarchive Trainer"
      onSubmit={handleSubmit}
      submitLabel="Unarchive"
      submitDisabled={selectedTrainerId === ''}
      saving={saving}
      error={error}
    >
      <FormField label="Select trainer to unarchive">
        {loading ? (
          <div className={styles.loading}>Loading trainers...</div>
        ) : trainers.length === 0 ? (
          <div className={styles.empty}>No archived trainers to restore</div>
        ) : (
          <Select
            value={selectedTrainerId}
            onChange={(val) => setSelectedTrainerId(Number(val))}
            options={trainerOptions}
            placeholder="Choose a trainer..."
          />
        )}
      </FormField>

      {selectedTrainer && (
        <div className={styles.info}>
          <strong>{selectedTrainer.name}</strong> will be restored and appear in
          the trainers list and selection dropdowns.
        </div>
      )}
    </Modal>
  )
}
