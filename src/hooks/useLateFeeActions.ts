import type { Dispatch, SetStateAction } from 'react'
import type { Trainer, LateFee } from '@/types'
import type { ApiLateFee } from '@/types/api'

export function useLateFeeActions(
  selectedTrainer: Trainer | null,
  setLateFees: Dispatch<SetStateAction<LateFee[]>>,
) {
  const addLateFee = async (clientId: number, date: string) => {
    if (!selectedTrainer) return

    const res = await fetch('/api/late-fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        trainerId: selectedTrainer.id,
        date,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add late fee')
      return
    }

    const created: ApiLateFee = await res.json()

    setLateFees((prev) => [
      ...prev,
      {
        id: created.id,
        clientId: created.client_id,
        trainerId: created.trainer_id,
        date: created.date.slice(0, 10),
        amount: Number(created.amount),
      },
    ])
  }

  const deleteLateFee = async (id: number) => {
    await fetch(`/api/late-fees/${id}`, { method: 'DELETE' })
    setLateFees((prev) => prev.filter((f) => f.id !== id))
  }

  return {
    addLateFee,
    deleteLateFee,
  }
}
