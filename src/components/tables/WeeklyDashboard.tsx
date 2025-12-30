import type { Client, Session, Package, Trainer, LateFee } from '../../types'
import { useWeeklyDashboardData } from '@/hooks/useWeeklyDashboardData'
import {
  WeeklyBreakdownTable,
  WeeklyClientTable,
  WeeklyIncomeSummary,
  WeeklyNotes,
} from '@/components'
import styles from './tables.module.css'

export interface WeeklyDashboardProps {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession?: (id: number) => void
  onDeletePackage?: (id: number) => void
  onDeleteLateFee?: (id: number) => void
  readOnly?: boolean
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
  readOnly = false,
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
      <p className={styles.hint}>
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
      {readOnly && (
        <WeeklyNotes
          trainerId={selectedTrainer.id}
          weekStart={weekStart}
          readOnly
        />
      )}
      <h3 className={styles.breakdownTitle}>Breakdown of the week</h3>
      <WeeklyBreakdownTable
        rows={breakdownRows}
        onDeleteSession={onDeleteSession}
        onDeletePackage={onDeletePackage}
        onDeleteLateFee={onDeleteLateFee}
        readOnly={readOnly}
      />
    </div>
  )
}
