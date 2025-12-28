'use client'

import { useState } from 'react'
import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'
import { DeleteButton } from '@/components'
import styles from './tables.module.css'

interface WeeklyBreakdownTableProps {
  rows: WeeklyBreakdownRow[]
  onDeleteSession?: (id: number) => void
  onDeletePackage?: (id: number) => void
  onDeleteLateFee?: (id: number) => void
  readOnly?: boolean
}

export default function WeeklyBreakdownTable({
  rows,
  onDeleteSession,
  onDeletePackage,
  onDeleteLateFee,
  readOnly = false,
}: WeeklyBreakdownTableProps) {
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  async function handleDelete(type: string, id: number) {
    const key = `${type}-${id}`
    if (deletingKey || readOnly) return
    setDeletingKey(key)
    try {
      if (type === 'session' && onDeleteSession) await onDeleteSession(id)
      if (type === 'package' && onDeletePackage) await onDeletePackage(id)
      if (type === 'lateFee' && onDeleteLateFee) await onDeleteLateFee(id)
    } finally {
      setDeletingKey(null)
    }
  }

  if (rows.length === 0) {
    return <p className={styles.hint}>No records this week.</p>
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Client</th>
          <th>Type</th>
          <th>Amount</th>
          {!readOnly && <th></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.type}-${row.id}`}>
            <td>{row.date}</td>
            <td>
              {row.clientName}
              {row.type === 'session' && row.locationOverride && row.locationOverride !== row.clientLocation && (
                <span className={styles.locationBadge}>
                  {row.locationOverride === 'west' ? 'W' : 'E'}
                </span>
              )}
            </td>
            <td>
              {row.type === 'bonus'
                ? 'Sales bonus'
                : row.type === 'package'
                ? 'Package purchase'
                : row.type === 'lateFee'
                ? 'Late fee'
                : 'Class'}
            </td>
            <td>${row.amount.toFixed(1)}</td>
            {!readOnly && (
              <td>
                {row.type === 'session' && onDeleteSession && (
                  <DeleteButton
                    deleting={deletingKey === `session-${row.id}`}
                    onClick={() => handleDelete('session', row.id as number)}
                  />
                )}
                {row.type === 'package' && onDeletePackage && (
                  <DeleteButton
                    deleting={deletingKey === `package-${row.id}`}
                    onClick={() => handleDelete('package', row.id as number)}
                  />
                )}
                {row.type === 'lateFee' && onDeleteLateFee && (
                  <DeleteButton
                    deleting={deletingKey === `lateFee-${row.id}`}
                    onClick={() => handleDelete('lateFee', row.id as number)}
                  />
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
