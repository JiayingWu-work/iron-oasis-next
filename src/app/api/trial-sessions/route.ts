import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { ApiTrialSession } from '@/types/api'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { trainerId, date } = body

    if (!date || !trainerId) {
      return NextResponse.json(
        { error: 'trainerId and date are required' },
        { status: 400 },
      )
    }

    // Fetch trial session fee from settings, default to 15 if not found
    let trialFee = 15
    try {
      const settingsResult = (await sql`
        SELECT value FROM settings WHERE key = 'trial_session_fee'
      `) as { value: string }[]
      if (settingsResult.length > 0) {
        trialFee = parseFloat(settingsResult[0].value) || 15
      }
    } catch {
      // If settings table doesn't exist yet, use default
    }

    // Auto-create table if needed
    await sql`
      CREATE TABLE IF NOT EXISTS trial_sessions (
        id SERIAL PRIMARY KEY,
        trainer_id INTEGER NOT NULL,
        date DATE NOT NULL,
        amount NUMERIC NOT NULL
      )
    `

    const result = (await sql`
      INSERT INTO trial_sessions (trainer_id, date, amount)
      VALUES (${trainerId}, ${date}, ${trialFee})
      RETURNING id, trainer_id, date, amount;
    `) as ApiTrialSession[]

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('Error creating trial session:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd = searchParams.get('weekEnd')
    const trainerId = searchParams.get('trainerId')

    if (!weekStart || !weekEnd || !trainerId) {
      return NextResponse.json(
        { error: 'weekStart, weekEnd and trainerId are required' },
        { status: 400 },
      )
    }

    const rows = (await sql`
      SELECT id, trainer_id, date, amount
      FROM trial_sessions
      WHERE date >= ${weekStart}::date
        AND date <= ${weekEnd}::date
        AND trainer_id = ${Number(trainerId)}
      ORDER BY date ASC;
    `) as ApiTrialSession[]

    return NextResponse.json(rows)
  } catch (err) {
    console.error('Error fetching trial sessions:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
