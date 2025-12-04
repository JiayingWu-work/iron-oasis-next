'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Client, Session, Package } from '@/types'
import { TRAINERS } from '@/mock'
import { formatDateToInput, getWeekRange, shiftDateByDays } from '@/lib/date'
import Sidebar from '@/components/SideBar'
import DashboardHeader from '@/components/DashboardHeader'
import WeeklyDashboard from '@/components/WeeklyDashboard'
import DailyEntry from '@/components/DailyEntry'
import AddPackageForm from '@/components/AddPackageForm'

type ApiClient = {
  id: string
  name: string
  trainer_id: string
}

type ApiPackage = {
  id: string
  client_id: string
  trainer_id: string
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type ApiSession = {
  id: string
  date: string
  trainer_id: string
  client_id: string
  package_id: string
}

type TrainerWeekResponse = {
  trainer: {
    id: string
    name: string
    tier: 1 | 2 | 3
  }
  clients: ApiClient[]
  packages: ApiPackage[]
  sessions: ApiSession[]
  weekStart: string
  weekEnd: string
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('jiaying')
  const [noPackageClientIds, setNoPackageClientIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )
  const initialWeek = getWeekRange(formatDateToInput(new Date()))
  const [weekStart, setWeekStart] = useState<string>(initialWeek.start)
  const [weekEnd, setWeekEnd] = useState<string>(initialWeek.end)

  const selectedTrainer = TRAINERS.find((t) => t.id === selectedTrainerId)!

  /* -----------------------------
     LOAD DATA FROM API
  ----------------------------- */

  useEffect(() => {
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
        data.packages.map((p: ApiPackage) => {
          const startDate =
            typeof p.start_date === 'string'
              ? p.start_date.slice(0, 10) // '2025-12-03T...' -> '2025-12-03'
              : new Date(p.start_date).toISOString().slice(0, 10)

          return {
            id: p.id,
            clientId: p.client_id,
            trainerId: p.trainer_id,
            sessionsPurchased: Number(p.sessions_purchased),
            startDate,
            salesBonus:
              p.sales_bonus === null || p.sales_bonus === undefined
                ? undefined
                : Number(p.sales_bonus),
          } as Package
        }),
      )

      setSessions(
        data.sessions.map((s: ApiSession) => {
          const date =
            typeof s.date === 'string'
              ? s.date.slice(0, 10)
              : new Date(s.date).toISOString().slice(0, 10)

          return {
            id: s.id,
            date, // now 'YYYY-MM-DD'
            trainerId: s.trainer_id,
            clientId: s.client_id,
            packageId: s.package_id,
          } as Session
        }),
      )
    }

    load()
  }, [selectedTrainerId, selectedDate])

  const visibleClients = useMemo(
    () => clients, // API already scoped to this trainer
    [clients],
  )

  const trainerSessions = useMemo(
    () => sessions, // API already scoped to this trainer + week
    [sessions],
  )

  // // Week range always based on selectedDate (Monday → Sunday)
  // const { start: weekStart, end: weekEnd } = useMemo(
  //   () => getWeekRange(selectedDate),
  //   [selectedDate],
  // )

  // const visibleClients = useMemo(
  //   () => clients.filter((c) => c.trainerId === selectedTrainerId),
  //   [clients, selectedTrainerId],
  // )

  // const trainerSessions = useMemo(
  //   () => sessions.filter((s) => s.trainerId === selectedTrainerId),
  //   [sessions, selectedTrainerId],
  // )

  const handleAddSessions = async (date: string, clientIds: string[]) => {
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
      // TODO: error UI
      console.error('Failed to add sessions')
      return
    }

    const { newSessions, failed } = await res.json()
    setSessions((prev) => [...prev, ...newSessions])
    setNoPackageClientIds(failed ?? [])
  }

  const handleAddPackage = async (
    clientId: string,
    sessionsPurchased: number,
    startDate: string,
  ) => {
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
      // TODO: error UI
      console.error('Failed to add package')
      return
    }

    const newPkg = await res.json()
    setPackages((prev) => [...prev, newPkg])
  }

  const handleDeleteSession = async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const handleDeletePackage = async (id: string) => {
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

  return (
    <div className="app">
      <Sidebar
        trainers={TRAINERS}
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
