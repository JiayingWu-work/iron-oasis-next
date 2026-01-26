import type {
  Package,
  Session,
  LateFee,
  Trainer,
  TrainingMode,
  Client,
  IncomeRate,
  ClientPriceHistory,
} from '@/types'
import type { WeeklyIncomeSummary } from '@/hooks/useWeeklyDashboardData'
import { getClientPricePerClass, buildPriceHistoryLookup, getClientPricePerClassWithHistory } from '@/lib/pricing'
import { getWeekRange } from '@/lib/date'
import { getRateForClassCount, getRatesEffectiveForWeek } from '@/lib/incomeRates'

/**
 * Get the trainer's rate for the week containing the given date.
 * Uses the trainer's configured income rates effective for that week.
 * All rates are passed in, and we filter to find the correct historical rates.
 */
function getRateForSessionDate(
  sessionDate: string,
  trainerId: number,
  allSessions: Session[],
  allIncomeRates: IncomeRate[] | undefined,
): number {
  const { start, end } = getWeekRange(sessionDate)

  // Get rates effective for the week of this session
  const ratesForWeek = getRatesEffectiveForWeek(allIncomeRates, start)

  const sessionsInWeek = allSessions.filter(
    (s) => s.trainerId === trainerId && s.date >= start && s.date <= end,
  )

  return getRateForClassCount(ratesForWeek, sessionsInWeek.length)
}

// Personal client bonus: 10% added to trainer's rate when client is personal
const PERSONAL_CLIENT_BONUS = 0.10

// Helper to check if a client is visible for the given week
function isClientVisibleForWeek(client: Client | undefined, weekStart?: string): boolean {
  if (!client) return true // Show "Unknown client" entries
  if (!weekStart) return true // No week filtering
  if (!client.archivedAt) return true // Not archived
  // Normalize archivedAt to YYYY-MM-DD format (first 10 chars) for comparison
  const archiveDate = client.archivedAt.slice(0, 10)
  // Show only if archive date is after the week start (hide starting from archive week)
  return archiveDate > weekStart
}

export function computeIncomeSummary(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerId: Trainer['id'],
  allSessions: Session[],
  allIncomeRates?: IncomeRate[],
  clientPriceHistory?: ClientPriceHistory[],
  weekStart?: string, // Monday of the week being computed
): WeeklyIncomeSummary {
  // Filter out data for clients archived before this week
  // Build a map of clientId -> isVisible for known clients
  const clientVisibility = new Map<number, boolean>()
  for (const c of clients) {
    clientVisibility.set(c.id, isClientVisibleForWeek(c, weekStart))
  }

  // Helper: include if client is unknown (not in clients array) or is visible
  const isClientIdVisible = (clientId: number) => {
    if (!clientVisibility.has(clientId)) return true // Unknown client - show as "Unknown client"
    return clientVisibility.get(clientId) === true
  }

  const filteredWeeklySessions = weeklySessions.filter((s) => isClientIdVisible(s.clientId))
  const filteredWeeklyPackages = weeklyPackages.filter((p) => isClientIdVisible(p.clientId))
  const filteredWeeklyLateFees = weeklyLateFees.filter((f) => isClientIdVisible(f.clientId))

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

  // ----- 1) Normal weekly class income -----
  // Now calculated per-session to account for personal client bonus and date-aware pricing
  const classIncome = filteredWeeklySessions.reduce((sum, s) => {
    const directPkg = s.packageId
      ? packages.find((p) => p.id === s.packageId)
      : undefined

    const client = clients.find((c) => c.id === s.clientId)
    if (!client) return sum // Skip if client not found

    let mode: TrainingMode = s.mode ?? directPkg?.mode ?? client?.mode ?? '1v1'
    let pricePerClass: number

    // If the session is BEFORE the package start date, we treat it
    // as a pure drop-in (single-class), even if it now has packageId.
    const isPrePackageSession =
      directPkg !== undefined && s.date < directPkg.startDate

    if (directPkg && !isPrePackageSession) {
      // Has a concrete package (including rebalanced ones)
      // Use date-aware pricing if history is available
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

    // Apply personal client bonus: if the client is a personal client
    // and the trainer is the primary trainer (package owner), add 10% to rate
    const isPersonalClientSession = client.isPersonalClient && client.trainerId === trainerId
    const effectiveRate = isPersonalClientSession ? rate + PERSONAL_CLIENT_BONUS : rate

    return sum + (pricePerClass * effectiveRate)
  }, 0)

  // ----- 2) Sales bonus for packages sold by this trainer this week -----
  const bonusIncome = filteredWeeklyPackages.reduce((sum, p) => {
    if (p.trainerId !== trainerId) return sum
    return sum + (p.salesBonus ?? 0)
  }, 0)

  // ----- 3) Late fee income -----
  const lateFeeIncome = filteredWeeklyLateFees.reduce((sum, f) => sum + f.amount, 0)

  // ----- 4) Backfill adjustment: deduct overpaid amount for old sessions -----
  // When a package is purchased with a start date in the past, sessions that occurred
  // before that date get retroactively assigned to the package. We need to deduct
  // the difference between the single-class rate (originally paid) and the package rate.
  // Each session's adjustment uses the rate from the week when that session occurred.
  const backfillAdjustment = filteredWeeklyPackages.reduce((sum, pkg) => {
    const client = clients.find((c) => c.id === pkg.clientId)
    if (!client) return sum

    // Per-class price for this package (use date-aware pricing)
    const pkgMode: TrainingMode = pkg.mode ?? client.mode ?? '1v1'
    const pkgPricePerClass = getClientPricePerClassWithHistory(
      client.id,
      pkg.startDate,
      priceHistoryLookup,
      client,
      pkg.sessionsPurchased,
      pkgMode,
    )

    // Sessions that are now attached to this package,
    // but happened BEFORE the package start date → "backfilled"
    const backfilledSessions = allSessions.filter(
      (s) =>
        s.trainerId === trainerId &&
        s.clientId === pkg.clientId &&
        s.packageId === pkg.id &&
        s.date < pkg.startDate,
    )

    if (backfilledSessions.length === 0) return sum

    let pkgAdjustment = 0

    for (const s of backfilledSessions) {
      const sessionMode: TrainingMode =
        s.mode ?? client.mode ?? pkgMode ?? '1v1'

      // What we originally paid that session as: single-class highest rate
      // Use date-aware pricing based on the session date
      const singleClassPrice = getClientPricePerClassWithHistory(
        client.id,
        s.date,
        priceHistoryLookup,
        client,
        1,
        sessionMode,
      )

      const diffPerClass = singleClassPrice - pkgPricePerClass

      // If for some reason diff is negative or 0, don't *add* money back
      if (diffPerClass <= 0) continue

      // Deduct trainer share at the ORIGINAL week's rate (when session occurred)
      // Use allIncomeRates to look up historical rates
      // Also apply personal client bonus if applicable
      const originalRate = getRateForSessionDate(s.date, trainerId, allSessions, allIncomeRates)
      const isPersonalClientSession = client.isPersonalClient && client.trainerId === trainerId
      const effectiveOriginalRate = isPersonalClientSession ? originalRate + PERSONAL_CLIENT_BONUS : originalRate
      pkgAdjustment += diffPerClass * effectiveOriginalRate
    }

    return sum + pkgAdjustment
  }, 0)

  // ----- 5) Final income -----
  const finalWeeklyIncome =
    classIncome + bonusIncome + lateFeeIncome - backfillAdjustment

  return {
    totalClassesThisWeek,
    rate,
    bonusIncome,
    lateFeeIncome,
    backfillAdjustment,
    finalWeeklyIncome,
  }
}
