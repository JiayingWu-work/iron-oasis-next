import type { Dispatch, SetStateAction } from 'react'
import type { Trainer, Session, Package } from '@/types'
import { ApiPackage, ApiSession, TrainerWeekResponse } from '@/types/api'

export function usePackageActions(
  selectedTrainer: Trainer | null,
  selectedDate: string,
  packages: Package[],
  setPackages: Dispatch<SetStateAction<Package[]>>,
  setSessions: Dispatch<SetStateAction<Session[]>>,
) {
  const addPackage = async (
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

    // Reload week so packages & sessions reflect rebalancing
    const weekRes = await fetch(
      `/api/trainer/${selectedTrainer.id}/week?date=${selectedDate}`,
    )

    if (!weekRes.ok) {
      console.error('Failed to reload dashboard data after adding package')
      return
    }

    const data: TrainerWeekResponse = await weekRes.json()

    setPackages(
      (data.packages as ApiPackage[]).map((p) => ({
        id: p.id,
        clientId: p.client_id,
        trainerId: p.trainer_id,
        sessionsPurchased: Number(p.sessions_purchased),
        startDate: p.start_date.slice(0, 10),
        salesBonus:
          p.sales_bonus === null || p.sales_bonus === undefined
            ? undefined
            : Number(p.sales_bonus),
        mode: p.mode,
      })),
    )

    setSessions(
      (data.sessions as ApiSession[]).map((s) => ({
        id: s.id,
        date: s.date.slice(0, 10),
        trainerId: s.trainer_id,
        clientId: s.client_id,
        packageId: s.package_id,
        mode: s.mode,
      })),
    )
  }

  const deletePackage = async (id: number) => {
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      console.error('Failed to delete package')
      return
    }

    const pkgToDelete = packages.find((p) => p.id === id)
    const remainingPackages = packages.filter((p) => p.id !== id)
    setPackages(remainingPackages)

    // Mirror backend behavior: sessions stay, packageId may move or become null
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

  return {
    addPackage,
    deletePackage,
  }
}
