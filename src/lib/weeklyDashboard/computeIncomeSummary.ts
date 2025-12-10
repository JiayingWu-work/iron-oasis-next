import type {
  Package,
  Session,
  LateFee,
  Trainer,
  TrainingMode,
  Client,
} from '@/types'
import type { WeeklyIncomeSummary } from '@/hooks/useWeeklyDashboardData'
import { getPricePerClass } from '@/lib/pricing'

export function computeIncomeSummary(
  clients: Client[],
  packages: Package[],
  weeklySessions: Session[],
  weeklyPackages: Package[],
  weeklyLateFees: LateFee[],
  trainerTier: Trainer['tier'],
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

    let mode: TrainingMode = s.mode ?? directPkg?.mode ?? client?.mode ?? '1v1'
    let pricePerClass: number

    // If the session is BEFORE the package start date, we treat it
    // as a pure drop-in (single-class), even if it now has packageId.
    const isPrePackageSession =
      directPkg !== undefined && s.date < directPkg.startDate

    if (directPkg && !isPrePackageSession) {
      // Has a concrete package (including rebalanced ones)
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
  const backfillAdjustment = weeklyPackages.reduce((sum, pkg) => {
    const client = clients.find((c) => c.id === pkg.clientId)
    if (!client) return sum

    // Per-class price for this package
    const pkgMode: TrainingMode = pkg.mode ?? client.mode ?? '1v1'
    const pkgPricePerClass = getPricePerClass(
      trainerTier,
      pkg.sessionsPurchased,
      pkgMode,
    )

    console.log("i'm backfillAdjustment")

    // Sessions that are now attached to this package,
    // but happened BEFORE the package start date → "backfilled"
    const backfilledSessions = allSessions.filter(
      (s) =>
        s.trainerId === trainerId &&
        s.clientId === pkg.clientId &&
        s.packageId === pkg.id &&
        s.date < pkg.startDate,
    )

    console.log('backfilledSessions: ', backfilledSessions)

    if (backfilledSessions.length === 0) return sum

    let pkgAdjustment = 0

    for (const s of backfilledSessions) {
      const sessionMode: TrainingMode =
        s.mode ?? client.mode ?? pkgMode ?? '1v1'

      // What we originally paid that session as: single-class highest rate
      const singleClassPrice = getPricePerClass(trainerTier, 1, sessionMode)

      const diffPerClass = singleClassPrice - pkgPricePerClass

      console.log('diffPerClass: ', diffPerClass)

      // If for some reason diff is negative or 0, don't *add* money back 🙂
      if (diffPerClass <= 0) continue

      // Deduct trainer share at THIS week’s rate (0.46 or 0.51)
      pkgAdjustment += diffPerClass * rate
    }

    return sum + pkgAdjustment
  }, 0)

  // ----- 5) Final income -----
  const finalWeeklyIncome =
    classIncome + bonusIncome + lateFeeIncome - backfillAdjustment

  console.log('backfillAdjustment: ', backfillAdjustment)

  return {
    totalClassesThisWeek,
    rate,
    bonusIncome,
    lateFeeIncome,
    backfillAdjustment,
    finalWeeklyIncome,
  }
}
