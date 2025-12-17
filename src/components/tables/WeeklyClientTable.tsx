import styles from './tables.module.css'

interface WeeklyClientRow {
  clientId: number
  clientName: string
  packageDisplay: string
  usedDisplay: string
  remainingDisplay: string
  weekCount: number
  totalRemaining: number
}

interface WeeklyClientTableProps {
  rows: WeeklyClientRow[]
}

export default function WeeklyClientTable({ rows }: WeeklyClientTableProps) {
  return (
    <table className={styles.table}>
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
          <tr key={row.clientId}>
            <td>{row.clientName}</td>
            <td>{row.packageDisplay}</td>
            <td>{row.usedDisplay}</td>
            <td className={row.totalRemaining <= 0 ? styles.textRedRemaining : ''}>
              {row.remainingDisplay}
            </td>
            <td>{row.weekCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
