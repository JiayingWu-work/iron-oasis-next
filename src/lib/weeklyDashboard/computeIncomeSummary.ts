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
): WeeklyIncomeSummary {
  const totalClassesThisWeek = weeklySessions.length
  const rate = totalClassesThisWeek > 12 ? 0.51 : 0.46

  const grossWeeklyAmount = weeklySessions.reduce((sum, s) => {
    // 1) Try direct package match first (normal case)
    const directPkg = s.packageId
      ? packages.find((p) => p.id === s.packageId)
      : undefined

    const client = clients.find((c) => c.id === s.clientId)

    let mode: TrainingMode = s.mode ?? directPkg?.mode ?? client?.mode ?? '1v1'
    let pricePerClass: number

    if (directPkg) {
      // Has a concrete package (including rebalanced ones)
      pricePerClass = getPricePerClass(
        trainerTier,
        directPkg.sessionsPurchased,
        mode,
      )
    } else {
      // No packageId: either pure drop-in or historical package that got deleted.
      // If client has package history, use the most recent package’s rate.
      const clientPackages = packages
        .filter((p) => p.clientId === s.clientId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)

      const lastPkg = clientPackages[clientPackages.length - 1]

      if (lastPkg) {
        mode = s.mode ?? lastPkg.mode ?? client?.mode ?? '1v1'
        pricePerClass = getPricePerClass(
          trainerTier,
          lastPkg.sessionsPurchased,
          mode,
        )
      } else {
        // Truly never bought a package → single-class rate
        mode = s.mode ?? client?.mode ?? '1v1'
        pricePerClass = getPricePerClass(trainerTier, 1, mode)
      }
    }

    return sum + pricePerClass
  }, 0)

  const classIncome = grossWeeklyAmount * rate

  // Only count bonus if this trainer sold the package
  const bonusIncome = weeklyPackages.reduce((sum, p) => {
    if (p.trainerId !== trainerId) return sum
    return sum + (p.salesBonus ?? 0)
  }, 0)

  const lateFeeIncome = weeklyLateFees.reduce((sum, f) => sum + f.amount, 0)
  const finalWeeklyIncome = classIncome + bonusIncome + lateFeeIncome

  return {
    totalClassesThisWeek,
    rate,
    bonusIncome,
    lateFeeIncome,
    finalWeeklyIncome,
  }
}
