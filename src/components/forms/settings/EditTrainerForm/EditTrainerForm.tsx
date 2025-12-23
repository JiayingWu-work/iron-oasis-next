'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Trainer } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './EditTrainerForm.module.css'

interface EditTrainerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trainerName: string) => void
  onError?: (message: string) => void
}

export default function EditTrainerForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditTrainerFormProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/trainers')
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
      setName('')
      setEmail('')
      setTier(1)
      setError(null)
    }
  }, [isOpen])

  // Get the original tier of the selected trainer
  const originalTier = useMemo(() => {
    if (selectedTrainerId === '') return null
    const trainer = trainers.find((t) => t.id === selectedTrainerId)
    return trainer?.tier ?? null
  }, [selectedTrainerId, trainers])

  // Update form fields when trainer is selected
  useEffect(() => {
    if (selectedTrainerId === '') {
      setName('')
      setEmail('')
      setTier(1)
      return
    }

    const trainer = trainers.find((t) => t.id === selectedTrainerId)
    if (trainer) {
      setName(trainer.name)
      setEmail(trainer.email)
      setTier(trainer.tier)
    }
  }, [selectedTrainerId, trainers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTrainerId === '') {
      setError('Please select a trainer')
      return
    }

    if (!name.trim()) {
      setError('Please enter a trainer name')
      return
    }

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/trainers/${selectedTrainerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          tier,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update trainer')
      }

      const updated = await res.json()
      onClose()
      onSuccess?.(updated.name)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update trainer. Please try again.'
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

  const tierOptions = useMemo(
    () => [
      { value: 1, label: 'Tier 1' },
      { value: 2, label: 'Tier 2' },
      { value: 3, label: 'Tier 3' },
    ],
    [],
  )

  const submitDisabled = selectedTrainerId === '' || !name.trim() || !email.trim()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trainer"
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submitDisabled={submitDisabled}
      saving={saving}
      error={error}
    >
      <FormField label="Select trainer">
        {loading ? (
          <div className={styles.loading}>Loading trainers...</div>
        ) : (
          <Select
            value={selectedTrainerId}
            onChange={(val) => setSelectedTrainerId(Number(val))}
            options={trainerOptions}
            placeholder="Choose a trainer..."
          />
        )}
      </FormField>

      {selectedTrainerId !== '' && (
        <>
          <FormField label="Trainer name">
            <input
              className={styles.input}
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className={styles.input}
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField label="Tier">
            <Select
              value={tier}
              onChange={(val) => setTier(Number(val) as 1 | 2 | 3)}
              options={tierOptions}
            />
          </FormField>

          {originalTier !== null && tier !== originalTier && (
            <div className={styles.info}>
              <strong>Existing clients:</strong> Existing clients will keep
              their original pricing, even for future packages.
              <br />
              <strong>New clients:</strong> New clients will be charged the{' '}
              {tier > originalTier ? 'higher' : 'lower'} Tier {tier} rate.
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
