import type {
  Client,
  Package,
  Session,
  LateFee,
  TrainingMode,
  IncomeRate,
  Trainer,
} from '@/types'
import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'
import { getClientPricePerClass } from '@/lib/pricing'
import { getRateForClassCount } from '@/lib/incomeRates'

// Personal client bonus: 10% added to trainer's rate when client is personal
const PERSONAL_CLIENT_BONUS = 0.10

export function computeBreakdownRows(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerId: Trainer['id'],
  incomeRates?: IncomeRate[],
): WeeklyBreakdownRow[] {
  const totalClassesThisWeek = weeklySessions.length
  const rate = getRateForClassCount(incomeRates, totalClassesThisWeek)

  const weeklyPackageRows: WeeklyBreakdownRow[] = weeklyPackages.map((p) => {
    const client = clients.find((c) => c.id === p.clientId)
    const mode: TrainingMode = p.mode ?? client?.mode ?? '1v1'
    const pricePerClass = client
      ? getClientPricePerClass(client, p.sessionsPurchased, mode)
      : 0
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
    let pricePerClass: number = 0

    const isPrePackageSession =
      directPkg !== undefined && s.date < directPkg.startDate

    if (client) {
      if (directPkg && !isPrePackageSession) {
        pricePerClass = getClientPricePerClass(
          client,
          directPkg.sessionsPurchased,
          mode,
        )
      } else {
        // No packageId: always treat as pure drop-in at the single-class rate.
        mode = s.mode ?? client?.mode ?? '1v1'
        pricePerClass = getClientPricePerClass(client, 1, mode)
      }
    }

    // Apply personal client bonus: if the client is a personal client
    // and the trainer is the primary trainer, add 10% to rate
    const isPersonalClientSession = client?.isPersonalClient && client.trainerId === trainerId
    const effectiveRate = isPersonalClientSession ? rate + PERSONAL_CLIENT_BONUS : rate

    return {
      id: s.id,
      date: s.date,
      clientName: client?.name ?? 'Unknown client',
      type: 'session',
      amount: pricePerClass * effectiveRate,
      clientLocation: client?.location,
      locationOverride: s.locationOverride,
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
  ].sort((a, b) => {
    // Sort by date first, then by client name so transactions for the same client are grouped
    const dateCompare = a.date.localeCompare(b.date)
    return dateCompare !== 0 ? dateCompare : a.clientName.localeCompare(b.clientName)
  })

  return breakdownRows
}
