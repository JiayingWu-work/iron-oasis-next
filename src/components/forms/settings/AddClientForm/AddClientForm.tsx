'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import type { Trainer, TrainingMode, Location } from '@/types'
import { Modal, FormField, Select, SearchableSelect } from '@/components'
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
  const [isPersonalClient, setIsPersonalClient] = useState(false)
  const [specialPricing, setSpecialPricing] = useState(false)
  const [customPrice1_12, setCustomPrice1_12] = useState('')
  const [customPrice13_20, setCustomPrice13_20] = useState('')
  const [customPrice21Plus, setCustomPrice21Plus] = useState('')
  const [customModePremium, setCustomModePremium] = useState('')

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
      setIsPersonalClient(false)
      setSpecialPricing(false)
      setCustomPrice1_12('')
      setCustomPrice13_20('')
      setCustomPrice21Plus('')
      setCustomModePremium('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a client name')
      return
    }

    // Validate name format for semi-private (1v2) - must contain " / "
    if (mode === '1v2' && !name.includes(' / ')) {
      setError(<>For 1v2 (semi-private), client name must include &quot; / &quot; to separate names, e.g. <strong>Alex Smith / Jamie Lee</strong></>)
      return
    }

    // Validate name format for shared package (2v2) - must contain " + "
    if (mode === '2v2' && !name.includes(' + ')) {
      setError(<>For 2v2 (shared package), client name must include &quot; + &quot; between names, e.g. <strong>Alex Smith + Jamie Lee</strong></>)
      return
    }

    // Validate special pricing fields if enabled
    if (specialPricing) {
      const p1 = parseFloat(customPrice1_12)
      const p2 = parseFloat(customPrice13_20)
      const p3 = parseFloat(customPrice21Plus)
      if (isNaN(p1) || isNaN(p2) || isNaN(p3) || p1 <= 0 || p2 <= 0 || p3 <= 0) {
        setError('Please enter valid prices for all three tiers')
        return
      }
    }

    // Validate mode premium for 1v2 mode if provided (only when special pricing is open)
    if (specialPricing && mode === '1v2' && customModePremium !== '') {
      const mp = parseFloat(customModePremium)
      if (isNaN(mp) || mp < 0) {
        setError('Please enter a valid semi-private premium amount')
        return
      }
    }

    setSaving(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        trainerId: primaryTrainerId,
        secondaryTrainerId:
          secondaryTrainerId === '' ? null : secondaryTrainerId,
        mode,
        location,
        isPersonalClient,
      }

      if (specialPricing) {
        payload.customPricing = {
          price1_12: parseFloat(customPrice1_12),
          price13_20: parseFloat(customPrice13_20),
          price21Plus: parseFloat(customPrice21Plus),
        }
      }

      // Include custom mode premium for 1v2 mode if provided (only when special pricing is open)
      if (specialPricing && mode === '1v2' && customModePremium !== '') {
        payload.customModePremium = parseFloat(customModePremium)
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const specialPricingValid =
    !specialPricing ||
    (customPrice1_12 !== '' &&
      customPrice13_20 !== '' &&
      customPrice21Plus !== '' &&
      !isNaN(parseFloat(customPrice1_12)) &&
      !isNaN(parseFloat(customPrice13_20)) &&
      !isNaN(parseFloat(customPrice21Plus)))

  const submitDisabled =
    !name.trim() ||
    !primaryTrainerId ||
    (mode === '2v2' && secondaryTrainerId === '') ||
    !specialPricingValid

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
            ? [<>For 1v2 clients, use name e.g. <strong>Alex Smith / Jamie Lee</strong></>]
            : mode === '2v2'
              ? [<>For 2v2 clients, use name e.g. <strong>Alex Smith + Jamie Lee</strong></>]
              : undefined
        }
      >
        <input
          className={styles.input}
          placeholder={
            mode === '1v2'
              ? 'e.g. Alex Smith / Jamie Lee'
              : mode === '2v2'
                ? 'e.g. Alex Smith + Jamie Lee'
                : 'e.g. Alex Smith'
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <div className={styles.checkboxRow}>
        <input
          type="checkbox"
          id="personalClient"
          className={styles.checkbox}
          data-custom-style
          checked={isPersonalClient}
          onChange={(e) => setIsPersonalClient(e.target.checked)}
        />
        <label htmlFor="personalClient" className={styles.checkboxLabel}>
          <span className={styles.checkboxLabelText}>Personal client</span>
          <span className={styles.checkboxHint}>This trainer brought in this client (+10% to their pay rate)</span>
        </label>
      </div>

      <FormField label="Primary trainer (package owner)">
        {loading ? (
          <div className={styles.loading}>Loading trainers...</div>
        ) : (
          <SearchableSelect
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
          <SearchableSelect
            value={secondaryTrainerId}
            onChange={(val) =>
              setSecondaryTrainerId(val === '' ? '' : Number(val))
            }
            options={secondaryTrainerOptions}
          />
        </FormField>
      )}

      <div className={styles.specialPricingSection}>
        <button
          type="button"
          className={styles.specialPricingToggle}
          onClick={() => setSpecialPricing(!specialPricing)}
        >
          {specialPricing ? '- Hide special package pricing' : '+ Special package pricing'}
        </button>

        {specialPricing && (
          <div className={styles.customPriceFields}>
            <p className={styles.customPriceHint}>
              Custom prices apply to all historical and future data. To preserve historical pricing, create a new client instead.
            </p>
            <div className={mode === '1v2' ? styles.priceRowFour : styles.priceRow}>
              <FormField label="1-12 sessions">
                <div className={styles.priceInputWrapper}>
                  <span className={styles.dollarSign}>$</span>
                  <input
                    type="number"
                    className={styles.priceInput}
                    placeholder="140"
                    value={customPrice1_12}
                    onChange={(e) => setCustomPrice1_12(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
              </FormField>
              <FormField label="13-20 sessions">
                <div className={styles.priceInputWrapper}>
                  <span className={styles.dollarSign}>$</span>
                  <input
                    type="number"
                    className={styles.priceInput}
                    placeholder="130"
                    value={customPrice13_20}
                    onChange={(e) => setCustomPrice13_20(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
              </FormField>
              <FormField label="21+ sessions">
                <div className={styles.priceInputWrapper}>
                  <span className={styles.dollarSign}>$</span>
                  <input
                    type="number"
                    className={styles.priceInput}
                    placeholder="120"
                    value={customPrice21Plus}
                    onChange={(e) => setCustomPrice21Plus(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
              </FormField>
              {mode === '1v2' && (
                <FormField label="Premium">
                  <div className={styles.priceInputWrapper}>
                    <span className={styles.dollarSign}>$</span>
                    <input
                      type="number"
                      className={styles.priceInput}
                      placeholder="20"
                      value={customModePremium}
                      onChange={(e) => setCustomModePremium(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                </FormField>
              )}
            </div>
            {mode === '1v2' && (
              <p className={styles.premiumHint}>
                Extra amount charged per session for semi-private training. Default is $20.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
