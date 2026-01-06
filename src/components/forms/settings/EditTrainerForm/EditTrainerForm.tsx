'use client'

import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Trainer, Location } from '@/types'
import { Modal, FormField, Select } from '@/components'
import { INITIAL_INCOME_RATES, validateIncomeRates } from '@/lib/incomeRates'
import styles from './EditTrainerForm.module.css'

interface EditTrainerFormProps {
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

const MAX_TIERS = 6

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
  const [location, setLocation] = useState<Location>('west')
  const [incomeRates, setIncomeRates] = useState<RateTierInput[]>([])
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
      setLocation('west')
      setIncomeRates([])
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
      setLocation('west')
      setIncomeRates([])
      return
    }

    const trainer = trainers.find((t) => t.id === selectedTrainerId)
    if (trainer) {
      setName(trainer.name)
      setEmail(trainer.email)
      setTier(trainer.tier)
      setLocation(trainer.location ?? 'west')
      // Use trainer's income rates, or defaults if none exist
      const rates = trainer.incomeRates && trainer.incomeRates.length > 0
        ? trainer.incomeRates.map((r) => ({
            minClasses: r.minClasses,
            maxClasses: r.maxClasses,
            rate: r.rate,
          }))
        : INITIAL_INCOME_RATES.map((r) => ({ ...r }))
      setIncomeRates(rates)
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

    // Validate income rates - must cover 1 to infinity with no gaps
    const ratesError = validateIncomeRates(incomeRates)
    if (ratesError) {
      setError(ratesError)
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
          location,
          incomeRates,
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

  const locationOptions = useMemo(
    () => [
      { value: 'west', label: 'West (261 W 35th St)' },
      { value: 'east', label: 'East (321 E 22nd St)' },
    ],
    [],
  )

  // Only disable button if no trainer selected or name is empty
  const submitDisabled = selectedTrainerId === '' || !name.trim()

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

          <FormField label="Location">
            <Select
              value={location}
              onChange={(val) => setLocation(val as Location)}
              options={locationOptions}
            />
          </FormField>

          <FormField
            label="Pay Rates"
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
                          updated[idx].minClasses = val === '' ? 0 : (parseInt(val) || 0)
                          setIncomeRates(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...incomeRates]
                          const val = parseInt(e.target.value)
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
                          updated[idx].rate = val === '' ? 0 : (parseInt(val) || 0) / 100
                          setIncomeRates(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...incomeRates]
                          const val = parseInt(e.target.value)
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
