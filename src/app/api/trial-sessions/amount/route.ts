import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const DEFAULT_TRIAL_SESSION_FEE = '15'

export async function GET() {
  try {
    // Check if settings table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'settings'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      // Create table and seed with default
      await sql`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `
      await sql`
        INSERT INTO settings (key, value)
        VALUES ('trial_session_fee', ${DEFAULT_TRIAL_SESSION_FEE})
        ON CONFLICT (key) DO NOTHING
      `
    }

    const result = (await sql`
      SELECT value FROM settings WHERE key = 'trial_session_fee'
    `) as { value: string }[]

    const amount = result.length > 0 ? result[0].value : DEFAULT_TRIAL_SESSION_FEE

    return NextResponse.json({ amount: parseFloat(amount) })
  } catch (err) {
    console.error('GET /api/trial-sessions/amount error', err)
    return NextResponse.json(
      { error: 'Failed to load trial session fee' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount } = body as { amount: number }

    if (amount === undefined || isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: 'amount must be a non-negative number' },
        { status: 400 },
      )
    }

    // Upsert the setting
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('trial_session_fee', ${String(amount)})
      ON CONFLICT (key) DO UPDATE SET value = ${String(amount)}
    `

    return NextResponse.json({ amount })
  } catch (err) {
    console.error('PATCH /api/trial-sessions/amount error', err)
    return NextResponse.json(
      { error: 'Failed to update trial session fee' },
      { status: 500 },
    )
  }
}
