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
      <div>Total classes this week: {totalClassesThisWeek}</div>
      <div>Rate applied: {Math.round(rate * 100)}%</div>
      {bonusIncome !== undefined && bonusIncome > 0 && (
        <div>Sales bonus: ${bonusIncome.toFixed(1)}</div>
      )}
      {lateFees !== undefined && lateFees > 0 && (
        <div>Late fees: ${lateFees.toFixed(1)}</div>
      )}
      {backfillAdjustment !== undefined && backfillAdjustment > 0 && (
        <div className={styles.incomeSummaryRow}>
          Backfill adjustment: -${backfillAdjustment.toFixed(1)}
          <div className={styles.tooltipContainer}>
            <span className={styles.tooltipIcon}>i</span>
            <div className={styles.tooltipBubble}>
              Some clients completed sessions before purchasing a package. These
              sessions were initially paid at the single-class rate. Once the
              client buys a package, those earlier sessions are retroactively
              applied to the package, and the difference between the
              single-class rate and the package rate is deducted from this
              week's income.
            </div>
          </div>
        </div>
      )}
      <div>Weekly income: ${finalWeeklyIncome.toFixed(1)}</div>
    </div>
  )
}
