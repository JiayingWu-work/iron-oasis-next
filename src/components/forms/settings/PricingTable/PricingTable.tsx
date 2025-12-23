'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal } from '@/components'
import type { Trainer } from '@/types'
import styles from './PricingTable.module.css'

interface PricingTableProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface PricingRow {
  tier: number
  sessions_min: number
  sessions_max: number | null
  price: number
  mode_1v2_premium: number
}

// Separate type for editing - stores strings to allow empty fields
interface EditingPricingRow {
  tier: number
  sessions_min: number
  sessions_max: number | null
  price: string
  mode_1v2_premium: string
}

type TierNumber = Trainer['tier']

const TIERS: TierNumber[] = [1, 2, 3]
const SESSION_BRACKETS = [
  { label: '1-12', min: 1 },
  { label: '13-20', min: 13 },
  { label: '21+', min: 21 },
] as const

// Convert PricingRow to EditingPricingRow (numbers to strings)
function toEditingRows(rows: PricingRow[]): EditingPricingRow[] {
  return rows.map((row) => ({
    ...row,
    price: String(row.price),
    mode_1v2_premium: String(row.mode_1v2_premium),
  }))
}

// Convert EditingPricingRow to PricingRow (strings to numbers)
function toPricingRows(rows: EditingPricingRow[]): PricingRow[] {
  return rows.map((row) => ({
    ...row,
    price: parseInt(row.price, 10) || 0,
    mode_1v2_premium: parseInt(row.mode_1v2_premium, 10) || 0,
  }))
}

export default function PricingTable({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: PricingTableProps) {
  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [editedPricing, setEditedPricing] = useState<EditingPricingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch pricing when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    fetch('/api/pricing')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setPricing(data.pricing)
        setEditedPricing(toEditingRows(data.pricing))
      })
      .catch(() => {
        setError('Failed to load pricing')
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setEditedPricing([])
    }
  }, [isOpen])

  const getPrice = useCallback(
    (tier: TierNumber, sessionsMin: number): string => {
      const row = editedPricing.find(
        (p) => p.tier === tier && p.sessions_min === sessionsMin,
      )
      return row?.price ?? '0'
    },
    [editedPricing],
  )

  const get1v2Premium = useCallback(
    (tier: TierNumber): string => {
      // All session brackets share the same premium per tier, so we use sessions_min: 1
      const row = editedPricing.find(
        (p) => p.tier === tier && p.sessions_min === 1,
      )
      return row?.mode_1v2_premium ?? '20'
    },
    [editedPricing],
  )

  const handlePriceChange = (
    tier: TierNumber,
    sessionsMin: number,
    value: string,
  ) => {
    // Allow empty string and valid non-negative numbers
    if (value !== '' && (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 0))
      return

    setEditedPricing((prev) =>
      prev.map((row) =>
        row.tier === tier && row.sessions_min === sessionsMin
          ? { ...row, price: value }
          : row,
      ),
    )
  }

  const handle1v2PremiumChange = (tier: TierNumber, value: string) => {
    // Allow empty string and valid non-negative numbers
    if (value !== '' && (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 0))
      return

    // Update all session brackets for this tier
    setEditedPricing((prev) =>
      prev.map((row) =>
        row.tier === tier ? { ...row, mode_1v2_premium: value } : row,
      ),
    )
  }

  // Check if any field is empty or invalid
  const hasInvalidFields = useMemo(() => {
    return editedPricing.some(
      (row) => row.price.trim() === '' || row.mode_1v2_premium.trim() === '',
    )
  }, [editedPricing])

  const hasChanges = useMemo(() => {
    return JSON.stringify(pricing) !== JSON.stringify(toPricingRows(editedPricing))
  }, [pricing, editedPricing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasChanges || hasInvalidFields) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    // Convert string values to numbers for API
    const pricingToSave = toPricingRows(editedPricing)

    try {
      const res = await fetch('/api/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing: pricingToSave }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update pricing')
      }

      const data = await res.json()
      setPricing(data.pricing)
      onClose()
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update pricing'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedPricing(toEditingRows(pricing))
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Update Pricing"
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submitDisabled={!hasChanges || hasInvalidFields}
      saving={saving}
      error={error}
    >
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>Loading pricing...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell}>Tier</th>
                {SESSION_BRACKETS.map((bracket) => (
                  <th key={bracket.label} className={styles.headerCell}>
                    {bracket.label} classes
                  </th>
                ))}
                <th className={styles.headerCell}>1v2 Premium</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => (
                <tr key={tier}>
                  <td className={styles.tierCell}>Tier {tier}</td>
                  {SESSION_BRACKETS.map((bracket) => {
                    const price = getPrice(tier, bracket.min)
                    return (
                      <td key={bracket.label} className={styles.priceCell}>
                        <div className={styles.inputWrapper}>
                          <span className={styles.dollarSign}>$</span>
                          <input
                            type="number"
                            min="0"
                            className={styles.priceInput}
                            value={price}
                            onChange={(e) =>
                              handlePriceChange(tier, bracket.min, e.target.value)
                            }
                          />
                        </div>
                      </td>
                    )
                  })}
                  <td className={styles.priceCell}>
                    <div className={styles.inputWrapper}>
                      <span className={styles.dollarSign}>+$</span>
                      <input
                        type="number"
                        min="0"
                        className={styles.priceInput}
                        value={get1v2Premium(tier)}
                        onChange={(e) =>
                          handle1v2PremiumChange(tier, e.target.value)
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}
