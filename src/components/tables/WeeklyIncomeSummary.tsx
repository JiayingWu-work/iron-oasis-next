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
    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.75rem' }}>
      <div>Total classes this week: {totalClassesThisWeek}</div>
      <div>Rate applied: {Math.round(rate * 100)}%</div>
      {bonusIncome !== undefined && bonusIncome > 0 && (
        <div>Sales bonus: ${bonusIncome.toFixed(1)}</div>
      )}
      {lateFees !== undefined && lateFees > 0 && (
        <div>Late fees: ${lateFees.toFixed(1)}</div>
      )}
      {backfillAdjustment !== undefined && backfillAdjustment > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Backfill adjustment: -${backfillAdjustment.toFixed(1)}
          <div className="tooltip-container">
            <span
              style={{
                position: 'absolute',
                top: '-8px', // shift upward
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 12,
                height: 12,
                fontSize: 8,
                borderRadius: '50%',
                background: '#e5e7eb',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              i
            </span>
            <div className="tooltip-bubble">
              Some clients completed sessions before purchasing a package. These
              sessions were initially paid at the single-class rate. Once the
              client buys a package, those earlier sessions are retroactively
              applied to the package, and the difference between the
              single-class rate and the package rate is deducted from this
              week’s income.
            </div>
          </div>
        </div>
      )}
      <div>Weekly income: ${finalWeeklyIncome.toFixed(1)}</div>
    </div>
  )
}
