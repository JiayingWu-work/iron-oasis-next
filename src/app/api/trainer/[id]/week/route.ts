import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getWeekRange } from '@/lib/date'

type DBTrainerRow = {
  id: number
  name: string
  tier: 1 | 2 | 3
}

type DBClientRow = {
  id: number
  name: string
  trainer_id: number
}

type DBPackageRow = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type DBSessionRow = {
  id: number
  date: string
  trainer_id: number
  client_id: number
  package_id: number
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // /api/trainer/1/week -> ["", "api", "trainer", "1", "week"]
  const parts = url.pathname.split('/').filter(Boolean)
  const trainerIndex = parts.indexOf('trainer')
  const trainerIdParam = trainerIndex >= 0 ? parts[trainerIndex + 1] : undefined

  const searchParams = url.searchParams
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!date) {
    return NextResponse.json(
      { error: 'date query param required' },
      { status: 400 },
    )
  }

  const trainerId = Number(trainerIdParam)

  if (!trainerIdParam || Number.isNaN(trainerId)) {
    return NextResponse.json(
      { error: `Invalid trainer id: ${trainerIdParam}` },
      { status: 400 },
    )
  }

  const { start, end } = getWeekRange(date)

  // 1) trainer
  const trainerRows = (await sql`
    SELECT id, name, tier
    FROM trainers
    WHERE id = ${trainerId}
  `) as DBTrainerRow[]

  const trainer = trainerRows[0]

  if (!trainer) {
    return NextResponse.json(
      { error: `Trainer not found for id=${trainerId}` },
      { status: 404 },
    )
  }

  // 2) clients
  const clientRows = (await sql`
    SELECT id, name, trainer_id
    FROM clients
    WHERE trainer_id = ${trainerId}
    ORDER BY name
  `) as DBClientRow[]

  const clientIds = clientRows.map((c) => c.id)

  // 3) packages
  const packageRows = clientIds.length
    ? ((await sql`
        SELECT *
        FROM packages
        WHERE client_id = ANY(${clientIds})
      `) as DBPackageRow[])
    : []

  // 4) sessions in this week
  const sessionRows = (await sql`
    SELECT *
    FROM sessions
    WHERE trainer_id = ${trainerId}
      AND date BETWEEN ${start} AND ${end}
  `) as DBSessionRow[]

  return NextResponse.json({
    trainer,
    clients: clientRows,
    packages: packageRows,
    sessions: sessionRows,
    weekStart: start,
    weekEnd: end,
  })
}
