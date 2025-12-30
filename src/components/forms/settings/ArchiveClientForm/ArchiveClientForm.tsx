'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Client } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './ArchiveClientForm.module.css'

interface ArchiveClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientName: string) => void
  onError?: (message: string) => void
}

export default function ArchiveClientForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ArchiveClientFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active clients when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/clients?active=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((clientsData) => {
        setClients(clientsData)
      })
      .catch(() => {
        setClients([])
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClientId('')
      setError(null)
    }
  }, [isOpen])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedClientId === '') {
      setError('Please select a client')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${selectedClientId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to archive client')
      }

      const result = await res.json()
      onClose()
      onSuccess?.(result.name)
    } catch {
      const errorMessage = 'Failed to archive client. Please try again.'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Client"
      onSubmit={handleSubmit}
      submitLabel="Archive"
      submitDisabled={selectedClientId === ''}
      saving={saving}
      error={error}
    >
      <FormField label="Select client to archive">
        {loading ? (
          <div className={styles.loading}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className={styles.empty}>No active clients to archive</div>
        ) : (
          <Select
            value={selectedClientId}
            onChange={(val) => setSelectedClientId(Number(val))}
            options={clientOptions}
            placeholder="Choose a client..."
          />
        )}
      </FormField>

      {selectedClient && (
        <div className={styles.info}>
          <strong>{selectedClient.name}</strong> will be hidden from the Add
          Classes dropdown and other selection lists. Historical session data
          will be preserved.
        </div>
      )}
    </Modal>
  )
}
