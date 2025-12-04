type CombinedRowType = 'session' | 'package' | 'bonus'

interface WeeklyBreakdownRow {
  id: string
  date: string
  clientName: string
  type: CombinedRowType
  amount: number
}

interface WeeklyBreakdownTableProps {
  rows: WeeklyBreakdownRow[]
  onDeleteSession: (id: string) => void
  onDeletePackage: (id: string) => void
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
  )
}
