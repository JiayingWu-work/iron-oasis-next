'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Client, Session, Package, Trainer, LateFee } from '@/types'
import { formatDateToInput, getWeekRange, shiftDateByDays } from '@/lib/date'
import Sidebar from '@/components/SideBar'
import DashboardHeader from '@/components/DashboardHeader'
import WeeklyDashboard from '@/components/WeeklyDashboard'
import DailyEntry from '@/components/DailyEntry'
import AddPackageForm from '@/components/AddPackageForm'
import AddLateFeeForm from '@/components/AddLateFeeForm'

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

type ApiLateFee = {
  id: number
  client_id: number
  trainer_id: number
  date: string
  amount: number
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
  lateFees: ApiLateFee[]
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
  const [lateFees, setLateFees] = useState<LateFee[]>([])

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

      setLateFees(
        (data.lateFees ?? []).map((f) => ({
          id: f.id,
          clientId: f.client_id,
          trainerId: f.trainer_id,
          date: f.date.slice(0, 10),
          amount: Number(f.amount),
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

    const { newSessions } = await res.json()
    setSessions((prev) => [...prev, ...newSessions])
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

    await res.json()

    // Reload week data just to get *updated packages & sessions*
    const weekRes = await fetch(
      `/api/trainer/${selectedTrainer.id}/week?date=${selectedDate}`,
    )

    if (!weekRes.ok) {
      console.error('Failed to reload dashboard data after adding package')
      return
    }

    const data: TrainerWeekResponse = await weekRes.json()

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
        packageId: s.package_id, // may be null for single-class rate
      })),
    )
  }

  const handleAddLateFee = async (clientId: number, date: string) => {
    if (!selectedTrainer) return

    const res = await fetch('/api/late-fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        trainerId: selectedTrainer.id,
        date,
      }),
    })

    if (!res.ok) {
      console.error('Failed to add late fee')
      return
    }

    const created: ApiLateFee = await res.json()

    setLateFees((prev) => [
      ...prev,
      {
        id: created.id,
        clientId: created.client_id,
        trainerId: created.trainer_id,
        date: created.date.slice(0, 10),
        amount: Number(created.amount),
      },
    ])
  }

  const handleDeleteSession = async (sessionId: number) => {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const handleDeletePackage = async (id: number) => {
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      console.error('Failed to delete package')
      return
    }

    const pkgToDelete = packages.find((p) => p.id === id)
    const remainingPackages = packages.filter((p) => p.id !== id)
    setPackages(remainingPackages)

    // Mirror backend behavior on sessions:
    // - if client has other packages, move sessions to the last package
    // - otherwise set packageId = null
    if (pkgToDelete) {
      const sameClientPkgs = remainingPackages
        .filter((p) => p.clientId === pkgToDelete.clientId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)

      const lastPkg = sameClientPkgs[sameClientPkgs.length - 1] ?? null

      setSessions((prev) =>
        prev.map((s) =>
          s.packageId === id
            ? {
                ...s,
                packageId: lastPkg ? lastPkg.id : null,
              }
            : s,
        ),
      )
    } else {
      setSessions((prev) =>
        prev.map((s) => (s.packageId === id ? { ...s, packageId: null } : s)),
      )
    }
  }

  const handleDeleteLateFee = async (id: number) => {
    await fetch(`/api/late-fees/${id}`, { method: 'DELETE' })
    setLateFees((prev) => prev.filter((f) => f.id !== id))
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
              lateFees={lateFees}
              weekStart={weekStart}
              weekEnd={weekEnd}
              selectedTrainer={selectedTrainer}
              onDeleteSession={handleDeleteSession}
              onDeletePackage={handleDeletePackage}
              onDeleteLateFee={handleDeleteLateFee}
            />
          </section>

          <section className="card entry-card">
            <DailyEntry
              date={selectedDate}
              onDateChange={setSelectedDate}
              clients={visibleClients}
              onAddSessions={handleAddSessions}
            />
            <AddPackageForm
              clients={visibleClients}
              onAddPackage={handleAddPackage}
            />
            <AddLateFeeForm
              clients={visibleClients}
              onAddLateFee={handleAddLateFee}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
