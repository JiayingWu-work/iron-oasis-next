import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

import type { Location, IncomeRate } from '@/types'
import { validateIncomeRates, getCurrentWeekMonday, isMonday } from '@/lib/incomeRates'

type TrainerRow = {
  id: number
  name: string
  tier: 1 | 2 | 3
  email: string
  is_active: boolean
  location: Location
}

type IncomeRateRow = {
  id: number
  trainer_id: number
  min_classes: number
  max_classes: number | null
  rate: string // DECIMAL comes as string from DB
  effective_week: string | Date  // PostgreSQL DATE can come as Date object
}

// Normalize effective_week to string (YYYY-MM-DD)
function normalizeEffectiveWeek(value: string | Date): string {
  if (typeof value === 'string') return value
  // Date object - convert to YYYY-MM-DD
  return value.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    // Check if is_active column exists and add it if not
    const isActiveCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'trainers' AND column_name = 'is_active'
      ) as exists
    `
    if (!isActiveCheck[0]?.exists) {
      await sql`
        ALTER TABLE trainers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `
    }

    // Check for active filter in query params
    const url = new URL(req.url)
    const activeOnly = url.searchParams.get('active') === 'true'

    const rows = activeOnly
      ? ((await sql`
          SELECT id, name, tier, email, is_active, location
          FROM trainers
          WHERE is_active = true
          ORDER BY id;
        `) as TrainerRow[])
      : ((await sql`
          SELECT id, name, tier, email, is_active, location
          FROM trainers
          ORDER BY id;
        `) as TrainerRow[])

    // Fetch all income rates for all trainers
    const incomeRateRows = (await sql`
      SELECT id, trainer_id, min_classes, max_classes, rate, effective_week
      FROM trainer_income_rates
      ORDER BY trainer_id, effective_week DESC, min_classes ASC
    `) as IncomeRateRow[]

    // Group income rates by trainer_id, keeping only most recent effective week per trainer
    const ratesByTrainer = new Map<number, IncomeRate[]>()
    const mostRecentWeekByTrainer = new Map<number, string>()

    // First pass: find most recent effective week for each trainer (normalize to string)
    for (const row of incomeRateRows) {
      const normalizedWeek = normalizeEffectiveWeek(row.effective_week)
      const existing = mostRecentWeekByTrainer.get(row.trainer_id)
      if (!existing || normalizedWeek > existing) {
        mostRecentWeekByTrainer.set(row.trainer_id, normalizedWeek)
      }
    }

    // Second pass: collect only rates from most recent effective week
    for (const row of incomeRateRows) {
      const normalizedWeek = normalizeEffectiveWeek(row.effective_week)
      const mostRecentWeek = mostRecentWeekByTrainer.get(row.trainer_id)
      if (normalizedWeek !== mostRecentWeek) continue

      const rate: IncomeRate = {
        id: row.id,
        trainerId: row.trainer_id,
        minClasses: row.min_classes,
        maxClasses: row.max_classes,
        rate: parseFloat(row.rate),
        effectiveWeek: normalizedWeek,
      }
      const existing = ratesByTrainer.get(row.trainer_id) || []
      existing.push(rate)
      ratesByTrainer.set(row.trainer_id, existing)
    }

    const trainers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      email: row.email,
      isActive: row.is_active ?? true,
      location: row.location ?? 'west',
      incomeRates: ratesByTrainer.get(row.id) || [],
    }))

    return NextResponse.json({ trainers })
  } catch (err) {
    console.error('GET /api/trainers error', err)
    return NextResponse.json(
      { error: 'Failed to load trainers' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const tier = Number(body.tier)
    const location = (body.location === 'east' ? 'east' : 'west') as Location
    const incomeRates = body.incomeRates as { minClasses: number; maxClasses: number | null; rate: number }[] | undefined
    const effectiveWeek = body.effectiveWeek as string | undefined

    if (!name || ![1, 2, 3].includes(tier)) {
      return NextResponse.json(
        { error: 'name and tier (1|2|3) required' },
        { status: 400 },
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM trainers WHERE LOWER(email) = ${email}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A trainer with this email already exists' },
        { status: 400 },
      )
    }

    const rows = (await sql`
      INSERT INTO trainers (name, tier, email, location)
      VALUES (${name}, ${tier}, ${email}, ${location})
      RETURNING id, name, tier, email, location;
    `) as { id: number; name: string; tier: 1 | 2 | 3; email: string; location: Location }[]

    const trainerId = rows[0].id

    // Validate that income rates cover 1 to infinity with no gaps
    const ratesError = validateIncomeRates(incomeRates)
    if (ratesError) {
      return NextResponse.json(
        { error: ratesError },
        { status: 400 },
      )
    }

    // Use provided effective week or default to current week
    const rateEffectiveWeek = effectiveWeek || getCurrentWeekMonday()

    if (!isMonday(rateEffectiveWeek)) {
      return NextResponse.json(
        { error: 'Effective week must be a Monday' },
        { status: 400 },
      )
    }

    const insertedRates: IncomeRate[] = []

    for (const rate of incomeRates!) {
      const rateRows = (await sql`
        INSERT INTO trainer_income_rates (trainer_id, min_classes, max_classes, rate, effective_week)
        VALUES (${trainerId}, ${rate.minClasses}, ${rate.maxClasses}, ${rate.rate}, ${rateEffectiveWeek})
        RETURNING id, trainer_id, min_classes, max_classes, rate, effective_week
      `) as IncomeRateRow[]

      insertedRates.push({
        id: rateRows[0].id,
        trainerId: rateRows[0].trainer_id,
        minClasses: rateRows[0].min_classes,
        maxClasses: rateRows[0].max_classes,
        rate: parseFloat(rateRows[0].rate),
        effectiveWeek: normalizeEffectiveWeek(rateRows[0].effective_week),
      })
    }

    return NextResponse.json({
      ...rows[0],
      isActive: true,
      incomeRates: insertedRates,
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/trainers error', err)
    return NextResponse.json(
      { error: 'Failed to create trainer' },
      { status: 500 },
    )
  }
}
