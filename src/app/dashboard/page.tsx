'use client'

import { useState } from 'react'
import { formatDateToInput, shiftDateByDays } from '@/lib/date'
import {
  DashboardHeader,
  WeeklyDashboard,
  AddClassesForm,
  AddPackageForm,
  AddLateFeeForm,
  AddClientForm,
  SideBar,
} from '@/components'
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

  const [isAddingClient, setIsAddingClient] = useState(false)

  const weeklyState = useWeeklyState(selectedTrainer, selectedDate)
  const {
    weekStart,
    weekEnd,
    clients,
    packages,
    sessions,
    lateFees,
    setClients,
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

  const handleClientCreated = (client: typeof clients[number]) => {
    setClients((prev) =>
      [...prev, client].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setIsAddingClient(false)
  }

  return (
    <div className="app">
      <SideBar
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onSelectTrainer={(id) => {
          setSelectedTrainerId(id)
          setIsAddingClient(false)
        }}
        onAddClient={() => setIsAddingClient(true)}
      />
      <div className="main">
        {isAddingClient ? (
          <AddClientForm
            trainers={trainers}
            onCreated={handleClientCreated}
            onCancel={() => setIsAddingClient(false)}
          />
        ) : (
          <>
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
                <AddClassesForm
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  clients={clients}
                  onAddSessions={addSessions}
                />
                <AddPackageForm clients={clients} onAddPackage={addPackage} />
                <AddLateFeeForm clients={clients} onAddLateFee={addLateFee} />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
