import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Client, Session, Package, Trainer, LateFee } from '@/types'
import { getWeekRange } from '@/lib/date'
import {
  ApiClient,
  ApiPackage,
  ApiSession,
  ApiLateFee,
  TrainerWeekResponse,
} from '@/types/api'

export type TrainerWeekState = {
  weekStart: string
  weekEnd: string
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  setWeekStart: Dispatch<SetStateAction<string>>
  setWeekEnd: Dispatch<SetStateAction<string>>
  setClients: Dispatch<SetStateAction<Client[]>>
  setPackages: Dispatch<SetStateAction<Package[]>>
  setSessions: Dispatch<SetStateAction<Session[]>>
  setLateFees: Dispatch<SetStateAction<LateFee[]>>
}

export function useWeeklyState(
  selectedTrainer: Trainer | null,
  selectedDate: string,
): TrainerWeekState {
  const [weekStart, setWeekStart] = useState<string>(
    getWeekRange(selectedDate).start,
  )
  const [weekEnd, setWeekEnd] = useState<string>(
    getWeekRange(selectedDate).end,
  )
  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [lateFees, setLateFees] = useState<LateFee[]>([])

  useEffect(() => {
    if (!selectedTrainer) return

    // capture non-null id so TS is happy inside async fn
    const trainerId = selectedTrainer.id

    async function load() {
      const res = await fetch(
        `/api/trainer/${trainerId}/week?date=${selectedDate}`,
      )

      if (!res.ok) {
        console.error('Failed to load dashboard data')
        return
      }

      const data: TrainerWeekResponse = await res.json()

      setWeekStart(data.weekStart)
      setWeekEnd(data.weekEnd)

      setClients(
        (data.clients as ApiClient[]).map((c) => ({
          id: c.id,
          name: c.name,
          trainerId: c.trainer_id,
           mode: c.mode ?? '1v1',
        })),
      )

      setPackages(
        (data.packages as ApiPackage[]).map((p) => ({
          id: p.id,
          clientId: p.client_id,
          trainerId: p.trainer_id,
          sessionsPurchased: Number(p.sessions_purchased),
          startDate: p.start_date.slice(0, 10),
          salesBonus:
            p.sales_bonus === null || p.sales_bonus === undefined
              ? undefined
              : Number(p.sales_bonus),
          mode: p.mode ?? '1v1', 
        })),
      )

      setSessions(
        (data.sessions as ApiSession[]).map((s) => ({
          id: s.id,
          date: s.date.slice(0, 10),
          trainerId: s.trainer_id,
          clientId: s.client_id,
          packageId: s.package_id,
          mode: s.mode ?? '1v1',
        })),
      )

      setLateFees(
        (data.lateFees ?? ([] as ApiLateFee[])).map((f) => ({
          id: f.id,
          clientId: f.client_id,
          trainerId: f.trainer_id,
          date: f.date.slice(0, 10),
          amount: Number(f.amount),
        })),
      )
    }

    load()
  }, [selectedTrainer, selectedDate])

  return {
    weekStart,
    weekEnd,
    clients,
    packages,
    sessions,
    lateFees,
    setWeekStart,
    setWeekEnd,
    setClients,
    setPackages,
    setSessions,
    setLateFees,
  }
}
