import type { Client, Session, Package, Trainer, LateFee, TrialSession, IncomeRate, ClientPriceHistory } from '../../types'
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
  trialSessions: TrialSession[]
  incomeRates: IncomeRate[]
  clientPriceHistory?: ClientPriceHistory[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession?: (id: number) => void
  onDeletePackage?: (id: number) => void
  onDeleteLateFee?: (id: number) => void
  onDeleteTrialSession?: (id: number) => void
  readOnly?: boolean
  weeklyNotes?: string
  isLoading?: boolean
}

export default function WeeklyDashboard({
  clients,
  packages,
  sessions,
  lateFees,
  trialSessions,
  incomeRates,
  clientPriceHistory,
  weekStart,
  weekEnd,
  selectedTrainer,
  onDeleteSession,
  onDeletePackage,
  onDeleteLateFee,
  onDeleteTrialSession,
  readOnly = false,
  weeklyNotes,
  isLoading = false,
}: WeeklyDashboardProps) {
  const { clientRows, incomeSummary, breakdownRows, incomeRates: effectiveIncomeRates } = useWeeklyDashboardData({
    clients,
    packages,
    sessions,
    lateFees,
    trialSessions,
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
        trialSessions={incomeSummary.trialSessionIncome}
        backfillAdjustment={incomeSummary.backfillAdjustment}
        finalWeeklyIncome={incomeSummary.finalWeeklyIncome}
        incomeRates={effectiveIncomeRates}
        isLoading={isLoading}
      />
      <WeeklyNotes
        trainerId={selectedTrainer.id}
        weekStart={weekStart}
        readOnly
        externalNotes={weeklyNotes || undefined}
      />
      <h3 className={styles.breakdownTitle}>Breakdown of the week</h3>
      <WeeklyBreakdownTable
        rows={breakdownRows}
        onDeleteSession={onDeleteSession}
        onDeletePackage={onDeletePackage}
        onDeleteLateFee={onDeleteLateFee}
        onDeleteTrialSession={onDeleteTrialSession}
        readOnly={readOnly}
      />
    </div>
  )
}
