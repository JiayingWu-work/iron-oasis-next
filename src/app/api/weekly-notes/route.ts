import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Auto-migrate: ensure weekly_notes table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_notes (
      id SERIAL PRIMARY KEY,
      trainer_id INTEGER NOT NULL,
      week_start DATE NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(trainer_id, week_start)
    )
  `
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const trainerId = url.searchParams.get('trainerId')
  const weekStart = url.searchParams.get('weekStart')

  if (!trainerId || !weekStart) {
    return NextResponse.json(
      { error: 'trainerId and weekStart query params required' },
      { status: 400 },
    )
  }

  await ensureTable()

  const rows = await sql`
    SELECT notes
    FROM weekly_notes
    WHERE trainer_id = ${Number(trainerId)}
      AND week_start = ${weekStart}
  `

  return NextResponse.json({ notes: rows[0]?.notes ?? '' })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { trainerId, weekStart, notes } = body

  if (!trainerId || !weekStart) {
    return NextResponse.json(
      { error: 'trainerId and weekStart are required' },
      { status: 400 },
    )
  }

  await ensureTable()

  await sql`
    INSERT INTO weekly_notes (trainer_id, week_start, notes, updated_at)
    VALUES (${Number(trainerId)}, ${weekStart}, ${notes ?? ''}, NOW())
    ON CONFLICT (trainer_id, week_start)
    DO UPDATE SET notes = ${notes ?? ''}, updated_at = NOW()
  `

  return NextResponse.json({ success: true })
}
