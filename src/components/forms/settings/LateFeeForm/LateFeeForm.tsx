'use client'

import { useState, useEffect } from 'react'
import { Modal, FormField } from '@/components'
import styles from './LateFeeForm.module.css'

interface LateFeeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
}

export default function LateFeeForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: LateFeeFormProps) {
  const [lateFee, setLateFee] = useState<string>('')
  const [originalLateFee, setOriginalLateFee] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current late fee when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    fetch('/api/late-fees/amount')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const fee = String(data.amount || 45)
        setLateFee(fee)
        setOriginalLateFee(fee)
      })
      .catch(() => {
        setError('Failed to load settings')
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLateFee('')
      setOriginalLateFee('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(lateFee)
    if (isNaN(numValue) || numValue < 0) {
      setError('Please enter a valid amount')
      return
    }

    if (lateFee === originalLateFee) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/late-fees/amount', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(lateFee) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update late fee')
      }

      onClose()
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update late fee'
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
      setLateFee(value)
    }
  }

  const hasChanges = lateFee !== originalLateFee
  const isValidAmount = lateFee !== '' && !isNaN(parseFloat(lateFee)) && parseFloat(lateFee) >= 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Late Fee"
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
            label="Late cancellation fee amount"
            hints={['Changes will apply to new late fees only.']}
          >
            <div className={styles.inputWrapper}>
              <span className={styles.dollarSign}>$</span>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={lateFee}
                onChange={handleChange}
                placeholder="45"
              />
            </div>
          </FormField>
        </>
      )}
    </Modal>
  )
}
