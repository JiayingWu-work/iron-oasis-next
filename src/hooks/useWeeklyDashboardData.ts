import { useMemo } from 'react'
import { isWithinRange } from '@/lib/date'
import type { Client, Package, Session, Trainer, LateFee } from '@/types'
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
  finalWeeklyIncome: number
}

export interface WeeklyBreakdownRow {
  id: number | string
  date: string
  clientName: string
  type: CombinedRowType
  amount: number
}

interface UseWeeklyDashboardArgs {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
}

export function useWeeklyDashboardData({
  clients,
  packages,
  sessions,
  lateFees,
  weekStart,
  weekEnd,
  selectedTrainer,
}: UseWeeklyDashboardArgs) {
  return useMemo(() => {
    // Filter week-specific data once
    const weeklySessions = sessions.filter((s) =>
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

    // 2) Weekly income numbers
    const incomeSummary = computeIncomeSummary(
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.tier,
    )

    // 3) Breakdown rows
    const breakdownRows = computeBreakdownRows(
      clients,
      packages,
      weeklySessions,
      weeklyPackages,
      weeklyLateFees,
      selectedTrainer.tier,
    )

    return {
      clientRows,
      incomeSummary,
      breakdownRows,
    }
  }, [
    clients,
    packages,
    sessions,
    lateFees,
    weekStart,
    weekEnd,
    selectedTrainer.id,
    selectedTrainer.tier,
  ])
}
