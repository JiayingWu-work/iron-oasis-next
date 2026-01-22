import type { Client, Session, Package, Trainer, LateFee, IncomeRate, ClientPriceHistory } from '../../types'
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
  incomeRates: IncomeRate[]
  clientPriceHistory?: ClientPriceHistory[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession?: (id: number) => void
  onDeletePackage?: (id: number) => void
  onDeleteLateFee?: (id: number) => void
  readOnly?: boolean
  weeklyNotes?: string
  isLoading?: boolean
}

export default function WeeklyDashboard({
  clients,
  packages,
  sessions,
  lateFees,
  incomeRates,
  clientPriceHistory,
  weekStart,
  weekEnd,
  selectedTrainer,
  onDeleteSession,
  onDeletePackage,
  onDeleteLateFee,
  readOnly = false,
  weeklyNotes,
  isLoading = false,
}: WeeklyDashboardProps) {
  const { clientRows, incomeSummary, breakdownRows, incomeRates: effectiveIncomeRates } = useWeeklyDashboardData({
    clients,
    packages,
    sessions,
    lateFees,
    incomeRates,
    clientPriceHistory,
    weekStart,
    weekEnd,
    selectedTrainer,
  })

  return (
    <div>
      <h2>Weekly Summary</h2>
      <WeeklyClientTable rows={clientRows} />
      <WeeklyIncomeSummary
        totalClassesThisWeek={incomeSummary.totalClassesThisWeek}
        rate={incomeSummary.rate}
        bonusIncome={incomeSummary.bonusIncome}
        lateFees={incomeSummary.lateFeeIncome}
        backfillAdjustment={incomeSummary.backfillAdjustment}
        finalWeeklyIncome={incomeSummary.finalWeeklyIncome}
        incomeRates={effectiveIncomeRates}
        isLoading={isLoading}
      />
      <WeeklyNotes
        trainerId={selectedTrainer.id}
        weekStart={weekStart}
        readOnly
        externalNotes={weeklyNotes}
      />
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
