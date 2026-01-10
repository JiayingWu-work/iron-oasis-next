'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Client } from '@/types'
import { Modal, FormField, SearchableSelect } from '@/components'
import styles from './UnarchiveClientForm.module.css'

interface UnarchiveClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientName: string) => void
  onError?: (message: string) => void
}

export default function UnarchiveClientForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: UnarchiveClientFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch archived clients when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((clientsData: Client[]) => {
        // Filter to only show archived (inactive) clients
        const archivedClients = clientsData.filter((c) => c.isActive === false)
        setClients(archivedClients)
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
        body: JSON.stringify({ isActive: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to unarchive client')
      }

      const result = await res.json()
      onClose()
      onSuccess?.(result.name)
    } catch {
      const errorMessage = 'Failed to unarchive client. Please try again.'
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
      title="Unarchive Client"
      onSubmit={handleSubmit}
      submitLabel="Unarchive"
      submitDisabled={selectedClientId === ''}
      saving={saving}
      error={error}
    >
      <FormField label="Select client to unarchive">
        {loading ? (
          <div className={styles.loading}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className={styles.empty}>No archived clients to restore</div>
        ) : (
          <SearchableSelect
            value={selectedClientId}
            onChange={(val) => setSelectedClientId(Number(val))}
            options={clientOptions}
            placeholder="Choose a client..."
          />
        )}
      </FormField>

      {selectedClient && (
        <div className={styles.info}>
          <strong>{selectedClient.name}</strong> will be restored and appear in
          the Add Classes dropdown and other selection lists.
        </div>
      )}
    </Modal>
  )
}
