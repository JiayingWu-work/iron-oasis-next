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

function getRemainingClassName(remaining: number): string {
  if (remaining <= 0) return styles.textRedRemaining
  if (remaining <= 2) return styles.textYellowWarning
  return ''
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
        {rows.map((row) => {
          const remainingClass = getRemainingClassName(row.totalRemaining)
          return (
            <tr key={row.clientId}>
              <td className={remainingClass || undefined}>{row.clientName}</td>
              <td>{row.packageDisplay}</td>
              <td>{row.usedDisplay}</td>
              <td className={remainingClass || undefined}>
                {row.remainingDisplay}
              </td>
              <td>{row.weekCount}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
