import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { TrainingMode } from '@/types'
import { getPricingSnapshotForTier } from '@/lib/pricing'

export async function GET() {
  try {
    // Check if mode_premium column exists and add it if not
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

    const rows = (await sql`
      SELECT id, name, trainer_id, secondary_trainer_id, mode,
             tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
      FROM clients
      ORDER BY name ASC
    `) as {
      id: number
      name: string
      trainer_id: number
      secondary_trainer_id: number | null
      mode: TrainingMode | null
      tier_at_signup: number
      price_1_12: number
      price_13_20: number
      price_21_plus: number
      mode_premium: number
      created_at: string
    }[]

    const clients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      trainerId: row.trainer_id,
      secondaryTrainerId: row.secondary_trainer_id,
      mode: row.mode ?? '1v1',
      tierAtSignup: row.tier_at_signup as 1 | 2 | 3,
      price1_12: Number(row.price_1_12),
      price13_20: Number(row.price_13_20),
      price21Plus: Number(row.price_21_plus),
      modePremium: Number(row.mode_premium),
      createdAt: row.created_at,
    }))

    return NextResponse.json(clients)
  } catch (err) {
    console.error('Error fetching clients', err)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, trainerId, secondaryTrainerId, mode } = await req.json()

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof trainerId !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const trainingMode: TrainingMode =
      mode === '1v2' || mode === '2v2' ? mode : '1v1'

    const secondaryId =
      typeof secondaryTrainerId === 'number' ? secondaryTrainerId : null

    // Look up trainer's tier to snapshot pricing
    const [trainer] = (await sql`
      SELECT tier FROM trainers WHERE id = ${trainerId}
    `) as { tier: number }[]

    const trainerTier = (trainer?.tier ?? 1) as 1 | 2 | 3

    // Get pricing snapshot for this trainer's tier
    const pricingSnapshot = await getPricingSnapshotForTier(trainerTier)

    const [row] = (await sql`
      INSERT INTO clients (
        name, trainer_id, secondary_trainer_id, mode,
        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
      )
      VALUES (
        ${name.trim()}, ${trainerId}, ${secondaryId}, ${trainingMode},
        ${trainerTier}, ${pricingSnapshot.price1_12}, ${pricingSnapshot.price13_20}, ${pricingSnapshot.price21Plus}, ${pricingSnapshot.modePremium}, NOW()
      )
      RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
    `) as {
      id: number
      name: string
      trainer_id: number
      secondary_trainer_id: number | null
      mode: TrainingMode | null
      tier_at_signup: number
      price_1_12: number
      price_13_20: number
      price_21_plus: number
      mode_premium: number
      created_at: string
    }[]

    return NextResponse.json({
      id: row.id,
      name: row.name,
      trainerId: row.trainer_id,
      secondaryTrainerId: row.secondary_trainer_id,
      mode: row.mode,
      tierAtSignup: row.tier_at_signup as 1 | 2 | 3,
      price1_12: Number(row.price_1_12),
      price13_20: Number(row.price_13_20),
      price21Plus: Number(row.price_21_plus),
      modePremium: Number(row.mode_premium),
      createdAt: row.created_at,
    })
  } catch (err) {
    console.error('Error creating client', err)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 },
    )
  }
}
