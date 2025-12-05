'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Client, Session, Package, Trainer } from '@/types'
import { formatDateToInput, getWeekRange, shiftDateByDays } from '@/lib/date'
import Sidebar from '@/components/SideBar'
import DashboardHeader from '@/components/DashboardHeader'
import WeeklyDashboard from '@/components/WeeklyDashboard'
import DailyEntry from '@/components/DailyEntry'
import AddPackageForm from '@/components/AddPackageForm'

type ApiClient = {
  id: number
  name: string
  trainer_id: number
}

type ApiPackage = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type ApiSession = {
  id: number
  date: string
  trainer_id: number
  client_id: number
  package_id: number
}

type TrainerWeekResponse = {
  trainer: {
    id: number
    name: string
    tier: 1 | 2 | 3
  }
  clients: ApiClient[]
  packages: ApiPackage[]
  sessions: ApiSession[]
  weekStart: string
  weekEnd: string
}

type TrainersResponse = {
  trainers: Trainer[]
}

export default function Dashboard() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<number>(1)

  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [noPackageClientIds, setNoPackageClientIds] = useState<number[]>([])

  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )
  const initialWeek = getWeekRange(formatDateToInput(new Date()))
  const [weekStart, setWeekStart] = useState<string>(initialWeek.start)
  const [weekEnd, setWeekEnd] = useState<string>(initialWeek.end)

  /* -----------------------------
     LOAD TRAINERS
  ----------------------------- */

  useEffect(() => {
    async function loadTrainers() {
      const res = await fetch('/api/trainers')
      if (!res.ok) {
        console.error('Failed to load trainers')
        return
      }
      const data: TrainersResponse = await res.json()
      setTrainers(data.trainers)

      // pick first trainer as default if none selected
      if (data.trainers.length > 0 && selectedTrainerId === null) {
        setSelectedTrainerId(data.trainers[0]?.id)
      }
    }

    loadTrainers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedTrainer = useMemo(
    () =>
      selectedTrainerId == null
        ? null
        : trainers.find((t) => t.id === selectedTrainerId) ?? null,
    [trainers, selectedTrainerId],
  )

  /* -----------------------------
     LOAD WEEKLY DATA FOR TRAINER
  ----------------------------- */

  useEffect(() => {
    if (selectedTrainerId == null) return

    async function load() {
      const res = await fetch(
        `/api/trainer/${selectedTrainerId}/week?date=${selectedDate}`,
      )

      if (!res.ok) {
        console.error('Failed to load dashboard data')
        return
      }

      const data: TrainerWeekResponse = await res.json()

      setWeekStart(data.weekStart)
      setWeekEnd(data.weekEnd)

      setClients(
        data.clients.map((c) => ({
          id: c.id,
          name: c.name,
          trainerId: c.trainer_id,
        })),
      )

      setPackages(
        data.packages.map((p) => ({
          id: p.id,
          clientId: p.client_id,
          trainerId: p.trainer_id,
          sessionsPurchased: Number(p.sessions_purchased),
          startDate: p.start_date.slice(0, 10),
          salesBonus:
            p.sales_bonus === null || p.sales_bonus === undefined
              ? undefined
              : Number(p.sales_bonus),
        })),
      )

      setSessions(
        data.sessions.map((s) => ({
          id: s.id,
          date: s.date.slice(0, 10),
          trainerId: s.trainer_id,
          clientId: s.client_id,
          packageId: s.package_id,
        })),
      )
    }

    load()
  }, [selectedTrainerId, selectedDate])

  const visibleClients = useMemo(() => clients, [clients])
  const trainerSessions = useMemo(() => sessions, [sessions])

  /* -----------------------------
     MUTATIONS
  ----------------------------- */

  const handleAddSessions = async (date: string, clientIds: number[]) => {
    if (selectedTrainerId == null) return
    setNoPackageClientIds([])

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        trainerId: selectedTrainerId,
        clientIds,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add sessions')
      return
    }

    const { newSessions, failed } = await res.json()
    setSessions((prev) => [...prev, ...newSessions])
    setNoPackageClientIds(failed ?? [])
  }

  const handleAddPackage = async (
    clientId: number,
    sessionsPurchased: number,
    startDate: string,
  ) => {
    if (!selectedTrainer) return

    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        trainerId: selectedTrainer.id,
        sessionsPurchased,
        startDate,
        trainerTier: selectedTrainer.tier,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add package')
      return
    }

    const newPkg: Package = await res.json()
    setPackages((prev) => [...prev, newPkg])
  }

  const handleDeleteSession = async (sessionId: number) => {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const handleDeletePackage = async (id: number) => {
    await fetch(`/api/packages/${id}`, { method: 'DELETE' })
    setPackages((prev) => prev.filter((p) => p.id !== id))
    setSessions((prev) => prev.filter((s) => s.packageId !== id))
  }

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
              clients={visibleClients}
              packages={packages}
              sessions={trainerSessions}
              weekStart={weekStart}
              weekEnd={weekEnd}
              selectedTrainer={selectedTrainer}
              onDeleteSession={handleDeleteSession}
              onDeletePackage={handleDeletePackage}
            />
          </section>

          <section className="card entry-card">
            <DailyEntry
              date={selectedDate}
              onDateChange={setSelectedDate}
              clients={visibleClients}
              onAddSessions={handleAddSessions}
              noPackageClientIds={noPackageClientIds}
              setNoPackageClientIds={setNoPackageClientIds}
            />
            <AddPackageForm
              clients={visibleClients}
              onAddPackage={handleAddPackage}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
