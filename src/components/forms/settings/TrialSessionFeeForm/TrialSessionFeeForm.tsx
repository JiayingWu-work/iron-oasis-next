'use client'

import { useState, useEffect } from 'react'
import { Modal, FormField } from '@/components'
import styles from '../LateFeeForm/LateFeeForm.module.css'

interface TrialSessionFeeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
}

export default function TrialSessionFeeForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: TrialSessionFeeFormProps) {
  const [fee, setFee] = useState<string>('')
  const [originalFee, setOriginalFee] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current fee when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    fetch('/api/trial-sessions/amount')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const val = String(data.amount || 15)
        setFee(val)
        setOriginalFee(val)
      })
      .catch(() => {
        setError('Failed to load settings')
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFee('')
      setOriginalFee('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(fee)
    if (isNaN(numValue) || numValue < 0) {
      setError('Please enter a valid amount')
      return
    }

    if (fee === originalFee) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/trial-sessions/amount', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(fee) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update trial session fee')
      }

      onClose()
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update trial session fee'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string, or valid non-negative numbers
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      setFee(value)
    }
  }

  const hasChanges = fee !== originalFee
  const isValidAmount = fee !== '' && !isNaN(parseFloat(fee)) && parseFloat(fee) >= 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Trial Session Fee"
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submitDisabled={!hasChanges || !isValidAmount}
      saving={saving}
      error={error}
    >
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          <FormField
            label="Onboarding trial session fee"
            hints={['Changes will apply to new trial sessions only.']}
          >
            <div className={styles.inputWrapper}>
              <span className={styles.dollarSign}>$</span>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={fee}
                onChange={handleChange}
                placeholder="15"
              />
            </div>
          </FormField>
        </>
      )}
    </Modal>
  )
}
