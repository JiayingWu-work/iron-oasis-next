'use client'

import { useMemo, useState } from 'react'
import type { Client, Session, Package } from '@/types'
import { TRAINERS, INITIAL_CLIENTS, INITIAL_PACKAGES } from '@/mock'
import { formatDateToInput, getWeekRange, shiftDateByDays } from '@/lib/date'
import { pickPackageForSession } from '@/lib/package'
import { getPricePerClass } from '@/lib/pricing'
import Sidebar from '@/components/SideBar'
import DashboardHeader from '@/components/DashboardHeader'
import WeeklyDashboard from '@/components/WeeklyDashboard'
import DailyEntry from '@/components/DailyEntry'
import AddPackageForm from '@/components/AddPackageForm'

export default function Dashboard() {
  const [clients] = useState<Client[]>(INITIAL_CLIENTS)
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('jiaying')
  const [noPackageClientIds, setNoPackageClientIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateToInput(new Date()),
  )

  const selectedTrainer = TRAINERS.find((t) => t.id === selectedTrainerId)!

  // Week range always based on selectedDate (Monday → Sunday)
  const { start: weekStart, end: weekEnd } = useMemo(
    () => getWeekRange(selectedDate),
    [selectedDate],
  )

  const visibleClients = useMemo(
    () => clients.filter((c) => c.trainerId === selectedTrainerId),
    [clients, selectedTrainerId],
  )

  const trainerSessions = useMemo(
    () => sessions.filter((s) => s.trainerId === selectedTrainerId),
    [sessions, selectedTrainerId],
  )

  const handleAddSessions = (date: string, clientIds: string[]) => {
    // Reset warning first
    setNoPackageClientIds([])

    setSessions((prevSessions) => {
      const newSessions: Session[] = []
      const failed: string[] = []

      for (const clientId of clientIds) {
        const pkg = pickPackageForSession(
          clientId,
          selectedTrainerId,
          date,
          packages,
          [...prevSessions, ...newSessions],
        )

        if (!pkg) {
          failed.push(clientId)
          continue
        }

        newSessions.push({
          id: `${date}-${clientId}-${crypto.randomUUID()}`,
          date,
          trainerId: selectedTrainerId,
          clientId,
          packageId: pkg.id,
        })
      }

      setNoPackageClientIds(failed)

      return [...prevSessions, ...newSessions]
    })
  }
  const handleAddPackage = (
    clientId: string,
    sessionsPurchased: number,
    startDate: string,
  ) => {
    const trainerTier = selectedTrainer.tier
    const pricePerClass = getPricePerClass(trainerTier, sessionsPurchased)

    // bonus %: 0% <13, 3% for 13–20, 5% for 21+
    let bonusRate = 0
    if (sessionsPurchased >= 13 && sessionsPurchased <= 20) {
      bonusRate = 0.03
    } else if (sessionsPurchased >= 21) {
      bonusRate = 0.05
    }

    const salesBonus =
      bonusRate > 0 ? pricePerClass * sessionsPurchased * bonusRate : 0

    setPackages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        clientId,
        trainerId: selectedTrainer.id,
        sessionsPurchased,
        startDate,
        salesBonus,
      },
    ])
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id))

    // Also remove any sessions that used this package
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
