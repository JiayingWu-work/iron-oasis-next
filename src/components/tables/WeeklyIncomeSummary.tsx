import styles from './tables.module.css'

interface WeeklyIncomeSummaryProps {
  totalClassesThisWeek: number
  rate: number
  bonusIncome?: number
  lateFees?: number
  backfillAdjustment?: number
  finalWeeklyIncome: number
}

export default function WeeklyIncomeSummary({
  totalClassesThisWeek,
  rate,
  bonusIncome,
  lateFees,
  backfillAdjustment,
  finalWeeklyIncome,
}: WeeklyIncomeSummaryProps) {
  return (
    <div className={styles.incomeSummary}>
      <div>Classes this week: {totalClassesThisWeek}</div>
      <div>Rate: {Math.round(rate * 100)}%</div>
      {bonusIncome !== undefined && bonusIncome > 0 && (
        <div>Sales bonus: ${bonusIncome.toFixed(1)}</div>
      )}
      {lateFees !== undefined && lateFees > 0 && (
        <div>Late fees: ${lateFees.toFixed(1)}</div>
      )}
      {backfillAdjustment !== undefined && backfillAdjustment > 0 && (
        <div className={styles.incomeSummaryRow}>
          <span>Backfill: -${backfillAdjustment.toFixed(1)}</span>
          <div className={styles.tooltipContainer}>
            <span className={styles.tooltipIcon}>?</span>
            <div className={styles.tooltipBubble}>
              Sessions completed before a package purchase are retroactively
              applied, deducting the rate difference from this week.
            </div>
          </div>
        </div>
      )}
      <div className={styles.incomeSummaryTotal}>
        Weekly income: ${finalWeeklyIncome.toFixed(1)}
      </div>
    </div>
  )
}
