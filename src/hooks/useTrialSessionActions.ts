import type { Dispatch, SetStateAction } from 'react'
import type { Trainer, TrialSession } from '@/types'
import type { ApiTrialSession } from '@/types/api'

export function useTrialSessionActions(
  selectedTrainer: Trainer | null,
  setTrialSessions: Dispatch<SetStateAction<TrialSession[]>>,
) {
  const addTrialSession = async (date: string) => {
    if (!selectedTrainer) return

    const res = await fetch('/api/trial-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerId: selectedTrainer.id,
        date,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add trial session')
      return
    }

    const created: ApiTrialSession = await res.json()

    setTrialSessions((prev) => [
      ...prev,
      {
        id: created.id,
        trainerId: created.trainer_id,
        date: created.date.slice(0, 10),
        amount: Number(created.amount),
      },
    ])
  }

  const deleteTrialSession = async (id: number) => {
    await fetch(`/api/trial-sessions/${id}`, { method: 'DELETE' })
    setTrialSessions((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    addTrialSession,
    deleteTrialSession,
  }
}
