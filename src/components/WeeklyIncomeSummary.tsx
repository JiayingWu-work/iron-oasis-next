interface WeeklyIncomeSummaryProps {
  totalClassesThisWeek: number
  rate: number
  bonusIncome: number
  finalWeeklyIncome: number
}

export default function WeeklyIncomeSummary({
  totalClassesThisWeek,
  rate,
  bonusIncome,
  finalWeeklyIncome,
}: WeeklyIncomeSummaryProps) {
  return (
    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.75rem' }}>
      <div>Total classes this week: {totalClassesThisWeek}</div>
      <div>Rate applied: {Math.round(rate * 100)}%</div>
      <div>Sales bonus: ${bonusIncome.toFixed(1)}</div>
      <div>Weekly income: ${finalWeeklyIncome.toFixed(1)}</div>
    </div>
  )
}
