import { useMemo } from 'react'
import { isWithinRange } from '@/lib/date'
import { getPricePerClass } from '@/lib/pricing'
import type { Client, Package, Session, Trainer, LateFee } from '@/types'

export type CombinedRowType = 'session' | 'package' | 'bonus' | 'lateFee'

export interface WeeklyClientRow {
  clientId: number
  clientName: string
  packageDisplay: string
  usedDisplay: string
  remainingDisplay: string
  weekCount: number
  totalRemaining: number
}

export interface WeeklyIncomeSummary {
  totalClassesThisWeek: number
  rate: number
  bonusIncome: number
  lateFeeIncome: number
  finalWeeklyIncome: number
}

export interface WeeklyBreakdownRow {
  id: number | string
  date: string
  clientName: string
  type: CombinedRowType
  amount: number
}

interface UseWeeklyDashboardArgs {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  lateFees: LateFee[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
}

export function useWeeklyDashboardData({
  clients,
  packages,
  sessions,
  lateFees,
  weekStart,
  weekEnd,
  selectedTrainer,
}: UseWeeklyDashboardArgs) {
  return useMemo(() => {
    /* -----------------------------
       FILTER WEEKLY DATA
    ----------------------------- */

    const weeklySessions = sessions.filter((s) =>
      isWithinRange(s.date, weekStart, weekEnd),
    )

    const weeklyPackages = packages.filter(
      (p) =>
        p.trainerId === selectedTrainer.id &&
        isWithinRange(p.startDate, weekStart, weekEnd),
    )

    const weeklyLateFees = lateFees.filter((f) =>
      isWithinRange(f.date, weekStart, weekEnd),
    )

    /* -----------------------------
       PER-CLIENT SUMMARY ROWS
    ----------------------------- */

    const clientRows: WeeklyClientRow[] = clients.map((client) => {
      const clientPackages = packages
        .filter((p) => p.clientId === client.id)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))

      const allClientSessions = sessions.filter((s) => s.clientId === client.id)
      const weeklyClientSessions = weeklySessions.filter(
        (s) => s.clientId === client.id,
      )

      const weekCount = weeklyClientSessions.length

      const pkgStats = clientPackages.map((p) => {
        const usedForPkg = allClientSessions.filter((s) => s.packageId === p.id)
          .length
        const remainingForPkg = Math.max(p.sessionsPurchased - usedForPkg, 0)

        return {
          pkg: p,
          usedForPkg,
          remainingForPkg,
        }
      })

      const activePkgs = pkgStats.filter((x) => x.remainingForPkg > 0)

      let toDisplay: typeof pkgStats = []
      if (activePkgs.length > 0) {
        toDisplay = activePkgs
      } else if (pkgStats.length > 0) {
        toDisplay = pkgStats
      }

      const displayPkgs = toDisplay.slice(-2)

      let packageDisplay = '0'
      let usedDisplay = '0'
      let remainingDisplay = '0'
      let totalRemaining = 0

      if (displayPkgs.length > 0) {
        const sessionsNums = displayPkgs.map((x) => x.pkg.sessionsPurchased)
        const usedNums = displayPkgs.map((x) => x.usedForPkg)
        const remainingNums = displayPkgs.map((x) => x.remainingForPkg)

        packageDisplay = sessionsNums.join(' + ')
        usedDisplay = usedNums.join(' + ')
        remainingDisplay = remainingNums.join(' + ')
        totalRemaining = remainingNums.reduce((a, b) => a + b, 0)
      }

      return {
        clientId: client.id,
        clientName: client.name,
        packageDisplay,
        usedDisplay,
        remainingDisplay,
        weekCount,
        totalRemaining,
      }
    })

    /* -----------------------------
       WEEKLY INCOME NUMBERS
    ----------------------------- */

    const totalClassesThisWeek = weeklySessions.length
    const rate = totalClassesThisWeek > 12 ? 0.51 : 0.46

    const grossWeeklyAmount = weeklySessions.reduce((sum, s) => {
      const pkg = packages.find((p) => p.id === s.packageId)
      if (!pkg) return sum
      const pricePerClass = getPricePerClass(
        selectedTrainer.tier,
        pkg.sessionsPurchased,
      )
      return sum + pricePerClass
    }, 0)

    const classIncome = grossWeeklyAmount * rate

    const bonusIncome = weeklyPackages.reduce(
      (sum, p) => sum + (p.salesBonus ?? 0),
      0,
    )

    const lateFeeIncome = weeklyLateFees.reduce((sum, f) => sum + f.amount, 0)
    const finalWeeklyIncome = classIncome + bonusIncome + lateFeeIncome

    const incomeSummary: WeeklyIncomeSummary = {
      totalClassesThisWeek,
      rate,
      bonusIncome,
      lateFeeIncome,
      finalWeeklyIncome,
    }

    /* -----------------------------
       BREAKDOWN ROWS
    ----------------------------- */

    const weeklyPackageRows: WeeklyBreakdownRow[] = weeklyPackages.map((p) => {
      const client = clients.find((c) => c.id === p.clientId)
      const pricePerClass = getPricePerClass(
        selectedTrainer.tier,
        p.sessionsPurchased,
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
      const pkg = packages.find((p) => p.id === s.packageId)
      const price = pkg
        ? getPricePerClass(selectedTrainer.tier, pkg.sessionsPurchased)
        : 0

      return {
        id: s.id,
        date: s.date,
        clientName: client?.name ?? 'Unknown client',
        type: 'session',
        amount: price * rate,
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

    return {
      clientRows,
      incomeSummary,
      breakdownRows,
    }
  }, [
    clients,
    packages,
    sessions,
    lateFees,
    weekStart,
    weekEnd,
    selectedTrainer.id,
    selectedTrainer.tier,
  ])
}
