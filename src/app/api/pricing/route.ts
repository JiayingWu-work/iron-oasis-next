import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { refreshPricingCache } from '@/lib/pricing'

interface PricingRow {
  tier: number
  sessions_min: number
  sessions_max: number | null
  price: number
  mode_1v2_premium: number
}

// Default pricing values (used if table doesn't exist or is empty)
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

export async function GET() {
  try {
    // Check if pricing table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pricing'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      // Create table and seed with defaults
      await sql`
        CREATE TABLE IF NOT EXISTS pricing (
          id SERIAL PRIMARY KEY,
          tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
          sessions_min INTEGER NOT NULL,
          sessions_max INTEGER,
          price INTEGER NOT NULL,
          mode_1v2_premium INTEGER NOT NULL DEFAULT 20,
          UNIQUE(tier, sessions_min)
        )
      `

      // Insert default values
      for (const row of DEFAULT_PRICING) {
        await sql`
          INSERT INTO pricing (tier, sessions_min, sessions_max, price, mode_1v2_premium)
          VALUES (${row.tier}, ${row.sessions_min}, ${row.sessions_max}, ${row.price}, ${row.mode_1v2_premium})
        `
      }
    }

    // Check if mode_1v2_premium column exists and add it if not
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'pricing' AND column_name = 'mode_1v2_premium'
      ) as exists
    `
    if (!columnCheck[0]?.exists) {
      await sql`
        ALTER TABLE pricing ADD COLUMN mode_1v2_premium INTEGER NOT NULL DEFAULT 20
      `
    }

    const rows = (await sql`
      SELECT tier, sessions_min, sessions_max, price, mode_1v2_premium
      FROM pricing
      ORDER BY tier, sessions_min
    `) as PricingRow[]

    // If empty, seed with defaults
    if (rows.length === 0) {
      for (const row of DEFAULT_PRICING) {
        await sql`
          INSERT INTO pricing (tier, sessions_min, sessions_max, price, mode_1v2_premium)
          VALUES (${row.tier}, ${row.sessions_min}, ${row.sessions_max}, ${row.price}, ${row.mode_1v2_premium})
        `
      }
      return NextResponse.json({ pricing: DEFAULT_PRICING })
    }

    return NextResponse.json({ pricing: rows })
  } catch (err) {
    console.error('GET /api/pricing error', err)
    return NextResponse.json(
      { error: 'Failed to load pricing' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { pricing } = body as { pricing: PricingRow[] }

    if (!Array.isArray(pricing) || pricing.length === 0) {
      return NextResponse.json(
        { error: 'pricing array is required' },
        { status: 400 },
      )
    }

    // Validate all entries
    for (const row of pricing) {
      if (![1, 2, 3].includes(row.tier)) {
        return NextResponse.json(
          { error: 'tier must be 1, 2, or 3' },
          { status: 400 },
        )
      }
      if (typeof row.price !== 'number' || row.price < 0) {
        return NextResponse.json(
          { error: 'price must be a non-negative number' },
          { status: 400 },
        )
      }
      if (
        row.mode_1v2_premium !== undefined &&
        (typeof row.mode_1v2_premium !== 'number' || row.mode_1v2_premium < 0)
      ) {
        return NextResponse.json(
          { error: 'mode_1v2_premium must be a non-negative number' },
          { status: 400 },
        )
      }
    }

    // Upsert each pricing row (insert or update)
    for (const row of pricing) {
      await sql`
        INSERT INTO pricing (tier, sessions_min, sessions_max, price, mode_1v2_premium)
        VALUES (${row.tier}, ${row.sessions_min}, ${row.sessions_max}, ${row.price}, ${row.mode_1v2_premium ?? 20})
        ON CONFLICT (tier, sessions_min)
        DO UPDATE SET
          price = EXCLUDED.price,
          sessions_max = EXCLUDED.sessions_max,
          mode_1v2_premium = EXCLUDED.mode_1v2_premium
      `
    }

    // Refresh the pricing cache so getPricePerClass uses new values
    await refreshPricingCache()

    // Return updated pricing
    const rows = (await sql`
      SELECT tier, sessions_min, sessions_max, price, mode_1v2_premium
      FROM pricing
      ORDER BY tier, sessions_min
    `) as PricingRow[]

    return NextResponse.json({ pricing: rows })
  } catch (err) {
    console.error('PATCH /api/pricing error', err)
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 },
    )
  }
}
