import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getWeekRange } from '@/lib/date'
import type {
  ApiClient,
  ApiPackage,
  ApiSession,
  ApiLateFee,
  TrainerWeekResponse,
  ApiIncomeRate,
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

  // Auto-migrate: ensure mode_premium column exists on clients table
  const columnCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'mode_premium'
    ) as exists
  `
  if (!columnCheck[0]?.exists) {
    await sql`
      ALTER TABLE clients ADD COLUMN mode_premium NUMERIC NOT NULL DEFAULT 20
    `
  }

  // Auto-migrate: ensure is_active column exists on clients table
  const isActiveCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'is_active'
    ) as exists
  `
  if (!isActiveCheck[0]?.exists) {
    await sql`
      ALTER TABLE clients ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
    `
  }

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

  // 1b) income rates for this trainer
  const incomeRateRows = (await sql`
    SELECT id, trainer_id, min_classes, max_classes, rate
    FROM trainer_income_rates
    WHERE trainer_id = ${trainerId}
    ORDER BY min_classes
  `) as ApiIncomeRate[]

  // 2) clients for this trainer
  const clientRows = (await sql`
    SELECT id,
            name,
            trainer_id,
            secondary_trainer_id,
            mode,
            tier_at_signup,
            price_1_12,
            price_13_20,
            price_21_plus,
            mode_premium,
            created_at,
            is_active,
            location,
            COALESCE(is_personal_client, false) as is_personal_client
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
               mode,
               location
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
            mode,
            location_override
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
    incomeRates: incomeRateRows,
    weekStart: start,
    weekEnd: end,
  }

  return NextResponse.json(response)
}
