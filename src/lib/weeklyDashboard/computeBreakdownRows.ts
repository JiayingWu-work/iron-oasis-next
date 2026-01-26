import type {
  Client,
  Package,
  Session,
  LateFee,
  TrainingMode,
  IncomeRate,
  Trainer,
  ClientPriceHistory,
} from '@/types'
import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'
import { getClientPricePerClass, buildPriceHistoryLookup, getClientPricePerClassWithHistory } from '@/lib/pricing'
import { getRateForClassCount, getRatesEffectiveForWeek } from '@/lib/incomeRates'

// Personal client bonus: 10% added to trainer's rate when client is personal
const PERSONAL_CLIENT_BONUS = 0.10

// Helper to check if a client is visible for the given week
function isClientVisibleForWeek(client: Client | undefined, weekStart?: string): boolean {
  if (!client) return true // Show "Unknown client" rows
  if (!weekStart) return true // No week filtering
  if (!client.archivedAt) return true // Not archived
  // Normalize archivedAt to YYYY-MM-DD format (first 10 chars) for comparison
  const archiveDate = client.archivedAt.slice(0, 10)
  // Show only if archive date is after the week start (hide starting from archive week)
  return archiveDate > weekStart
}

export function computeBreakdownRows(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerId: Trainer['id'],
  allIncomeRates?: IncomeRate[],
  clientPriceHistory?: ClientPriceHistory[],
  weekStart?: string, // Monday of the week being computed
): WeeklyBreakdownRow[] {
  // Filter out data for clients archived before this week
  const visibleClientIds = new Set(
    clients
      .filter((c) => isClientVisibleForWeek(c, weekStart))
      .map((c) => c.id)
  )

  const filteredWeeklySessions = weeklySessions.filter((s) => visibleClientIds.has(s.clientId))
  const filteredWeeklyPackages = weeklyPackages.filter((p) => visibleClientIds.has(p.clientId))
  const filteredWeeklyLateFees = weeklyLateFees.filter((f) => visibleClientIds.has(f.clientId))

  const totalClassesThisWeek = filteredWeeklySessions.length

  // Get rates effective for this week (or use all rates if weekStart not provided)
  const ratesForThisWeek = weekStart
    ? getRatesEffectiveForWeek(allIncomeRates, weekStart)
    : allIncomeRates

  const rate = getRateForClassCount(ratesForThisWeek, totalClassesThisWeek)

  // Build price history lookup map for date-aware pricing
  const priceHistoryLookup = clientPriceHistory
    ? buildPriceHistoryLookup(clientPriceHistory)
    : new Map<number, ClientPriceHistory[]>()

  const weeklyPackageRows: WeeklyBreakdownRow[] = filteredWeeklyPackages.map((p) => {
    const client = clients.find((c) => c.id === p.clientId)
    const mode: TrainingMode = p.mode ?? client?.mode ?? '1v1'
    // Use date-aware pricing for package display
    const pricePerClass = client
      ? getClientPricePerClassWithHistory(
          client.id,
          p.startDate,
          priceHistoryLookup,
          client,
          p.sessionsPurchased,
          mode,
        )
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

  const weeklyBonusRows: WeeklyBreakdownRow[] = filteredWeeklyPackages
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

  const weeklySessionRows: WeeklyBreakdownRow[] = filteredWeeklySessions.map((s) => {
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
        // Use date-aware pricing based on session date
        pricePerClass = getClientPricePerClassWithHistory(
          client.id,
          s.date,
          priceHistoryLookup,
          client,
          directPkg.sessionsPurchased,
          mode,
        )
      } else {
        // No packageId: always treat as pure drop-in at the single-class rate.
        mode = s.mode ?? client?.mode ?? '1v1'
        pricePerClass = getClientPricePerClassWithHistory(
          client.id,
          s.date,
          priceHistoryLookup,
          client,
          1,
          mode,
        )
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

  const weeklyLateFeeRows: WeeklyBreakdownRow[] = filteredWeeklyLateFees.map((f) => {
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
