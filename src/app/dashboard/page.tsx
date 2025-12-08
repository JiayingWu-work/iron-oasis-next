'use client'

import { useState } from 'react'
import { formatDateToInput, shiftDateByDays } from '@/lib/date'
import Sidebar from '@/components/SideBar'
import DashboardHeader from '@/components/DashboardHeader'
import WeeklyDashboard from '@/components/WeeklyDashboard'
import DailyEntry from '@/components/DailyEntry'
import AddPackageForm from '@/components/AddPackageForm'
import AddLateFeeForm from '@/components/AddLateFeeForm'
import {
  useTrainerSelection,
  useWeeklyState,
  useSessionActions,
  usePackageActions,
  useLateFeeActions,
} from '@/hooks'

export default function Dashboard() {
  const {
    trainers,
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  } = useTrainerSelection()

  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )

  const weeklyState = useWeeklyState(selectedTrainer, selectedDate)
  const {
    weekStart,
    weekEnd,
    clients,
    packages,
    sessions,
    lateFees,
    setPackages,
    setSessions,
    setLateFees,
  } = weeklyState

  const { addSessions, deleteSession } = useSessionActions(
    selectedTrainer,
    setSessions,
  )

  const { addPackage, deletePackage } = usePackageActions(
    selectedTrainer,
    selectedDate,
    packages,
    setPackages,
    setSessions,
  )

  const { addLateFee, deleteLateFee } = useLateFeeActions(
    selectedTrainer,
    setLateFees,
  )

  const handlePrevWeek = () => {
    setSelectedDate((prev) => shiftDateByDays(prev, -7))
  }

  const handleNextWeek = () => {
    setSelectedDate((prev) => shiftDateByDays(prev, 7))
  }

  if (!selectedTrainer || selectedTrainerId == null) {
    return <div className="app">Loading…</div>
  }

  return (
    <div className="app">
      <Sidebar
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onSelectTrainer={setSelectedTrainerId}
      />

      <div className="main">
        <DashboardHeader
          trainerName={selectedTrainer.name}
          weekStart={weekStart}
          weekEnd={weekEnd}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />

        <div className="main-grid">
          <section className="card summary-card">
            <WeeklyDashboard
              clients={clients}
              packages={packages}
              sessions={sessions}
              lateFees={lateFees}
              weekStart={weekStart}
              weekEnd={weekEnd}
              selectedTrainer={selectedTrainer}
              onDeleteSession={deleteSession}
              onDeletePackage={deletePackage}
              onDeleteLateFee={deleteLateFee}
            />
          </section>

          <section className="card entry-card">
            <DailyEntry
              date={selectedDate}
              onDateChange={setSelectedDate}
              clients={clients}
              onAddSessions={addSessions}
            />
            <AddPackageForm clients={clients} onAddPackage={addPackage} />
            <AddLateFeeForm clients={clients} onAddLateFee={addLateFee} />
          </section>
        </div>
      </div>
    </div>
  )
}
