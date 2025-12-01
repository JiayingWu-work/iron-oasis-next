import type { Client, Session, Package, Trainer } from '../types'
import { isWithinRange } from '@/lib/date'
import { getPricePerClass } from '@/lib/pricing'

interface WeeklyDashboardProps {
  clients: Client[]
  packages: Package[]
  sessions: Session[]
  weekStart: string
  weekEnd: string
  selectedTrainer: Trainer
  onDeleteSession?: (id: string) => void
  onDeletePackage?: (id: string) => void
}

type CombinedRowType = 'session' | 'package' | 'bonus'

interface CombinedRow {
  id: string
  date: string
  clientName: string
  type: CombinedRowType
  amount: number
}

export default function WeeklyDashboard({
  clients,
  packages,
  sessions,
  weekStart,
  weekEnd,
  selectedTrainer,
  onDeleteSession,
  onDeletePackage,
}: WeeklyDashboardProps) {
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

  /* -----------------------------
     PER-CLIENT SUMMARY (top table)
  ----------------------------- */

  const rows = clients.map((client) => {
    const clientPackages = packages.filter((p) => p.clientId === client.id)
    const totalPurchased = clientPackages.reduce(
      (sum, p) => sum + p.sessionsPurchased,
      0,
    )

    const allClientSessions = sessions.filter((s) => s.clientId === client.id)
    const weeklyClientSessions = weeklySessions.filter(
      (s) => s.clientId === client.id,
    )

    const totalUsed = allClientSessions.length
    const remaining = Math.max(totalPurchased - totalUsed, 0)
    const weekCount = weeklyClientSessions.length

    return {
      client,
      totalPurchased,
      totalUsed,
      remaining,
      weekCount,
    }
  })

  /* -----------------------------
     WEEKLY INCOME
  ----------------------------- */

  const totalClassesThisWeek = weeklySessions.length
  const rate = totalClassesThisWeek > 12 ? 0.51 : 0.46

  // Sum of base price per class * classes this week
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

  // Sales bonus = sum of package.salesBonus for weekly packages
  const bonusIncome = weeklyPackages.reduce(
    (sum, p) => sum + (p.salesBonus ?? 0),
    0,
  )

  const finalWeeklyIncome = classIncome + bonusIncome

  /* -----------------------------
     COMBINED TABLE (packages + bonus + sessions)
  ----------------------------- */

  // Package purchases this week
  const weeklyPackageRows: CombinedRow[] = weeklyPackages.map((p) => {
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

  // Sales bonus rows – only if bonus > 0 (i.e. >= 13 sessions)
  const weeklyBonusRows: CombinedRow[] = weeklyPackages
    .filter((p) => (p.salesBonus ?? 0) > 0)
    .map((p) => {
      const client = clients.find((c) => c.id === p.clientId)
      return {
        id: `${p.id}-bonus`,
        date: p.startDate,
        clientName: client?.name ?? 'Unknown client',
        type: 'bonus',
        amount: p.salesBonus ?? 0,
      }
    })

  // Session rows for this week
  const weeklySessionRows: CombinedRow[] = weeklySessions.map((s) => {
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

  const combinedRows: CombinedRow[] = [
    ...weeklyPackageRows,
    ...weeklyBonusRows,
    ...weeklySessionRows,
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <h2>Weekly Summary</h2>
      <p className="hint">
        Week: {weekStart} → {weekEnd}
      </p>

      {/* Per-client summary */}
      <table className="table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Package</th>
            <th>Used</th>
            <th>Remaining</th>
            <th>Classes This Week</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.client.id}>
              <td>{row.client.name}</td>
              <td>{row.totalPurchased}</td>
              <td>{row.totalUsed}</td>
              <td>{row.remaining}</td>
              <td>{row.weekCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Weekly income summary */}
      <div
        style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.75rem' }}
      >
        <div>Total classes this week: {totalClassesThisWeek}</div>
        <div>Rate applied: {Math.round(rate * 100)}%</div>
        <div>Sales bonus: ${bonusIncome.toFixed(1)}</div>
        <div>Weekly income: ${finalWeeklyIncome.toFixed(1)}</div>
      </div>

      <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>
        Breakdown of the week
      </h3>

      {combinedRows.length === 0 ? (
        <p className="hint">No records this week.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Type</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {combinedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td>{row.clientName}</td>
                <td>
                  {row.type === 'bonus'
                    ? 'Sales bonus'
                    : row.type === 'package'
                    ? 'Package purchase'
                    : 'Class'}
                </td>
                <td>${row.amount.toFixed(1)}</td>
                <td>
                  {row.type === 'session' && onDeleteSession && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onDeleteSession(row.id)}
                    >
                      Delete
                    </button>
                  )}
                  {row.type === 'package' && onDeletePackage && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onDeletePackage(row.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
