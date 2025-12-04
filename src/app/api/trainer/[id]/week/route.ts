import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getWeekRange } from '@/lib/date'

type DBTrainerRow = {
  id: string
  name: string
  tier: 1 | 2 | 3
}

type DBClientRow = {
  id: string
  name: string
  trainer_id: string
}

type DBPackageRow = {
  id: string
  client_id: string
  trainer_id: string
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type DBSessionRow = {
  id: string
  date: string
  trainer_id: string
  client_id: string
  package_id: string
}

export async function GET(req: NextRequest) {
  // Parse trainerId from the URL path: /api/trainer/:id/week
  const url = new URL(req.url)
  const parts = url.pathname.split('/') // ["", "api", "trainer", "jiaying", "week"]
  const trainerId = parts[3] // "jiaying"

  const searchParams = url.searchParams
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { error: 'date query param required' },
      { status: 400 },
    )
  }

  const { start, end } = getWeekRange(date)

  // 1) load trainers, then find the one we need
  const allTrainers = (await sql`
    SELECT id, name, tier
    FROM trainers
  `) as DBTrainerRow[]

  const trainer = allTrainers.find((t) => t.id === trainerId)

  if (!trainer) {
    return NextResponse.json(
      { error: `Trainer not found for id=${trainerId}` },
      { status: 404 },
    )
  }

  // 2) clients for this trainer
  const clientRows = (await sql`
    SELECT id, name, trainer_id
    FROM clients
    WHERE trainer_id = ${trainerId}
    ORDER BY name
  `) as DBClientRow[]

  const clientIds = clientRows.map((c) => c.id)

  // 3) packages for those clients
  const packageRows: DBPackageRow[] = clientIds.length
    ? ((await sql`
        SELECT *
        FROM packages
        WHERE client_id = ANY(${clientIds})
      `) as DBPackageRow[])
    : []

  // 4) all sessions for this trainer
  const sessionRows = (await sql`
    SELECT *
    FROM sessions
    WHERE trainer_id = ${trainerId}
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
