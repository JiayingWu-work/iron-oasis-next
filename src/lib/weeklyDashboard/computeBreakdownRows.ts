import type {
  Client,
  Package,
  Session,
  LateFee,
  Trainer,
  TrainingMode,
} from '@/types'
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
    const mode: TrainingMode = p.mode ?? client?.mode ?? '1v1'
    const pricePerClass = getPricePerClass(
      trainerTier,
      p.sessionsPurchased,
      mode,
    )
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

    // Try direct package match first (normal case)
    const directPkg = s.packageId
      ? packages.find((p) => p.id === s.packageId)
      : undefined

    let mode: TrainingMode = s.mode ?? directPkg?.mode ?? client?.mode ?? '1v1'
    let pricePerClass: number

    const isPrePackageSession =
      directPkg !== undefined && s.date < directPkg.startDate

    if (directPkg && !isPrePackageSession) {
      pricePerClass = getPricePerClass(
        trainerTier,
        directPkg.sessionsPurchased,
        mode,
      )
    } else {
      // No packageId: always treat as pure drop-in at the single-class rate.
      mode = s.mode ?? client?.mode ?? '1v1'
      pricePerClass = getPricePerClass(trainerTier, 1, mode)
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
