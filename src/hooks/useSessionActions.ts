import type { Dispatch, SetStateAction } from 'react'
import type { Trainer, Session, Location } from '@/types'

export function useSessionActions(
  selectedTrainer: Trainer | null,
  setSessions: Dispatch<SetStateAction<Session[]>>,
) {
  const addSessions = async (date: string, clientIds: number[], locationOverride?: Location) => {
    if (!selectedTrainer) return

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        trainerId: selectedTrainer.id,
        clientIds,
        locationOverride,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add sessions')
      return
    }

    const { newSessions } = await res.json()
    setSessions((prev) => [...prev, ...newSessions])
  }

  const deleteSession = async (sessionId: number) => {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  return {
    addSessions,
    deleteSession,
  }
}
