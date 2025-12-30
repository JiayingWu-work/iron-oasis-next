'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  WeeklyNotes,
} from '@/components'
import {
  useTrainerSelection,
  useWeeklyState,
  useSessionActions,
  usePackageActions,
  useLateFeeActions,
} from '@/hooks'
import { Menu } from 'lucide-react'
import styles from '../page.module.css'

/** Convert trainer name and ID to URL-safe slug (e.g., "jiaying-1") */
function toSlug(name: string, id: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${id}`
}

/** Extract trainer ID from slug (e.g., "jiaying-1" -> 1) */
function parseSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/)
  return match ? Number(match[1]) : null
}

export default function TrainerDashboard() {
  const params = useParams()
  const router = useRouter()
  const slugFromUrl = decodeURIComponent(params.trainerName as string)
  const trainerIdFromUrl = parseSlug(slugFromUrl)

  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [isAddingTrainer, setIsAddingTrainer] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'trainer' | null>(null)
  const [trainerIdForUser, setTrainerIdForUser] = useState<number | null>(null)
  const [lateFeeAmount, setLateFeeAmount] = useState<number>(45)

  const { data: session, isPending } = authClient.useSession()

  const {
    trainers,
    setTrainers,
    selectedTrainerId,
    setSelectedTrainerId,
    selectedTrainer,
  } = useTrainerSelection()

  // Find trainer by ID extracted from slug
  const trainerFromUrl = useMemo(() => {
    if (!trainers.length || trainerIdFromUrl === null) return null
    return trainers.find((t) => t.id === trainerIdFromUrl) ?? null
  }, [trainers, trainerIdFromUrl])

  // Sync URL trainer to selection state
  useEffect(() => {
    if (trainerFromUrl && selectedTrainerId !== trainerFromUrl.id) {
      setSelectedTrainerId(trainerFromUrl.id)
    }
  }, [trainerFromUrl, selectedTrainerId, setSelectedTrainerId])

  // Check user role and verify access
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

  // Fetch late fee amount
  useEffect(() => {
    fetch('/api/late-fees/amount')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.amount) {
          setLateFeeAmount(data.amount)
        }
      })
      .catch(() => {})
  }, [])

  // Redirect trainer to their own dashboard if accessing wrong one
  useEffect(() => {
    if (userRole !== 'trainer' || !trainerIdForUser || !trainers.length) return

    const userTrainer = trainers.find((t) => t.id === trainerIdForUser)
    if (
      userTrainer &&
      trainerFromUrl &&
      trainerFromUrl.id !== trainerIdForUser
    ) {
      router.replace(`/dashboard/${toSlug(userTrainer.name, userTrainer.id)}`)
    }
  }, [userRole, trainerIdForUser, trainerFromUrl, trainers, router])

  const isReadOnly = userRole === 'trainer'

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

  const handleSelectTrainer = (id: number) => {
    const trainer = trainers.find((t) => t.id === id)
    if (trainer) {
      router.push(`/dashboard/${toSlug(trainer.name, trainer.id)}`)
    }
    setIsAddingClient(false)
    setIsAddingTrainer(false)
  }

  // Wait for role check to complete
  const isRoleCheckPending = userRole === null
  // For trainers, also wait until we've verified they're on the correct route
  const isTrainerAccessPending =
    isReadOnly &&
    trainerIdForUser &&
    trainerFromUrl &&
    trainerFromUrl.id !== trainerIdForUser

  if (
    !selectedTrainer ||
    selectedTrainerId == null ||
    isRoleCheckPending ||
    isTrainerAccessPending ||
    !trainerFromUrl
  ) {
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
        onSelectTrainer={handleSelectTrainer}
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
                <Menu size={20} />
              </button>
              <DashboardHeader
                trainerName={selectedTrainer.name}
                weekStart={weekStart}
                weekEnd={weekEnd}
                onPrev={handlePrevWeek}
                onNext={handleNextWeek}
              />
            </div>
            <div
              className={`${styles.mainGrid} ${
                isReadOnly ? styles.mainGridFullWidth : ''
              }`}
            >
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
              {!isReadOnly && (
                <Card>
                  <AddClassesForm
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    clients={clients.filter((c) => c.isActive !== false)}
                    onAddSessions={addSessions}
                    disabled={isReadOnly}
                  />
                  <AddPackageForm
                    clients={clients.filter((c) => c.isActive !== false)}
                    onAddPackage={addPackage}
                    disabled={isReadOnly}
                  />
                  <AddLateFeeForm
                    clients={clients.filter((c) => c.isActive !== false)}
                    onAddLateFee={addLateFee}
                    disabled={isReadOnly}
                    lateFeeAmount={lateFeeAmount}
                  />
                  <WeeklyNotes
                    trainerId={selectedTrainer.id}
                    weekStart={weekStart}
                  />
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
