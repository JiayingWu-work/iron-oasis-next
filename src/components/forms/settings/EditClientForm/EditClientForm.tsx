'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import type { Client, Trainer, TrainingMode, Location } from '@/types'
import { Modal, FormField, Select, SearchableSelect } from '@/components'
import styles from './EditClientForm.module.css'

interface PricingRow {
  tier: number
  sessions_min: number
  price: number
}

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
  const [pricingData, setPricingData] = useState<PricingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<TrainingMode>('1v1')
  const [originalMode, setOriginalMode] = useState<TrainingMode>('1v1')
  const [primaryTrainerId, setPrimaryTrainerId] = useState<number | ''>('')
  const [originalTrainerId, setOriginalTrainerId] = useState<number | ''>('')
  const [secondaryTrainerId, setSecondaryTrainerId] = useState<number | ''>('')
  const [location, setLocation] = useState<Location>('west')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ReactNode>(null)
  // Personal client state
  const [isPersonalClient, setIsPersonalClient] = useState(false)
  // Special pricing state
  const [specialPricing, setSpecialPricing] = useState(false)
  const [customPrice1_12, setCustomPrice1_12] = useState('')
  const [customPrice13_20, setCustomPrice13_20] = useState('')
  const [customPrice21Plus, setCustomPrice21Plus] = useState('')
  const [customModePremium, setCustomModePremium] = useState('')

  // Fetch clients, trainers, and pricing when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    Promise.all([
      fetch('/api/clients').then((res) => (res.ok ? res.json() : [])),
      fetch('/api/trainers').then((res) =>
        res.ok ? res.json().then((d) => d.trainers || []) : [],
      ),
      fetch('/api/pricing').then((res) =>
        res.ok ? res.json().then((d) => d.pricing || []) : [],
      ),
    ])
      .then(([clientsData, trainersData, pricing]) => {
        setClients(clientsData)
        setTrainers(trainersData)
        setPricingData(pricing)
      })
      .catch(() => {
        setClients([])
        setTrainers([])
        setPricingData([])
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
      setOriginalTrainerId('')
      setSecondaryTrainerId('')
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

  // Update form fields when client is selected
  useEffect(() => {
    if (selectedClientId === '') {
      setName('')
      setMode('1v1')
      setOriginalMode('1v1')
      setPrimaryTrainerId('')
      setOriginalTrainerId('')
      setSecondaryTrainerId('')
      setLocation('west')
      setIsPersonalClient(false)
      setSpecialPricing(false)
      setCustomPrice1_12('')
      setCustomPrice13_20('')
      setCustomPrice21Plus('')
      setCustomModePremium('')
      return
    }

    const client = clients.find((c) => c.id === selectedClientId)
    if (client) {
      setName(client.name)
      const clientMode = client.mode ?? '1v1'
      setMode(clientMode)
      setOriginalMode(clientMode)
      setPrimaryTrainerId(client.trainerId)
      setOriginalTrainerId(client.trainerId)
      setSecondaryTrainerId(client.secondaryTrainerId ?? '')
      setLocation(client.location ?? 'west')
      setIsPersonalClient(client.isPersonalClient ?? false)

      // Pre-populate pricing fields with client's current prices
      if (client.price1_12 !== undefined) {
        setCustomPrice1_12(String(client.price1_12))
        setCustomPrice13_20(String(client.price13_20))
        setCustomPrice21Plus(String(client.price21Plus))
      }

      // Pre-populate mode premium for 1v2 clients
      if (client.modePremium !== undefined) {
        setCustomModePremium(String(client.modePremium))
      }
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
        <>
          For 1v2 clients, use name e.g. <strong>Alex Smith / Jamie Lee</strong>
        </>,
        'Session pricing will be updated to semi-private rates',
      ]
    }

    if (originalMode === '1v2' && mode === '1v1') {
      return [
        <>
          Update name to single client, e.g. <strong>Alex Smith</strong>
        </>,
        'Session pricing will be updated to private rates',
      ]
    }

    if ((originalMode === '1v1' || originalMode === '1v2') && mode === '2v2') {
      return [
        <>For 2v2 clients, use name e.g. <strong>Alex Smith + Jamie Lee</strong></>,
        'Session pricing will be updated to shared package rates',
      ]
    }

    if (originalMode === '2v2' && (mode === '1v1' || mode === '1v2')) {
      const targetDesc = mode === '1v1' ? 'private' : 'semi-private'
      return [
        mode === '1v1'
          ? <>Update name to single client, e.g. <strong>Alex Smith</strong></>
          : <>For 1v2 clients, use name e.g. <strong>Alex Smith / Jamie Lee</strong></>,
        `Session pricing will be updated to ${targetDesc} rates`,
      ]
    }

    return undefined
  }, [modeTransition, originalMode, mode])

  // Get selected client
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  )

  // Get current/original trainer info
  const currentTrainer = useMemo(
    () => trainers.find((t) => t.id === originalTrainerId),
    [trainers, originalTrainerId],
  )

  // Get new trainer info when transferring
  const newTrainer = useMemo(
    () => trainers.find((t) => t.id === primaryTrainerId),
    [trainers, primaryTrainerId],
  )

  // Check if this is a trainer transfer (non-2v2 clients only)
  const isTrainerTransfer = useMemo(() => {
    if (!originalTrainerId || !primaryTrainerId) return false
    if (mode === '2v2') return false
    return originalTrainerId !== primaryTrainerId
  }, [originalTrainerId, primaryTrainerId, mode])

  // Check if client has custom pricing (different from their tier's default)
  const hasCustomPricing = useMemo(() => {
    if (!selectedClient || !currentTrainer || pricingData.length === 0) return false

    const tierPrices = pricingData.filter((p) => p.tier === currentTrainer.tier)
    if (tierPrices.length === 0) return false

    // Get tier-based prices for comparison
    const tier1_12 = tierPrices.find((p) => p.sessions_min === 1)?.price
    const tier13_20 = tierPrices.find((p) => p.sessions_min === 13)?.price
    const tier21Plus = tierPrices.find((p) => p.sessions_min === 21)?.price

    // Compare client's prices with tier-based prices
    return (
      selectedClient.price1_12 !== tier1_12 ||
      selectedClient.price13_20 !== tier13_20 ||
      selectedClient.price21Plus !== tier21Plus
    )
  }, [selectedClient, currentTrainer, pricingData])

  // Auto-open special pricing when mode changes and client has custom pricing
  useEffect(() => {
    if (modeTransition && hasCustomPricing) {
      setSpecialPricing(true)
    }
  }, [modeTransition, hasCustomPricing])

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

    // Validate name format for private (1v1) - must NOT contain " / " or " + "
    if (mode === '1v1' && (name.includes(' / ') || name.includes(' + '))) {
      setError(<>For 1v1 (private), client name must be a single person without &quot; / &quot; or &quot; + &quot;, e.g. <strong>Alex Smith</strong></>)
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
      const payload: {
        name: string
        mode: TrainingMode
        location: Location
        trainerId?: number
        secondaryTrainerId?: number | null
        isPersonalClient: boolean
        customPricing?: {
          price1_12: number
          price13_20: number
          price21Plus: number
        }
        customModePremium?: number
      } = {
        name: name.trim(),
        mode,
        location,
        isPersonalClient,
      }

      // Include trainer changes if mode involves trainer updates or transfer
      if (modeTransition === 'add-secondary-trainer') {
        payload.trainerId = primaryTrainerId as number
        payload.secondaryTrainerId = secondaryTrainerId as number
      } else if (modeTransition === 'remove-secondary-trainer') {
        payload.trainerId = primaryTrainerId as number
        payload.secondaryTrainerId = null
      } else if (isTrainerTransfer) {
        // Trainer transfer for non-2v2 clients
        payload.trainerId = primaryTrainerId as number
      }

      // Include custom pricing if user enabled it
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
    } catch {
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

  const specialPricingValid =
    !specialPricing ||
    (customPrice1_12 !== '' &&
      customPrice13_20 !== '' &&
      customPrice21Plus !== '' &&
      !isNaN(parseFloat(customPrice1_12)) &&
      !isNaN(parseFloat(customPrice13_20)) &&
      !isNaN(parseFloat(customPrice21Plus)))

  const submitDisabled =
    selectedClientId === '' ||
    !name.trim() ||
    (mode === '2v2' && (!primaryTrainerId || !secondaryTrainerId)) ||
    (modeTransition === 'remove-secondary-trainer' && !primaryTrainerId) ||
    !specialPricingValid

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
          <SearchableSelect
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

          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="editPersonalClient"
              className={styles.checkbox}
              data-custom-style
              checked={isPersonalClient}
              onChange={(e) => setIsPersonalClient(e.target.checked)}
            />
            <label htmlFor="editPersonalClient" className={styles.checkboxLabel}>
              <span className={styles.checkboxLabelText}>Personal client</span>
              <span className={styles.checkboxHint}>This trainer brought in this client (+10% to their pay rate)</span>
            </label>
          </div>

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
              </FormField>

              <FormField label="Secondary trainer">
                <SearchableSelect
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
              <SearchableSelect
                value={primaryTrainerId}
                onChange={(val) => setPrimaryTrainerId(Number(val))}
                options={primaryTrainerOptions}
                placeholder="Select trainer..."
              />
            </FormField>
          )}

          {/* Transfer trainer field for non-2v2 clients */}
          {mode !== '2v2' && !modeTransition && (
            <FormField label="Trainer">
              <SearchableSelect
                value={primaryTrainerId}
                onChange={(val) => setPrimaryTrainerId(Number(val))}
                options={primaryTrainerOptions}
                placeholder="Select trainer..."
              />
            </FormField>
          )}

          {/* Warning for clients with custom pricing being transferred */}
          {isTrainerTransfer && hasCustomPricing && (
            <div className={styles.warning}>
              <strong>Custom pricing detected:</strong> This client has custom pricing (${selectedClient?.price1_12}/${selectedClient?.price13_20}/${selectedClient?.price21Plus} per session).
              Transferring will reset to the new trainer&apos;s tier pricing unless you override below.
            </div>
          )}

          {/* Info for tier change without custom pricing */}
          {isTrainerTransfer && newTrainer && currentTrainer && newTrainer.tier !== currentTrainer.tier && !hasCustomPricing && (
            <div className={styles.info}>
              <strong>Pricing change:</strong> The new trainer (Tier{' '}
              {newTrainer.tier}) has a {newTrainer.tier > currentTrainer.tier ? 'higher' : 'lower'} rate than the current
              trainer (Tier {currentTrainer.tier}). New tier pricing will be applied unless you override below.
            </div>
          )}

          {/* Warning for mode change with custom pricing */}
          {modeTransition && hasCustomPricing && (
            <div className={styles.warning}>
              <strong>Custom pricing detected:</strong> This client has special pricing. Changing training mode will affect how pricing is applied. Please specify the pricing below.
            </div>
          )}

          {/* Special pricing section */}
          <div className={styles.specialPricingSection}>
            <button
              type="button"
              className={styles.specialPricingToggle}
              onClick={() => setSpecialPricing(!specialPricing)}
            >
              {specialPricing ? '- Hide override package pricing' : '+ Override package pricing'}
            </button>

            {specialPricing && (
              <div className={styles.customPriceFields}>
                <p className={styles.customPriceHint}>
                  Override tier-based pricing with custom prices
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
        </>
      )}
    </Modal>
  )
}
