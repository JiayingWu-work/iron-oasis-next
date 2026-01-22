import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Client, Session, Package, Trainer, LateFee, Location, IncomeRate, ClientPriceHistory } from '@/types'
import { getWeekRange } from '@/lib/date'
import {
  ApiClient,
  ApiPackage,
  ApiSession,
  ApiLateFee,
  ApiIncomeRate,
  ApiClientPriceHistory,
  TrainerWeekResponse,
} from '@/types/api'

export type TrainerWeekState = {
  weekStart: string
  weekEnd: string
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  incomeRates: IncomeRate[]
  clientPriceHistory: ClientPriceHistory[]
  isLoading: boolean
  setWeekStart: Dispatch<SetStateAction<string>>
  setWeekEnd: Dispatch<SetStateAction<string>>
  setClients: Dispatch<SetStateAction<Client[]>>
  setPackages: Dispatch<SetStateAction<Package[]>>
  setSessions: Dispatch<SetStateAction<Session[]>>
  setLateFees: Dispatch<SetStateAction<LateFee[]>>
  setIncomeRates: Dispatch<SetStateAction<IncomeRate[]>>
  setClientPriceHistory: Dispatch<SetStateAction<ClientPriceHistory[]>>
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
  const [incomeRates, setIncomeRates] = useState<IncomeRate[]>([])
  const [clientPriceHistory, setClientPriceHistory] = useState<ClientPriceHistory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!selectedTrainer) return

    // capture non-null id so TS is happy inside async fn
    const trainerId = selectedTrainer.id
    const abortController = new AbortController()

    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/trainer/${trainerId}/week?date=${selectedDate}`,
          { signal: abortController.signal },
        )

        if (!res.ok) {
          console.error('Failed to load dashboard data')
          return
        }

        const data: TrainerWeekResponse = await res.json()

        // Check if this request is still relevant (trainer hasn't changed)
        if (abortController.signal.aborted) return

        setWeekStart(data.weekStart)
        setWeekEnd(data.weekEnd)

        setClients(
          (data.clients as ApiClient[]).map((c) => ({
            id: c.id,
            name: c.name,
            trainerId: c.trainer_id,
            secondaryTrainerId: c.secondary_trainer_id ?? undefined,
            mode: c.mode ?? '1v1',
            tierAtSignup: c.tier_at_signup as 1 | 2 | 3,
            price1_12: Number(c.price_1_12),
            price13_20: Number(c.price_13_20),
            price21Plus: Number(c.price_21_plus),
            modePremium: Number(c.mode_premium),
            createdAt: c.created_at,
            isActive: c.is_active ?? true,
            location: (c.location ?? 'west') as Location,
            isPersonalClient: c.is_personal_client ?? false,
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
            location: (p.location ?? 'west') as Location,
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
            locationOverride: s.location_override ?? undefined,
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

        setIncomeRates(
          (data.incomeRates ?? ([] as ApiIncomeRate[])).map((r) => ({
            id: r.id,
            trainerId: r.trainer_id,
            minClasses: r.min_classes,
            maxClasses: r.max_classes,
            rate: parseFloat(r.rate),
            effectiveWeek: r.effective_week,
          })),
        )

        setClientPriceHistory(
          (data.clientPriceHistory ?? ([] as ApiClientPriceHistory[])).map((h) => ({
            id: h.id,
            clientId: h.client_id,
            effectiveDate: h.effective_date.slice(0, 10),
            price1_12: Number(h.price_1_12),
            price13_20: Number(h.price_13_20),
            price21Plus: Number(h.price_21_plus),
            modePremium: Number(h.mode_premium),
            reason: h.reason,
          })),
        )

        setIsLoading(false)
      } catch (error) {
        // Ignore abort errors - they're expected when trainer changes
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to load dashboard data:', error)
        setIsLoading(false)
      }
    }

    load()

    return () => {
      abortController.abort()
    }
  }, [selectedTrainer, selectedDate])

  return {
    weekStart,
    weekEnd,
    clients,
    packages,
    sessions,
    lateFees,
    incomeRates,
    clientPriceHistory,
    isLoading,
    setWeekStart,
    setWeekEnd,
    setClients,
    setPackages,
    setSessions,
    setLateFees,
    setIncomeRates,
    setClientPriceHistory,
  }
}
