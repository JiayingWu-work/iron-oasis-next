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
  Card,
} from '@/components'
import {
  useTrainerSelection,
  useWeeklyState,
  useSessionActions,
  usePackageActions,
  useLateFeeActions,
} from '@/hooks'
import styles from './page.module.css'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const {
    trainers,
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  } = useTrainerSelection()

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
    return <div className={styles.app}>Loading…</div>
  }

  const handleClientCreated = (client: typeof clients[number]) => {
    setClients((prev) =>
      [...prev, client].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setIsAddingClient(false)
  }

  return (
    <div className={styles.app}>
      <SideBar
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onSelectTrainer={(id) => {
          setSelectedTrainerId(id)
          setIsAddingClient(false)
        }}
        onAddClient={() => setIsAddingClient(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className={styles.main}>
        {isAddingClient ? (
          <AddClientForm
            trainers={trainers}
            onCreated={handleClientCreated}
            onCancel={() => setIsAddingClient(false)}
          />
        ) : (
          <>
            <button
              className={styles.mobileMenuButton}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <DashboardHeader
              trainerName={selectedTrainer.name}
              weekStart={weekStart}
              weekEnd={weekEnd}
              onPrev={handlePrevWeek}
              onNext={handleNextWeek}
            />
            <div className={styles.mainGrid}>
              <Card>
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
              </Card>
              <Card>
                <AddClassesForm
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  clients={clients}
                  onAddSessions={addSessions}
                />
                <AddPackageForm clients={clients} onAddPackage={addPackage} />
                <AddLateFeeForm clients={clients} onAddLateFee={addLateFee} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
