import type { Package, Session } from '@/types'

export function pickPackageForSession(
  clientId: string,
  trainerId: string,
  date: string,
  allPackages: Package[],
  allSessions: Session[],
): Package | undefined {
  const clientPkgs = allPackages
    .filter(
      (p) =>
        p.clientId === clientId &&
        p.trainerId === trainerId &&
        p.startDate <= date,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  for (const pkg of clientPkgs) {
    const usedInThisPkg = allSessions.filter((s) => s.packageId === pkg.id)
      .length

    if (usedInThisPkg < pkg.sessionsPurchased) {
      return pkg
    }
  }

  return undefined
}
