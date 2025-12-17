'use client'

import { useState, useEffect } from 'react'
import { formatDateToInput, shiftDateByDays } from '@/lib/date'
import { authClient } from '@/lib/auth/client'
import {
  DashboardHeader,
  WeeklyDashboard,
  AddClassesForm,
  AddPackageForm,
  AddLateFeeForm,
  AddClientForm,
  AddTrainerForm,
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
  const [isAddingTrainer, setIsAddingTrainer] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'trainer' | null>(null)
  const [trainerIdForUser, setTrainerIdForUser] = useState<number | null>(null)

  const { data: session, isPending } = authClient.useSession()

  // Check user role
  useEffect(() => {
    if (isPending || userRole) return
    if (!session?.user?.id) return

    fetch(`/api/user-profile?authUserId=${session.user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile?.role === 'trainer') {
          setUserRole('trainer')
          setTrainerIdForUser(profile.trainer_id)
        } else {
          setUserRole('owner')
        }
      })
      .catch(() => setUserRole('owner'))
  }, [session, isPending, userRole])

  const isReadOnly = userRole === 'trainer'

  const {
    trainers,
    setTrainers,
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  } = useTrainerSelection()

  // Lock trainer selection for trainer role
  useEffect(() => {
    if (isReadOnly && trainerIdForUser && selectedTrainerId !== trainerIdForUser) {
      setSelectedTrainerId(trainerIdForUser)
    }
  }, [isReadOnly, trainerIdForUser, selectedTrainerId, setSelectedTrainerId])

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

  // Wait for role check to complete before showing content
  // For trainers, also wait until we've locked to the correct trainer
  const isRoleCheckPending = userRole === null
  const isTrainerLockPending = isReadOnly && trainerIdForUser && selectedTrainerId !== trainerIdForUser

  if (!selectedTrainer || selectedTrainerId == null || isRoleCheckPending || isTrainerLockPending) {
    return <div className={styles.app}>Loading…</div>
  }

  const handleClientCreated = (client: typeof clients[number]) => {
    setClients((prev) =>
      [...prev, client].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setIsAddingClient(false)
  }

  const handleTrainerCreated = (trainer: typeof trainers[number]) => {
    setTrainers((prev) => [...prev, trainer].sort((a, b) => a.id - b.id))
    setIsAddingTrainer(false)
  }

  return (
    <div className={styles.app}>
      <SideBar
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onSelectTrainer={(id) => {
          setSelectedTrainerId(id)
          setIsAddingClient(false)
          setIsAddingTrainer(false)
        }}
        onAddClient={() => {
          setIsAddingClient(true)
          setIsAddingTrainer(false)
        }}
        onAddTrainer={() => {
          setIsAddingTrainer(true)
          setIsAddingClient(false)
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        readOnly={isReadOnly}
      />
      <div className={styles.main}>
        {isAddingClient ? (
          <AddClientForm
            trainers={trainers}
            onCreated={handleClientCreated}
            onCancel={() => setIsAddingClient(false)}
          />
        ) : isAddingTrainer ? (
          <AddTrainerForm
            onCreated={handleTrainerCreated}
            onCancel={() => setIsAddingTrainer(false)}
          />
        ) : (
          <>
            <div className={styles.mobileHeaderRow}>
              <button
                className={styles.mobileMenuButton}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
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
            </div>
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
                  onDeleteSession={isReadOnly ? undefined : deleteSession}
                  onDeletePackage={isReadOnly ? undefined : deletePackage}
                  onDeleteLateFee={isReadOnly ? undefined : deleteLateFee}
                  readOnly={isReadOnly}
                />
              </Card>
              <Card>
                <AddClassesForm
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  clients={clients}
                  onAddSessions={addSessions}
                  disabled={isReadOnly}
                />
                <AddPackageForm clients={clients} onAddPackage={addPackage} disabled={isReadOnly} />
                <AddLateFeeForm clients={clients} onAddLateFee={addLateFee} disabled={isReadOnly} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
