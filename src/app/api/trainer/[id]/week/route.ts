import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getWeekRange } from '@/lib/date'
import type {
  ApiClient,
  ApiPackage,
  ApiSession,
  ApiLateFee,
  TrainerWeekResponse,
} from '@/types/api'
import { Trainer } from '@/types'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // /api/trainer/1/week -> ["", "api", "trainer", "1", "week"] -> ["api","trainer","1","week"]
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
  `) as Trainer[]

  const trainer = trainerRows[0]

  if (!trainer) {
    return NextResponse.json(
      { error: `Trainer not found for id=${trainerId}` },
      { status: 404 },
    )
  }

  // 2) clients for this trainer
  const clientRows = (await sql`
    SELECT id,
            name,
            trainer_id,
            secondary_trainer_id,
            mode
    FROM clients
    WHERE trainer_id = ${trainerId}
        OR secondary_trainer_id = ${trainerId}
        OR id IN (
            SELECT DISTINCT client_id
            FROM sessions
            WHERE trainer_id = ${trainerId}
        )
    ORDER BY name
    `) as ApiClient[]

  const clientIds = clientRows.map((c) => c.id)

  // 3) all packages for those clients
  const packageRows: ApiPackage[] = clientIds.length
    ? ((await sql`
        SELECT id,
               client_id,
               trainer_id,
               sessions_purchased,
               start_date,
               sales_bonus,
               mode
        FROM packages
        WHERE client_id = ANY(${clientIds})
      `) as ApiPackage[])
    : []

  // 4) all sessions for these clients (any trainer) – global usage
  const sessionRows = (await sql`
    SELECT id,
            date,
            trainer_id,
            client_id,
            package_id,
            mode
    FROM sessions
    WHERE client_id = ANY(${clientIds})
    ORDER BY date ASC, id ASC
    `) as ApiSession[]

  // 5) late fees in this week (for this trainer)
  const lateFeeRows = (await sql`
    SELECT id,
           client_id,
           trainer_id,
           date,
           amount
    FROM late_fees
    WHERE trainer_id = ${trainerId}
      AND date BETWEEN ${start} AND ${end}
  `) as ApiLateFee[]

  const response: TrainerWeekResponse = {
    trainer,
    clients: clientRows,
    packages: packageRows,
    sessions: sessionRows,
    lateFees: lateFeeRows,
    weekStart: start,
    weekEnd: end,
  }

  return NextResponse.json(response)
}
