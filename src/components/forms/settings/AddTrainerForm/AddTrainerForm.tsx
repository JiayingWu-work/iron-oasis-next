'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Location } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './AddTrainerForm.module.css'

interface AddTrainerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trainerName: string) => void
  onError?: (message: string) => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AddTrainerForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddTrainerFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(1)
  const [location, setLocation] = useState<Location>('west')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setEmail('')
      setTier(1)
      setLocation('west')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a trainer name')
      return
    }
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address')
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
          email: email.trim().toLowerCase(),
          tier,
          location,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create trainer')
      }

      const created = await res.json()
      onClose()
      onSuccess?.(created.name)
    } catch {
      const errorMessage = 'Failed to create trainer. Please try again.'
      setError(errorMessage)
      onError?.(errorMessage)
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

  const locationOptions = useMemo(
    () => [
      { value: 'west', label: 'West (261 W 35th St)' },
      { value: 'east', label: 'East (321 E 22nd St)' },
    ],
    [],
  )

  const isFormValid = name.trim() && email.trim() && isValidEmail(email.trim())

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Trainer"
      onSubmit={handleSubmit}
      submitLabel="Save Trainer"
      submitDisabled={!isFormValid}
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

      <FormField
        label="Email"
        hints={['The trainer will use this email to sign up for the app.']}
      >
        <input
          className={styles.input}
          type="email"
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

      <FormField
        label="Location"
        hints={['Primary gym location for this trainer.']}
      >
        <Select
          value={location}
          onChange={(val) => setLocation(val as Location)}
          options={locationOptions}
        />
      </FormField>
    </Modal>
  )
}
