'use client'

import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Location } from '@/types'
import { Modal, FormField, Select } from '@/components'
import { INITIAL_INCOME_RATES, validateIncomeRates } from '@/lib/incomeRates'
import styles from './AddTrainerForm.module.css'

interface AddTrainerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trainerName: string) => void
  onError?: (message: string) => void
}

interface RateTierInput {
  minClasses: number
  maxClasses: number | null
  rate: number
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const MAX_TIERS = 6

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
  const [incomeRates, setIncomeRates] = useState<RateTierInput[]>(
    INITIAL_INCOME_RATES.map((r) => ({ ...r })),
  )

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setEmail('')
      setTier(1)
      setLocation('west')
      setError(null)
      setIncomeRates(INITIAL_INCOME_RATES.map((r) => ({ ...r })))
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

    // Validate income rates - must cover 1 to infinity with no gaps
    const ratesError = validateIncomeRates(incomeRates)
    if (ratesError) {
      setError(ratesError)
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
          incomeRates,
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

  // Check if all form fields are valid
  const ratesValid = validateIncomeRates(incomeRates) === null
  const isFormValid = name.trim() && email.trim() && isValidEmail(email.trim()) && ratesValid

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

      <FormField
        label="Pay Rate Tiers"
        hints={['Configure income rates based on weekly class count.']}
      >
        <div className={styles.rateTiers}>
          {incomeRates.map((rateTier, idx) => (
            <div key={idx} className={styles.rateTierCard}>
              <span className={styles.rateTierNumber}>{idx + 1}</span>
              <div className={styles.rateTierFields}>
                <div className={styles.rateTierGroup}>
                  <span className={styles.rateTierLabel}>Classes</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.rateInput}
                    value={rateTier.minClasses || ''}
                    onChange={(e) => {
                      const updated = [...incomeRates]
                      const val = e.target.value
                      // Allow empty string while typing, store as 0 temporarily
                      updated[idx].minClasses = val === '' ? 0 : (parseInt(val) || 0)
                      setIncomeRates(updated)
                    }}
                    onBlur={(e) => {
                      const updated = [...incomeRates]
                      const val = parseInt(e.target.value)
                      // Default to 1 if empty or invalid on blur
                      updated[idx].minClasses = val > 0 ? val : 1
                      setIncomeRates(updated)
                    }}
                  />
                  <span className={styles.rateDash}>–</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.rateInput}
                    value={rateTier.maxClasses ?? ''}
                    onChange={(e) => {
                      const updated = [...incomeRates]
                      const val = e.target.value
                      updated[idx].maxClasses = val === '' ? null : (parseInt(val) || null)
                      setIncomeRates(updated)
                    }}
                    placeholder="∞"
                  />
                </div>
                <div className={styles.rateTierGroup}>
                  <span className={styles.rateTierLabel}>Rate</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`${styles.rateInput} ${styles.rateInputWide}`}
                    value={rateTier.rate === 0 ? '' : Math.round(rateTier.rate * 100)}
                    onChange={(e) => {
                      const updated = [...incomeRates]
                      const val = e.target.value
                      // Allow empty string while typing
                      updated[idx].rate = val === '' ? 0 : (parseInt(val) || 0) / 100
                      setIncomeRates(updated)
                    }}
                    onBlur={(e) => {
                      const updated = [...incomeRates]
                      const val = parseInt(e.target.value)
                      // Default to 50% if empty or invalid on blur
                      updated[idx].rate = val > 0 ? Math.min(val, 100) / 100 : 0.50
                      setIncomeRates(updated)
                    }}
                  />
                  <span className={styles.ratePercent}>%</span>
                </div>
              </div>
              {incomeRates.length > 1 && (
                <button
                  type="button"
                  className={styles.removeTierButton}
                  onClick={() => {
                    setIncomeRates(incomeRates.filter((_, i) => i !== idx))
                  }}
                  aria-label="Remove tier"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {incomeRates.length < MAX_TIERS && (
            <button
              type="button"
              className={styles.addTierButton}
              onClick={() => {
                const lastTier = incomeRates[incomeRates.length - 1]
                const newMin = (lastTier?.maxClasses ?? lastTier?.minClasses ?? 0) + 1
                setIncomeRates([
                  ...incomeRates,
                  { minClasses: newMin, maxClasses: null, rate: 0.50 },
                ])
              }}
            >
              + Add Threshold
            </button>
          )}
        </div>
      </FormField>
    </Modal>
  )
}
