import type { Client, Session, Package, Trainer, LateFee } from '../types'
import { useWeeklyDashboardData } from '@/hooks/useWeeklyDashboardData'
import {
  WeeklyBreakdownTable,
  WeeklyClientTable,
  WeeklyIncomeSummary,
} from '@/components'

interface WeeklyDashboardProps {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession: (id: number) => void
  onDeletePackage: (id: number) => void
  onDeleteLateFee: (id: number) => void
}

export default function WeeklyDashboard({
  clients,
  packages,
  sessions,
  lateFees,
  weekStart,
  weekEnd,
  selectedTrainer,
  onDeleteSession,
  onDeletePackage,
  onDeleteLateFee,
}: WeeklyDashboardProps) {
  const { clientRows, incomeSummary, breakdownRows } = useWeeklyDashboardData({
    clients,
    packages,
    sessions,
    lateFees,
    weekStart,
    weekEnd,
    selectedTrainer,
  })

  return (
    <div>
      <h2>Weekly Summary</h2>
      <p className="hint">
        Week: {weekStart} → {weekEnd}
      </p>
      <WeeklyClientTable rows={clientRows} />
      <WeeklyIncomeSummary
        totalClassesThisWeek={incomeSummary.totalClassesThisWeek}
        rate={incomeSummary.rate}
        bonusIncome={incomeSummary.bonusIncome}
        lateFees={incomeSummary.lateFeeIncome}
        backfillAdjustment={incomeSummary.backfillAdjustment}
        finalWeeklyIncome={incomeSummary.finalWeeklyIncome}
      />
      <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>
        Breakdown of the week
      </h3>
      <WeeklyBreakdownTable
        rows={breakdownRows}
        onDeleteSession={onDeleteSession}
        onDeletePackage={onDeletePackage}
        onDeleteLateFee={onDeleteLateFee}
      />
    </div>
  )
}
