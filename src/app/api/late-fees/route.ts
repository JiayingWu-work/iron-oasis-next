import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type DBLateFeeRow = {
  id: number
  client_id: number
  trainer_id: number
  date: string
  amount: number
}

type DBLateFeeWithClientRow = DBLateFeeRow & {
  client_name: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientId, trainerId, date } = body

    // trainerId is required now
    if (!clientId || !date || !trainerId) {
      return NextResponse.json(
        { error: 'clientId, trainerId and date are required' },
        { status: 400 },
      )
    }

    const result = (await sql`
      INSERT INTO late_fees (client_id, trainer_id, date, amount)
      VALUES (${clientId}, ${trainerId}, ${date}, 45)
      RETURNING id, client_id, trainer_id, date, amount;
    `) as DBLateFeeRow[]

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('Error creating late fee:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// GET late fees for a week – always filtered by trainer
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
      SELECT
        lf.id,
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
    `) as DBLateFeeWithClientRow[]

    return NextResponse.json(rows)
  } catch (err) {
    console.error('Error fetching late fees:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
