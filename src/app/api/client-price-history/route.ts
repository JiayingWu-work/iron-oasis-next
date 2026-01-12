import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export interface ClientPriceHistoryRow {
  id: number
  client_id: number
  effective_date: string
  price_1_12: number
  price_13_20: number
  price_21_plus: number
  mode_premium: number
  reason: string | null
  created_at: string
}

/**
 * Ensures the client_price_history table exists and migrates data if needed.
 * This is safe to call multiple times - it's idempotent.
 */
async function ensureTableAndMigrate() {
  // Check if table exists
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'client_price_history'
    ) as exists
  `

  if (!tableCheck[0]?.exists) {
    // Create the table with TIMESTAMPTZ for timezone-aware tracking
    await sql`
      CREATE TABLE IF NOT EXISTS client_price_history (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        effective_date TIMESTAMPTZ NOT NULL,
        price_1_12 NUMERIC NOT NULL,
        price_13_20 NUMERIC NOT NULL,
        price_21_plus NUMERIC NOT NULL,
        mode_premium NUMERIC NOT NULL DEFAULT 20,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create index for efficient lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_client_price_history_lookup
      ON client_price_history(client_id, effective_date)
    `
  } else {
    // Check if effective_date needs migration to TIMESTAMPTZ
    const columnType = await sql`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'client_price_history' AND column_name = 'effective_date'
    `

    if (columnType[0]?.data_type === 'date') {
      // Migrate from DATE to TIMESTAMPTZ
      console.log('Migrating effective_date from DATE to TIMESTAMPTZ...')

      // Drop the unique constraint if it exists
      await sql`
        ALTER TABLE client_price_history DROP CONSTRAINT IF EXISTS client_price_history_client_id_effective_date_key
      `

      // Change column type from DATE to TIMESTAMPTZ
      await sql`
        ALTER TABLE client_price_history ALTER COLUMN effective_date TYPE TIMESTAMPTZ USING effective_date::timestamptz
      `

      console.log('Migration complete: effective_date is now TIMESTAMPTZ')
    } else if (columnType[0]?.data_type === 'timestamp without time zone') {
      // Migrate from TIMESTAMP to TIMESTAMPTZ (treat existing values as UTC)
      console.log('Migrating effective_date from TIMESTAMP to TIMESTAMPTZ...')

      await sql`
        ALTER TABLE client_price_history ALTER COLUMN effective_date TYPE TIMESTAMPTZ USING effective_date AT TIME ZONE 'UTC'
      `

      console.log('Migration complete: effective_date is now TIMESTAMPTZ')
    }
  }

  // Always check if migration is needed (table might exist but be empty)
  const countCheck = await sql`
    SELECT COUNT(*) as count FROM client_price_history
  `

  if (Number(countCheck[0]?.count) === 0) {
    // Migrate existing client data using their created_at timestamp
    await sql`
      INSERT INTO client_price_history (client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason)
      SELECT id, created_at, price_1_12, price_13_20, price_21_plus, COALESCE(mode_premium, 20), 'initial'
      FROM clients
    `
    console.log('Migrated existing client pricing data to client_price_history table')
  }
}

/**
 * GET /api/client-price-history
 * Query params:
 *   - clientId (required): The client ID to get history for
 *   - date (optional): Get the pricing effective at this date
 */
export async function GET(req: NextRequest) {
  try {
    await ensureTableAndMigrate()

    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId')
    const date = url.searchParams.get('date')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    const clientIdNum = parseInt(clientId, 10)
    if (isNaN(clientIdNum)) {
      return NextResponse.json(
        { error: 'clientId must be a number' },
        { status: 400 }
      )
    }

    if (date) {
      // Get pricing effective at a specific date (find most recent entry on or before end of that day in Eastern time)
      // Convert UTC timestamp to Eastern time for comparison against local business date
      const rows = await sql`
        SELECT id, client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason, created_at
        FROM client_price_history
        WHERE client_id = ${clientIdNum}
          AND (effective_date AT TIME ZONE 'America/New_York')::date <= ${date}::date
        ORDER BY effective_date DESC
        LIMIT 1
      ` as ClientPriceHistoryRow[]

      if (rows.length === 0) {
        // No price history found, fall back to client record
        const clientRows = await sql`
          SELECT price_1_12, price_13_20, price_21_plus, COALESCE(mode_premium, 20) as mode_premium
          FROM clients
          WHERE id = ${clientIdNum}
        ` as { price_1_12: number; price_13_20: number; price_21_plus: number; mode_premium: number }[]

        if (clientRows.length === 0) {
          return NextResponse.json(
            { error: 'Client not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          pricing: {
            price1_12: Number(clientRows[0].price_1_12),
            price13_20: Number(clientRows[0].price_13_20),
            price21Plus: Number(clientRows[0].price_21_plus),
            modePremium: Number(clientRows[0].mode_premium),
          },
          source: 'client_fallback',
        })
      }

      return NextResponse.json({
        pricing: {
          id: rows[0].id,
          clientId: rows[0].client_id,
          effectiveDate: rows[0].effective_date,
          price1_12: Number(rows[0].price_1_12),
          price13_20: Number(rows[0].price_13_20),
          price21Plus: Number(rows[0].price_21_plus),
          modePremium: Number(rows[0].mode_premium),
          reason: rows[0].reason,
          createdAt: rows[0].created_at,
        },
        source: 'price_history',
      })
    }

    // Get all price history for this client
    const rows = await sql`
      SELECT id, client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason, created_at
      FROM client_price_history
      WHERE client_id = ${clientIdNum}
      ORDER BY effective_date DESC
    ` as ClientPriceHistoryRow[]

    return NextResponse.json({
      history: rows.map(row => ({
        id: row.id,
        clientId: row.client_id,
        effectiveDate: row.effective_date,
        price1_12: Number(row.price_1_12),
        price13_20: Number(row.price_13_20),
        price21Plus: Number(row.price_21_plus),
        modePremium: Number(row.mode_premium),
        reason: row.reason,
        createdAt: row.created_at,
      })),
    })
  } catch (err) {
    console.error('GET /api/client-price-history error', err)
    return NextResponse.json(
      { error: 'Failed to get price history' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/client-price-history
 * Add a new pricing entry for a client.
 * Body: { clientId, effectiveDate, price1_12, price13_20, price21Plus, modePremium?, reason? }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureTableAndMigrate()

    const body = await req.json()
    const { clientId, effectiveDate, price1_12, price13_20, price21Plus, modePremium, reason } = body

    // Validate required fields
    if (typeof clientId !== 'number') {
      return NextResponse.json(
        { error: 'clientId must be a number' },
        { status: 400 }
      )
    }

    if (!effectiveDate || typeof effectiveDate !== 'string') {
      return NextResponse.json(
        { error: 'effectiveDate is required (YYYY-MM-DD or ISO timestamp format)' },
        { status: 400 }
      )
    }

    if (typeof price1_12 !== 'number' || price1_12 < 0) {
      return NextResponse.json(
        { error: 'price1_12 must be a non-negative number' },
        { status: 400 }
      )
    }

    if (typeof price13_20 !== 'number' || price13_20 < 0) {
      return NextResponse.json(
        { error: 'price13_20 must be a non-negative number' },
        { status: 400 }
      )
    }

    if (typeof price21Plus !== 'number' || price21Plus < 0) {
      return NextResponse.json(
        { error: 'price21Plus must be a non-negative number' },
        { status: 400 }
      )
    }

    const finalModePremium = typeof modePremium === 'number' ? modePremium : 20

    // Insert new price history entry with timestamp
    const rows = await sql`
      INSERT INTO client_price_history (client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason)
      VALUES (${clientId}, ${effectiveDate}::timestamp, ${price1_12}, ${price13_20}, ${price21Plus}, ${finalModePremium}, ${reason || null})
      RETURNING id, client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason, created_at
    ` as ClientPriceHistoryRow[]

    return NextResponse.json({
      priceHistory: {
        id: rows[0].id,
        clientId: rows[0].client_id,
        effectiveDate: rows[0].effective_date,
        price1_12: Number(rows[0].price_1_12),
        price13_20: Number(rows[0].price_13_20),
        price21Plus: Number(rows[0].price_21_plus),
        modePremium: Number(rows[0].mode_premium),
        reason: rows[0].reason,
        createdAt: rows[0].created_at,
      },
    })
  } catch (err) {
    console.error('POST /api/client-price-history error', err)
    return NextResponse.json(
      { error: 'Failed to add price history' },
      { status: 500 }
    )
  }
}
