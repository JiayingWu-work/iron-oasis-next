import type {
  Package,
  Session,
  LateFee,
  Trainer,
  TrainingMode,
  Client,
} from '@/types'
import type { WeeklyIncomeSummary } from '@/hooks/useWeeklyDashboardData'
import { getClientPricePerClass } from '@/lib/pricing'
import { getWeekRange } from '@/lib/date'

/**
 * Get the trainer's rate for the week containing the given date.
 * Rate is 51% if >12 classes that week, otherwise 46%.
 */
function getRateForSessionDate(
  sessionDate: string,
  trainerId: number,
  allSessions: Session[],
): number {
  const { start, end } = getWeekRange(sessionDate)

  const sessionsInWeek = allSessions.filter(
    (s) => s.trainerId === trainerId && s.date >= start && s.date <= end,
  )

  return sessionsInWeek.length > 12 ? 0.51 : 0.46
}

export function computeIncomeSummary(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerId: Trainer['id'],
  allSessions: Session[],
): WeeklyIncomeSummary {
  const totalClassesThisWeek = weeklySessions.length
  const rate = totalClassesThisWeek > 12 ? 0.51 : 0.46

  // ----- 1) Normal weekly class income -----
  const grossWeeklyAmount = weeklySessions.reduce((sum, s) => {
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

    return sum + pricePerClass
  }, 0)

  const classIncome = grossWeeklyAmount * rate

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
      const originalRate = getRateForSessionDate(s.date, trainerId, allSessions)
      pkgAdjustment += diffPerClass * originalRate
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
