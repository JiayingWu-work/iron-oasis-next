import type { Client, Session, Package, Trainer } from '../types'
import { useWeeklyDashboardData } from '@/hooks/useWeeklyDashboardData'
import WeeklyClientTable from '@/components/WeeklyClientTable'
import WeeklyIncomeSummary from '@/components/WeeklyIncomeSummary'
import WeeklyBreakdownTable from '@/components/WeeklyBreakdownTable'

interface WeeklyDashboardProps {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession: (id: string) => void
  onDeletePackage: (id: string) => void
}

export default function WeeklyDashboard({
  clients,
  packages,
  sessions,
  weekStart,
  weekEnd,
  selectedTrainer,
  onDeleteSession,
  onDeletePackage,
}: WeeklyDashboardProps) {
  const { clientRows, incomeSummary, breakdownRows } = useWeeklyDashboardData({
    clients,
    packages,
    sessions,
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

      <WeeklyIncomeSummary {...incomeSummary} />

      <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>
        Breakdown of the week
      </h3>

      <WeeklyBreakdownTable
        rows={breakdownRows}
        onDeleteSession={onDeleteSession}
        onDeletePackage={onDeletePackage}
      />
    </div>
  )
}
