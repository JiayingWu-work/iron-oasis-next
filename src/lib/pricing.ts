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

/** Price history entry for a client */
export interface ClientPriceHistory {
  id: number
  clientId: number
  effectiveDate: string
  price1_12: number
  price13_20: number
  price21Plus: number
  modePremium: number
  reason: string | null
}

// In-memory cache for client price history (keyed by clientId)
const priceHistoryCache: Map<number, ClientPriceHistory[]> = new Map()
let priceHistoryCacheTimestamp: number = 0
const PRICE_HISTORY_CACHE_TTL = 60000 // 1 minute cache

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

// ============================================================================
// Client Price History Functions (for historical pricing lookups)
// ============================================================================

// Business timezone for price history comparisons (Eastern Time)
const BUSINESS_TIMEZONE = 'America/New_York'

/**
 * Convert a UTC timestamp to a date string (YYYY-MM-DD) in Eastern Time.
 * This is used to compare price history effective dates against session dates.
 */
function getEasternDateFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  // 'en-CA' locale gives YYYY-MM-DD format
  return date.toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE })
}

/**
 * Load all price history for multiple clients (batch loading for efficiency)
 * Called at the start of income calculations to preload cache
 */
export async function preloadClientPriceHistory(clientIds: number[]): Promise<void> {
  if (clientIds.length === 0) return

  const now = Date.now()

  // Check if cache is still valid
  if (now - priceHistoryCacheTimestamp < PRICE_HISTORY_CACHE_TTL) {
    // Check if all requested clients are in cache
    const allCached = clientIds.every(id => priceHistoryCache.has(id))
    if (allCached) return
  }

  try {
    const { sql } = await import('@/lib/db')

    const rows = await sql`
      SELECT id, client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason
      FROM client_price_history
      WHERE client_id = ANY(${clientIds})
      ORDER BY client_id, effective_date DESC
    ` as {
      id: number
      client_id: number
      effective_date: string
      price_1_12: number
      price_13_20: number
      price_21_plus: number
      mode_premium: number
      reason: string | null
    }[]

    // Group by client ID and update cache
    const grouped: Map<number, ClientPriceHistory[]> = new Map()
    for (const row of rows) {
      const entry: ClientPriceHistory = {
        id: row.id,
        clientId: row.client_id,
        effectiveDate: row.effective_date,
        price1_12: Number(row.price_1_12),
        price13_20: Number(row.price_13_20),
        price21Plus: Number(row.price_21_plus),
        modePremium: Number(row.mode_premium),
        reason: row.reason,
      }

      if (!grouped.has(row.client_id)) {
        grouped.set(row.client_id, [])
      }
      grouped.get(row.client_id)!.push(entry)
    }

    // Update cache
    for (const [clientId, history] of grouped) {
      priceHistoryCache.set(clientId, history)
    }

    // Mark clients with no history (they'll fall back to client record)
    for (const clientId of clientIds) {
      if (!grouped.has(clientId)) {
        priceHistoryCache.set(clientId, [])
      }
    }

    priceHistoryCacheTimestamp = now
  } catch (err) {
    console.error('Failed to preload client price history:', err)
    // Don't throw - we'll fall back to client records
  }
}

/**
 * Get the pricing that was effective for a client at a specific date.
 * Uses cache if available, otherwise falls back to client record.
 *
 * @param clientId - The client ID
 * @param date - The date to get pricing for (YYYY-MM-DD)
 * @param clientFallback - The client object to fall back to if no history found
 * @returns ClientPricing object
 */
export function getClientPricingAtDate(
  clientId: number,
  date: string,
  clientFallback: Client | ClientPricing,
): ClientPricing {
  const history = priceHistoryCache.get(clientId)

  if (history && history.length > 0) {
    // Find the most recent entry that's on or before the given date in Eastern Time
    // History is sorted by effective_date DESC
    // Convert effective_date (UTC) to Eastern Time date for comparison

    for (const entry of history) {
      const entryEasternDate = getEasternDateFromTimestamp(entry.effectiveDate)
      if (entryEasternDate <= date) {
        return {
          price1_12: entry.price1_12,
          price13_20: entry.price13_20,
          price21Plus: entry.price21Plus,
          modePremium: entry.modePremium,
        }
      }
    }

    // If date is before all history entries, use the oldest entry
    // (shouldn't happen normally, but safe fallback)
    const oldest = history[history.length - 1]
    return {
      price1_12: oldest.price1_12,
      price13_20: oldest.price13_20,
      price21Plus: oldest.price21Plus,
      modePremium: oldest.modePremium,
    }
  }

  // No history in cache - fall back to client record
  if ('price1_12' in clientFallback) {
    return {
      price1_12: clientFallback.price1_12,
      price13_20: clientFallback.price13_20,
      price21Plus: clientFallback.price21Plus,
      modePremium: clientFallback.modePremium,
    }
  }

  return clientFallback
}

/**
 * Get price per class for a client at a specific date.
 * This is the date-aware version of getClientPricePerClass.
 */
export function getClientPricePerClassAtDate(
  clientId: number,
  date: string,
  clientFallback: Client | ClientPricing,
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
): number {
  const pricing = getClientPricingAtDate(clientId, date, clientFallback)
  return getClientPricePerClass(pricing, sessionsPurchased, mode)
}

/**
 * Clear the price history cache (useful for testing or after updates)
 */
export function clearPriceHistoryCache(): void {
  priceHistoryCache.clear()
  priceHistoryCacheTimestamp = 0
}

// ============================================================================
// Client-side pricing lookup (using passed-in price history data)
// ============================================================================

/**
 * Build a lookup map from client price history array.
 * Returns a Map<clientId, ClientPriceHistory[]> with history sorted by effectiveDate DESC.
 */
export function buildPriceHistoryLookup(
  priceHistory: ClientPriceHistory[],
): Map<number, ClientPriceHistory[]> {
  const lookup = new Map<number, ClientPriceHistory[]>()

  for (const entry of priceHistory) {
    if (!lookup.has(entry.clientId)) {
      lookup.set(entry.clientId, [])
    }
    lookup.get(entry.clientId)!.push(entry)
  }

  // Sort each client's history by effectiveDate DESC
  for (const [, history] of lookup) {
    history.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
  }

  return lookup
}

/**
 * Get the pricing that was effective for a client at a specific date.
 * Uses the provided lookup map (built from API response).
 *
 * @param clientId - The client ID
 * @param date - The date to get pricing for (YYYY-MM-DD)
 * @param priceHistoryLookup - Map from buildPriceHistoryLookup
 * @param clientFallback - The client object to fall back to if no history found
 * @returns ClientPricing object
 */
export function getClientPricingAtDateFromLookup(
  clientId: number,
  date: string,
  priceHistoryLookup: Map<number, ClientPriceHistory[]>,
  clientFallback: Client | ClientPricing,
): ClientPricing {
  const history = priceHistoryLookup.get(clientId)

  if (history && history.length > 0) {
    // Find the most recent entry that's on or before the given date in Eastern Time
    // History is sorted by effectiveDate DESC
    // Convert effective_date (UTC) to Eastern Time date for comparison

    for (const entry of history) {
      const entryEasternDate = getEasternDateFromTimestamp(entry.effectiveDate)
      if (entryEasternDate <= date) {
        return {
          price1_12: entry.price1_12,
          price13_20: entry.price13_20,
          price21Plus: entry.price21Plus,
          modePremium: entry.modePremium,
        }
      }
    }

    // If date is before all history entries, use the oldest entry
    const oldest = history[history.length - 1]
    return {
      price1_12: oldest.price1_12,
      price13_20: oldest.price13_20,
      price21Plus: oldest.price21Plus,
      modePremium: oldest.modePremium,
    }
  }

  // No history found - fall back to client record
  if ('price1_12' in clientFallback) {
    return {
      price1_12: clientFallback.price1_12,
      price13_20: clientFallback.price13_20,
      price21Plus: clientFallback.price21Plus,
      modePremium: clientFallback.modePremium,
    }
  }

  return clientFallback
}

/**
 * Get price per class for a client at a specific date using a lookup map.
 * This is the client-side version that uses passed-in price history.
 */
export function getClientPricePerClassWithHistory(
  clientId: number,
  date: string,
  priceHistoryLookup: Map<number, ClientPriceHistory[]>,
  clientFallback: Client | ClientPricing,
  sessionsPurchased: number,
  mode: TrainingMode = '1v1',
): number {
  const pricing = getClientPricingAtDateFromLookup(clientId, date, priceHistoryLookup, clientFallback)
  return getClientPricePerClass(pricing, sessionsPurchased, mode)
}
