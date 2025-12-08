import type { Client, Package, Session } from '@/types'
import type { WeeklyClientRow } from '@/hooks/useWeeklyDashboardData'

export function computeClientRows(
  clients: Client[],
  packages: Package[],
  sessions: Session[],
  weeklySessions: Session[],
): WeeklyClientRow[] {
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
      const remainingForPkg = p.sessionsPurchased - usedForPkg

      return {
        pkg: p,
        usedForPkg,
        remainingForPkg,
      }
    })

    // Packages that still have remaining > 0
    const activePkgs = pkgStats.filter((x) => x.remainingForPkg > 0)

    // Decide which packages to display in the summary row
    // - If there are active packages: show up to the last 2 active ones (old + new)
    // - If no active packages but there is history: show ONLY the latest package
    let displayPkgs: typeof pkgStats = []

    if (activePkgs.length > 0) {
      displayPkgs = activePkgs.slice(-2)
    } else if (pkgStats.length > 0) {
      displayPkgs = [pkgStats[pkgStats.length - 1]]
    }

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
    } else if (clientPackages.length === 0) {
      // Client has never bought a package, but might have sessions (drop-ins).
      const lifetimeSessions = allClientSessions.length

      if (lifetimeSessions > 0) {
        packageDisplay = '0'
        usedDisplay = String(lifetimeSessions)
        remainingDisplay = String(-lifetimeSessions)
        totalRemaining = -lifetimeSessions
      }
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

  return clientRows
}
