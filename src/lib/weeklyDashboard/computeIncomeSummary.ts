import type {
  Package,
  Session,
  LateFee,
  Trainer,
  TrainingMode,
  Client,
  IncomeRate,
} from '@/types'
import type { WeeklyIncomeSummary } from '@/hooks/useWeeklyDashboardData'
import { getClientPricePerClass } from '@/lib/pricing'
import { getWeekRange } from '@/lib/date'
import { getRateForClassCount } from '@/lib/incomeRates'

/**
 * Get the trainer's rate for the week containing the given date.
 * Uses the trainer's configured income rates, or defaults to 46%/51%.
 */
function getRateForSessionDate(
  sessionDate: string,
  trainerId: number,
  allSessions: Session[],
  incomeRates: IncomeRate[] | undefined,
): number {
  const { start, end } = getWeekRange(sessionDate)

  const sessionsInWeek = allSessions.filter(
    (s) => s.trainerId === trainerId && s.date >= start && s.date <= end,
  )

  return getRateForClassCount(incomeRates, sessionsInWeek.length)
}

// Personal client bonus: 10% added to trainer's rate when client is personal
const PERSONAL_CLIENT_BONUS = 0.10

export function computeIncomeSummary(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerId: Trainer['id'],
  allSessions: Session[],
  incomeRates?: IncomeRate[],
): WeeklyIncomeSummary {
  const totalClassesThisWeek = weeklySessions.length
  const rate = getRateForClassCount(incomeRates, totalClassesThisWeek)

  // ----- 1) Normal weekly class income -----
  // Now calculated per-session to account for personal client bonus
  const classIncome = weeklySessions.reduce((sum, s) => {
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

    // Apply personal client bonus: if the client is a personal client
    // and the trainer is the primary trainer (package owner), add 10% to rate
    const isPersonalClientSession = client.isPersonalClient && client.trainerId === trainerId
    const effectiveRate = isPersonalClientSession ? rate + PERSONAL_CLIENT_BONUS : rate

    return sum + (pricePerClass * effectiveRate)
  }, 0)

  // ----- 2) Sales bonus for packages sold by this trainer this week -----
  const bonusIncome = weeklyPackages.reduce((sum, p) => {
    if (p.trainerId !== trainerId) return sum
    return sum + (p.salesBonus ?? 0)
  }, 0)

  // ----- 3) Late fee income -----
  const lateFeeIncome = weeklyLateFees.reduce((sum, f) => sum + f.amount, 0)

  // ----- 4) Backfill adjustment: deduct overpaid amount for old sessions -----
  // When a package is purchased with a start date in the past, sessions that occurred
  // before that date get retroactively assigned to the package. We need to deduct
  // the difference between the single-class rate (originally paid) and the package rate.
  // Each session's adjustment uses the rate from the week when that session occurred.
  const backfillAdjustment = weeklyPackages.reduce((sum, pkg) => {
    const client = clients.find((c) => c.id === pkg.clientId)
    if (!client) return sum

    // Per-class price for this package
    const pkgMode: TrainingMode = pkg.mode ?? client.mode ?? '1v1'
    const pkgPricePerClass = getClientPricePerClass(
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
      const singleClassPrice = getClientPricePerClass(client, 1, sessionMode)

      const diffPerClass = singleClassPrice - pkgPricePerClass

      // If for some reason diff is negative or 0, don't *add* money back
      if (diffPerClass <= 0) continue

      // Deduct trainer share at the ORIGINAL week's rate (when session occurred)
      // Also apply personal client bonus if applicable
      const originalRate = getRateForSessionDate(s.date, trainerId, allSessions, incomeRates)
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
