'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Client, Trainer } from '@/types'
import { Modal, FormField, Select } from '@/components'
import styles from './TransferClientForm.module.css'

interface TransferClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientName: string, newTrainerName: string) => void
  onError?: (message: string) => void
}

export default function TransferClientForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: TransferClientFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [newTrainerId, setNewTrainerId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients and trainers when modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    Promise.all([
      fetch('/api/clients').then((res) => (res.ok ? res.json() : [])),
      fetch('/api/trainers').then((res) =>
        res.ok ? res.json().then((d) => d.trainers || []) : [],
      ),
    ])
      .then(([clientsData, trainersData]) => {
        setClients(clientsData)
        setTrainers(trainersData)
      })
      .catch(() => {
        setClients([])
        setTrainers([])
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClientId('')
      setNewTrainerId('')
      setError(null)
    }
  }, [isOpen])

  // Get the selected client
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  )

  // Get current trainer name
  const currentTrainer = useMemo(
    () => trainers.find((t) => t.id === selectedClient?.trainerId),
    [trainers, selectedClient],
  )

  // Get new trainer name for success message
  const newTrainer = useMemo(
    () => trainers.find((t) => t.id === newTrainerId),
    [trainers, newTrainerId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedClientId === '') {
      setError('Please select a client')
      return
    }

    if (newTrainerId === '') {
      setError('Please select a new trainer')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedClient?.name,
          trainerId: newTrainerId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to transfer client')
      }

      const updated = await res.json()
      onClose()
      onSuccess?.(updated.name, newTrainer?.name || 'new trainer')
    } catch (err) {
      const errorMessage = 'Failed to transfer client. Please try again.'
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

  // Filter out current trainer from options
  const trainerOptions = useMemo(
    () =>
      trainers
        .filter((t) => t.id !== selectedClient?.trainerId)
        .map((t) => ({
          value: t.id,
          label: `${t.name} (Tier ${t.tier})`,
        })),
    [trainers, selectedClient],
  )

  const submitDisabled =
    selectedClientId === '' ||
    newTrainerId === '' ||
    selectedClient?.mode === '2v2'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Client"
      onSubmit={handleSubmit}
      submitLabel="Transfer"
      submitDisabled={submitDisabled}
      saving={saving}
      error={error}
    >
      <FormField label="Select client">
        {loading ? (
          <div className={styles.loading}>Loading clients...</div>
        ) : (
          <Select
            value={selectedClientId}
            onChange={(val) => {
              setSelectedClientId(Number(val))
              setNewTrainerId('')
            }}
            options={clientOptions}
            placeholder="Choose a client..."
          />
        )}
      </FormField>

      {selectedClientId !== '' && (
        <>
          <FormField label="Current trainer">
            <div className={styles.currentTrainer}>
              {currentTrainer
                ? `${currentTrainer.name} (Tier ${currentTrainer.tier})`
                : 'Unknown'}
            </div>
          </FormField>

          {selectedClient?.mode === '2v2' ? (
            <div className={styles.warning}>
              This client has a shared package (2v2). Use Edit Client to update
              trainer assignments.
            </div>
          ) : (
            <>
              <FormField label="New trainer">
                <Select
                  value={newTrainerId}
                  onChange={(val) => setNewTrainerId(Number(val))}
                  options={trainerOptions}
                  placeholder="Select new trainer..."
                />
              </FormField>

              {newTrainer && currentTrainer && newTrainer.tier !== currentTrainer.tier && (
                <div className={styles.info}>
                  Client packages and existing sessions will remain unchanged.
                  {newTrainer.tier > currentTrainer.tier ? (
                    <>
                      {' '}
                      <strong>Pricing change:</strong> The new trainer (Tier{' '}
                      {newTrainer.tier}) has a higher rate than the current
                      trainer (Tier {currentTrainer.tier}). Please collect the
                      price difference from the client.
                    </>
                  ) : (
                    <>
                      {' '}
                      <strong>Pricing change:</strong> The new trainer (Tier{' '}
                      {newTrainer.tier}) has a lower rate than the current
                      trainer (Tier {currentTrainer.tier}). The client may
                      request a refund for the price difference.
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  )
}
