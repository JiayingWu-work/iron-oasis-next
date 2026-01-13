import type { IncomeRate } from '@/types'
import { getActiveTier } from '@/lib/incomeRates'
import styles from './tables.module.css'

/** Format price: show decimals only when needed ($77.00 → $77, $77.50 → $77.5) */
function formatPrice(amount: number): string {
  return `$${parseFloat(amount.toFixed(2))}`
}

interface WeeklyIncomeSummaryProps {
  totalClassesThisWeek: number
  rate: number
  bonusIncome?: number
  lateFees?: number
  backfillAdjustment?: number
  finalWeeklyIncome: number
  incomeRates?: IncomeRate[]
  isLoading?: boolean
}

/** Format a rate tier for display */
function formatTier(
  tier: { minClasses: number; maxClasses: number | null; rate: number },
): string {
  const range =
    tier.maxClasses === null
      ? `${tier.minClasses}+`
      : `${tier.minClasses}-${tier.maxClasses}`
  return `${range}: ${Math.round(tier.rate * 100)}%`
}

export default function WeeklyIncomeSummary({
  totalClassesThisWeek,
  rate,
  bonusIncome,
  lateFees,
  backfillAdjustment,
  finalWeeklyIncome,
  incomeRates,
  isLoading = false,
}: WeeklyIncomeSummaryProps) {
  const hasRates = incomeRates && incomeRates.length > 0
  const activeTier = getActiveTier(incomeRates, totalClassesThisWeek)

  return (
    <div className={styles.incomeSummary}>
      <div>Classes this week: {totalClassesThisWeek}</div>
      <div className={styles.rateDisplay}>
        <span>Rate: {Math.round(rate * 100)}%</span>
        {hasRates ? (
          <div className={styles.rateTiers}>
            {incomeRates.map((tier, idx) => {
              const isActive =
                activeTier &&
                tier.minClasses === activeTier.minClasses &&
                tier.rate === activeTier.rate
              return (
                <span
                  key={idx}
                  className={isActive ? styles.activeTier : styles.inactiveTier}
                >
                  {formatTier(tier)}
                </span>
              )
            })}
          </div>
        ) : !isLoading ? (
          <div className={styles.noRatesWarning}>
            No pay rates configured. Please update trainer settings.
          </div>
        ) : null}
      </div>
      {bonusIncome !== undefined && bonusIncome > 0 && (
        <div>Sales bonus: {formatPrice(bonusIncome)}</div>
      )}
      {lateFees !== undefined && lateFees > 0 && (
        <div>Late fees: {formatPrice(lateFees)}</div>
      )}
      {backfillAdjustment !== undefined && backfillAdjustment > 0 && (
        <div className={styles.incomeSummaryRow}>
          <span>Backfill: -{formatPrice(backfillAdjustment)}</span>
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
        Weekly income: {formatPrice(finalWeeklyIncome)}
      </div>
    </div>
  )
}
