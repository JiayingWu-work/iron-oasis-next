import type { IncomeRate } from '@/types'

/**
 * Initial income rates used when creating a new trainer.
 * Pre-filled in the form but must be explicitly saved.
 */
export const INITIAL_INCOME_RATES: Omit<IncomeRate, 'id' | 'trainerId'>[] = [
  { minClasses: 1, maxClasses: null, rate: 0.50 },
]

/**
 * Get the income rate for a given class count based on trainer's rate tiers.
 * Returns 0 if no rates are configured (should not happen in production).
 */
export function getRateForClassCount(
  incomeRates: IncomeRate[] | undefined,
  classCount: number,
): number {
  // Return 0 if no rates configured - this indicates a data issue
  if (!incomeRates || incomeRates.length === 0) {
    return 0
  }

  // Sort rates by minClasses to ensure we check in order
  const sortedRates = [...incomeRates].sort((a, b) => a.minClasses - b.minClasses)

  // Find the matching tier
  for (const tier of sortedRates) {
    const matchesMin = classCount >= tier.minClasses
    const matchesMax = tier.maxClasses === null || classCount <= tier.maxClasses

    if (matchesMin && matchesMax) {
      return tier.rate
    }
  }

  // If no tier matches (e.g., classCount is 0), use the first tier's rate
  return sortedRates[0].rate
}

/**
 * Get the active income rate tier for a given class count.
 * Returns the full tier object for UI highlighting purposes.
 * Returns undefined if no rates are configured.
 */
export function getActiveTier(
  incomeRates: IncomeRate[] | undefined,
  classCount: number,
): IncomeRate | undefined {
  if (!incomeRates || incomeRates.length === 0) {
    return undefined
  }

  // Sort rates by minClasses to ensure we check in order
  const sortedRates = [...incomeRates].sort((a, b) => a.minClasses - b.minClasses)

  for (const tier of sortedRates) {
    const matchesMin = classCount >= tier.minClasses
    const matchesMax = tier.maxClasses === null || classCount <= tier.maxClasses

    if (matchesMin && matchesMax) {
      return tier
    }
  }

  // If no tier matches (e.g., classCount is 0), return the first tier
  return sortedRates[0]
}

/**
 * Validate that income rate tiers cover all class counts from 1 to infinity.
 * Returns an error message if invalid, or null if valid.
 */
export function validateIncomeRates(
  rates: { minClasses: number; maxClasses: number | null; rate: number }[] | undefined,
): string | null {
  if (!rates || rates.length === 0) {
    return 'Please configure at least one pay rate tier'
  }

  // Filter out invalid rates (rate must be > 0)
  const validRates = rates.filter((r) => r.rate > 0)
  if (validRates.length === 0) {
    return 'Please configure at least one pay rate tier with a rate'
  }

  // Sort by minClasses
  const sorted = [...validRates].sort((a, b) => a.minClasses - b.minClasses)

  // First tier must start at 1
  if (sorted[0].minClasses !== 1) {
    return 'First tier must start at 1 class'
  }

  // Check for gaps between tiers
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    // Current tier must have a maxClasses (not the last tier)
    if (current.maxClasses === null) {
      return 'Only the last tier can have unlimited classes'
    }

    // Next tier must start right after current tier ends
    if (next.minClasses !== current.maxClasses + 1) {
      return `Gap in coverage: rate ${i + 1} ends at ${current.maxClasses} but rate ${i + 2} starts at ${next.minClasses}`
    }
  }

  // Last tier must go to infinity
  const lastTier = sorted[sorted.length - 1]
  if (lastTier.maxClasses !== null) {
    return 'Last tier must have unlimited classes (leave max empty)'
  }

  return null
}

/**
 * Format income rates for display (e.g., "1-12: 46% | 13+: 51%")
 * Returns "No rates configured" if no rates are defined.
 */
export function formatIncomeRates(
  incomeRates: IncomeRate[] | Omit<IncomeRate, 'id' | 'trainerId'>[] | undefined,
): string {
  if (!incomeRates || incomeRates.length === 0) {
    return 'No rates configured'
  }

  return incomeRates
    .map((tier) => {
      const range =
        tier.maxClasses === null
          ? `${tier.minClasses}+`
          : `${tier.minClasses}-${tier.maxClasses}`
      return `${range}: ${Math.round(tier.rate * 100)}%`
    })
    .join(' | ')
}
