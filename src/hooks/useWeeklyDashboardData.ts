import { useMemo } from 'react'
import { isWithinRange } from '@/lib/date'
import type { Client, Package, Session, Trainer, LateFee, Location, IncomeRate, ClientPriceHistory } from '@/types'
import {
  computeClientRows,
  computeIncomeSummary,
  computeBreakdownRows,
} from '@/lib/weeklyDashboard'
import { getRatesEffectiveForWeek } from '@/lib/incomeRates'

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
  clientPriceHistory?: ClientPriceHistory[]
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
  clientPriceHistory,
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

    // 2) Weekly income numbers (now uses date-aware pricing and week-effective rates)
    const incomeSummary = computeIncomeSummary(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.id,
      sessions,
      incomeRates,
      clientPriceHistory,
      weekStart, // Pass weekStart for week-effective rate lookup
    )

    // 3) Breakdown rows (now uses date-aware pricing and week-effective rates)
    const breakdownRows = computeBreakdownRows(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.id,
      incomeRates,
      clientPriceHistory,
      weekStart, // Pass weekStart for week-effective rate lookup
    )

    // 4) Filter income rates to only those effective for this week (for display)
    const effectiveIncomeRates = getRatesEffectiveForWeek(incomeRates, weekStart)

    return {
      clientRows,
      incomeSummary,
      breakdownRows,
      incomeRates: effectiveIncomeRates,
    }
  }, [
    clients,
    packages,
    sessions,
    lateFees,
    incomeRates,
    clientPriceHistory,
    weekStart,
    weekEnd,
    selectedTrainer.id,
  ])
}
