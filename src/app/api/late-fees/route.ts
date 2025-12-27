import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { ApiLateFee, ApiLateFeeWithClient } from '@/types/api'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientId, trainerId, date } = body

    if (!clientId || !date || !trainerId) {
      return NextResponse.json(
        { error: 'clientId, trainerId and date are required' },
        { status: 400 },
      )
    }

    // Fetch late fee amount from settings, default to 45 if not found
    let lateFeeAmount = 45
    try {
      const settingsResult = (await sql`
        SELECT value FROM settings WHERE key = 'late_fee'
      `) as { value: string }[]
      if (settingsResult.length > 0) {
        lateFeeAmount = parseFloat(settingsResult[0].value) || 45
      }
    } catch {
      // If settings table doesn't exist yet, use default
    }

    const result = (await sql`
      INSERT INTO late_fees (client_id, trainer_id, date, amount)
      VALUES (${clientId}, ${trainerId}, ${date}, ${lateFeeAmount})
      RETURNING id, client_id, trainer_id, date, amount;
    `) as ApiLateFee[]

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('Error creating late fee:', err)
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
      SELECT lf.id,
             lf.client_id,
             lf.trainer_id,
             lf.date,
             lf.amount,
             c.name AS client_name
      FROM late_fees lf
      JOIN clients c ON c.id = lf.client_id
      WHERE lf.date >= ${weekStart}::date
        AND lf.date <= ${weekEnd}::date
        AND lf.trainer_id = ${Number(trainerId)}
      ORDER BY lf.date ASC;
    `) as ApiLateFeeWithClient[]

    return NextResponse.json(rows)
  } catch (err) {
    console.error('Error fetching late fees:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
