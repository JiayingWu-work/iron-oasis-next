import type { WeeklyBreakdownRow } from '@/hooks/useWeeklyDashboardData'

interface WeeklyBreakdownTableProps {
  rows: WeeklyBreakdownRow[]
  onDeleteSession: (id: number) => void
  onDeletePackage: (id: number) => void
}

export default function WeeklyBreakdownTable({
  rows,
  onDeleteSession,
  onDeletePackage,
}: WeeklyBreakdownTableProps) {
  if (rows.length === 0) {
    return <p className="hint">No records this week.</p>
  }

  return (
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
        {rows.map((row) => (
          <tr key={`${row.type}-${row.id}`}>
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
              {row.type === 'session' &&
                onDeleteSession &&
                typeof row.id === 'number' && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onDeleteSession(row.id as number)}
                  >
                    Delete
                  </button>
                )}

              {row.type === 'package' &&
                onDeletePackage &&
                typeof row.id === 'number' && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onDeletePackage(row.id as number)}
                  >
                    Delete
                  </button>
                )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
