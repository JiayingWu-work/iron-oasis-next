import type { Trainer, TrainingMode, Client } from '@/types'

export interface PricingRow {
  tier: number
  sessions_min: number
  sessions_max: number | null
  price: number
  mode_1v2_premium: number
}

/** Pricing snapshot stored on the client */
export interface ClientPricing {
  price1_12: number
  price13_20: number
  price21Plus: number
  modePremium: number
}

// Default pricing values (used as fallback)
const DEFAULT_PRICING: PricingRow[] = [
  { tier: 1, sessions_min: 1, sessions_max: 12, price: 150, mode_1v2_premium: 20 },
  { tier: 1, sessions_min: 13, sessions_max: 20, price: 140, mode_1v2_premium: 20 },
  { tier: 1, sessions_min: 21, sessions_max: null, price: 130, mode_1v2_premium: 20 },
  { tier: 2, sessions_min: 1, sessions_max: 12, price: 165, mode_1v2_premium: 20 },
  { tier: 2, sessions_min: 13, sessions_max: 20, price: 155, mode_1v2_premium: 20 },
  { tier: 2, sessions_min: 21, sessions_max: null, price: 145, mode_1v2_premium: 20 },
  { tier: 3, sessions_min: 1, sessions_max: 12, price: 180, mode_1v2_premium: 20 },
  { tier: 3, sessions_min: 13, sessions_max: 20, price: 170, mode_1v2_premium: 20 },
  { tier: 3, sessions_min: 21, sessions_max: null, price: 160, mode_1v2_premium: 20 },
]

// In-memory cache for pricing data
let pricingCache: PricingRow[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

async function loadPricing(): Promise<PricingRow[]> {
  const now = Date.now()

  // Return cached data if still valid
  if (pricingCache && now - cacheTimestamp < CACHE_TTL) {
    return pricingCache
  }

  try {
    // Dynamically import sql to avoid client-side errors
    const { sql } = await import('@/lib/db')

    // Check if pricing table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pricing'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      // Table doesn't exist, return defaults
      pricingCache = DEFAULT_PRICING
      cacheTimestamp = now
      return DEFAULT_PRICING
    }

    const rows = (await sql`
      SELECT tier, sessions_min, sessions_max, price, mode_1v2_premium
      FROM pricing
      ORDER BY tier, sessions_min
    `) as PricingRow[]

    if (rows.length === 0) {
      pricingCache = DEFAULT_PRICING
      cacheTimestamp = now
      return DEFAULT_PRICING
    }

    pricingCache = rows
    cacheTimestamp = now
    return rows
  } catch {
    // On error, return cached data or defaults
    return pricingCache || DEFAULT_PRICING
  }
}

function findPrice(
  pricing: PricingRow[],
  trainerTier: Trainer['tier'],
  sessionsPurchased: number,
): number {
  // Find the matching pricing row
  for (const row of pricing) {
    if (row.tier !== trainerTier) continue

    const maxSessions = row.sessions_max ?? Infinity
    if (sessionsPurchased >= row.sessions_min && sessionsPurchased <= maxSessions) {
      return row.price
    }
  }

  // Fallback to default pricing logic if no match found
  let base: number
  if (sessionsPurchased <= 12) {
    switch (trainerTier) {
      case 1:
        base = 150
        break
      case 2:
        base = 165
        break
      case 3:
        base = 180
        break
    }
  } else if (sessionsPurchased <= 20) {
    switch (trainerTier) {
      case 1:
        base = 140
        break
      case 2:
        base = 155
        break
      case 3:
        base = 170
        break
    }
  } else {
    switch (trainerTier) {
      case 1:
        base = 130
        break
      case 2:
        base = 145
        break
      case 3:
        base = 160
        break
    }
  }
  return base
}

/**
 * Async version - fetches pricing from database
 * Use this in API routes and server components
 */
export async function getPricePerClassAsync(
  trainerTier: Trainer['tier'],
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
): Promise<number> {
  const pricing = await loadPricing()
  const base = findPrice(pricing, trainerTier, sessionsPurchased)

  // 1v2 = +$20 per class
  if (mode === '1v2') {
    return base + 20
  }

  // '1v1' and '2v2' use the base rate
  return base
}

/**
 * Sync version - uses provided pricing data, cached data, or defaults
 * Pass pricingData when calling from client-side with fetched pricing
 */
export function getPricePerClass(
  trainerTier: Trainer['tier'],
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
  pricingData?: PricingRow[],
): number {
  // Use provided data, cached data, or defaults (in that order)
  const pricing = pricingData || pricingCache || DEFAULT_PRICING
  const base = findPrice(pricing, trainerTier, sessionsPurchased)

  // 1v2 = +$20 per class
  if (mode === '1v2') {
    return base + 20
  }

  // '1v1' and '2v2' use the base rate
  return base
}

/**
 * Force refresh the pricing cache
 */
export async function refreshPricingCache(): Promise<void> {
  pricingCache = null
  cacheTimestamp = 0
  await loadPricing()
}

/**
 * Pre-load pricing cache - call this at app startup or before using sync version
 */
export async function preloadPricing(): Promise<void> {
  await loadPricing()
}

// ============================================================================
// Client-level pricing functions (use these for income calculations)
// ============================================================================

/**
 * Get price per class using client's locked-in pricing.
 * This should be used for all income calculations instead of getPricePerClass.
 */
export function getClientPricePerClass(
  client: Client | ClientPricing,
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
): number {
  // Handle both Client and ClientPricing types
  const pricing: ClientPricing =
    'price1_12' in client
      ? {
          price1_12: client.price1_12,
          price13_20: client.price13_20,
          price21Plus: client.price21Plus,
          modePremium: client.modePremium,
        }
      : client

  let base: number
  if (sessionsPurchased <= 12) {
    base = pricing.price1_12
  } else if (sessionsPurchased <= 20) {
    base = pricing.price13_20
  } else {
    base = pricing.price21Plus
  }

  // 1v2 mode adds premium per class (locked at client signup)
  if (mode === '1v2') {
    return base + pricing.modePremium
  }

  // '1v1' and '2v2' use the base rate
  return base
}

/**
 * Get pricing snapshot for a trainer's tier from the global pricing table.
 * Used when creating a new client or transferring a client to a new trainer.
 */
export async function getPricingSnapshotForTier(
  trainerTier: Trainer['tier'],
): Promise<ClientPricing> {
  const pricing = await loadPricing()

  // Find pricing row for this tier (use 1-12 bracket as they all share the same mode_1v2_premium)
  const tierRow = pricing.find((p) => p.tier === trainerTier && p.sessions_min === 1)

  const price1_12 = tierRow?.price ?? 150
  const price13_20 =
    pricing.find((p) => p.tier === trainerTier && p.sessions_min === 13)?.price ?? 140
  const price21Plus =
    pricing.find((p) => p.tier === trainerTier && p.sessions_min === 21)?.price ?? 130
  const modePremium = tierRow?.mode_1v2_premium ?? 20

  return { price1_12, price13_20, price21Plus, modePremium }
}
