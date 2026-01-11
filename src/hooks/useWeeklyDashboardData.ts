import { useMemo } from 'react'
import { isWithinRange } from '@/lib/date'
import type { Client, Package, Session, Trainer, LateFee, Location, IncomeRate } from '@/types'
import {
  computeClientRows,
  computeIncomeSummary,
  computeBreakdownRows,
} from '@/lib/weeklyDashboard'

export type CombinedRowType = 'session' | 'package' | 'bonus' | 'lateFee'

export interface WeeklyClientRow {
  clientId: number
  clientName: string
  packageDisplay: string
  usedDisplay: string
  remainingDisplay: string
  weekCount: number
  totalRemaining: number
}

export interface WeeklyIncomeSummary {
  totalClassesThisWeek: number
  rate: number
  bonusIncome: number
  lateFeeIncome: number
  backfillAdjustment: number
  finalWeeklyIncome: number
}

export interface WeeklyBreakdownRow {
  id: number | string
  date: string
  clientName: string
  type: CombinedRowType
  amount: number
  clientLocation?: Location // client's default location
  locationOverride?: Location // session-specific override (only for sessions)
}

interface UseWeeklyDashboardArgs {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  incomeRates: IncomeRate[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
}

export function useWeeklyDashboardData({
  clients,
  packages,
  sessions,
  lateFees,
  incomeRates,
  weekStart,
  weekEnd,
  selectedTrainer,
}: UseWeeklyDashboardArgs) {
  return useMemo(() => {
    // Filter week-specific data once
    const weeklySessions = sessions.filter(
      (s) =>
        s.trainerId === selectedTrainer.id &&
        isWithinRange(s.date, weekStart, weekEnd),
    )

    const weeklyPackages = packages.filter(
      (p) =>
        p.trainerId === selectedTrainer.id &&
        isWithinRange(p.startDate, weekStart, weekEnd),
    )

    const weeklyLateFees = lateFees.filter((f) =>
      isWithinRange(f.date, weekStart, weekEnd),
    )

    // 1) Per-client summary rows
    const clientRows = computeClientRows(
      clients,
      packages,
      sessions,
      weeklySessions,
    )

    // 2) Weekly income numbers (now uses client-level pricing)
    const incomeSummary = computeIncomeSummary(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.id,
      sessions,
      incomeRates,
    )

    // 3) Breakdown rows (now uses client-level pricing)
    const breakdownRows = computeBreakdownRows(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.id,
      incomeRates,
    )

    return {
      clientRows,
      incomeSummary,
      breakdownRows,
      incomeRates,
    }
  }, [
    clients,
    packages,
    sessions,
    lateFees,
    incomeRates,
    weekStart,
    weekEnd,
    selectedTrainer.id,
  ])
}
