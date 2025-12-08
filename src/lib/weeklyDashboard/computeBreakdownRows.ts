// src/lib/weeklyDashboard/computeBreakdownRows.ts
import type { Client, Package, Session, LateFee, Trainer } from '@/types'
import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'
import { getPricePerClass } from '@/lib/pricing'

export function computeBreakdownRows(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerTier: Trainer['tier'],
): WeeklyBreakdownRow[] {
  const totalClassesThisWeek = weeklySessions.length
  const rate = totalClassesThisWeek > 12 ? 0.51 : 0.46

  const weeklyPackageRows: WeeklyBreakdownRow[] = weeklyPackages.map((p) => {
    const client = clients.find((c) => c.id === p.clientId)
    const pricePerClass = getPricePerClass(trainerTier, p.sessionsPurchased)
    const totalSale = pricePerClass * p.sessionsPurchased

    return {
      id: p.id,
      date: p.startDate,
      clientName: client?.name ?? 'Unknown client',
      type: 'package',
      amount: totalSale,
    }
  })

  const weeklyBonusRows: WeeklyBreakdownRow[] = weeklyPackages
    .filter((p) => (p.salesBonus ?? 0) > 0)
    .map((p) => {
      const client = clients.find((c) => c.id === p.clientId)
      return {
        id: `${p.id}-bonus`, // string
        date: p.startDate,
        clientName: client?.name ?? 'Unknown client',
        type: 'bonus',
        amount: p.salesBonus ?? 0,
      }
    })

  const weeklySessionRows: WeeklyBreakdownRow[] = weeklySessions.map((s) => {
    const client = clients.find((c) => c.id === s.clientId)

    // 1) direct package if present
    const directPkg = s.packageId
      ? packages.find((p) => p.id === s.packageId)
      : undefined

    let pricePerClass: number

    if (directPkg) {
      pricePerClass = getPricePerClass(trainerTier, directPkg.sessionsPurchased)
    } else {
      // no packageId: use last package rate if client has any history, else single-class
      const clientPackages = packages
        .filter((p) => p.clientId === s.clientId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)

      const lastPkg = clientPackages[clientPackages.length - 1]

      if (lastPkg) {
        pricePerClass = getPricePerClass(trainerTier, lastPkg.sessionsPurchased)
      } else {
        pricePerClass = getPricePerClass(trainerTier, 1)
      }
    }

    return {
      id: s.id,
      date: s.date,
      clientName: client?.name ?? 'Unknown client',
      type: 'session',
      amount: pricePerClass * rate,
    }
  })

  const weeklyLateFeeRows: WeeklyBreakdownRow[] = weeklyLateFees.map((f) => {
    const client = clients.find((c) => c.id === f.clientId)
    return {
      id: f.id,
      date: f.date,
      clientName: client?.name ?? 'Unknown client',
      type: 'lateFee',
      amount: f.amount,
    }
  })

  const breakdownRows: WeeklyBreakdownRow[] = [
    ...weeklyPackageRows,
    ...weeklyBonusRows,
    ...weeklySessionRows,
    ...weeklyLateFeeRows,
  ].sort((a, b) => a.date.localeCompare(b.date))

  return breakdownRows
}
