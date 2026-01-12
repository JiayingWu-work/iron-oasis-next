import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { TrainingMode, Location } from '@/types'
import { getPricingSnapshotForTier } from '@/lib/pricing'

export async function GET(req: NextRequest) {
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

    // Check if is_active column exists and add it if not
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

    // Check if is_personal_client column exists and add it if not
    const isPersonalClientCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'is_personal_client'
      ) as exists
    `
    if (!isPersonalClientCheck[0]?.exists) {
      await sql`
        ALTER TABLE clients ADD COLUMN is_personal_client BOOLEAN NOT NULL DEFAULT false
      `
    }

    // Check for active filter in query params
    const url = new URL(req.url)
    const activeOnly = url.searchParams.get('active') === 'true'

    type ClientRow = {
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
      is_active: boolean
      location: Location
      is_personal_client: boolean
    }

    const rows = activeOnly
      ? ((await sql`
          SELECT id, name, trainer_id, secondary_trainer_id, mode,
                 tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, is_active, location,
                 COALESCE(is_personal_client, false) as is_personal_client
          FROM clients
          WHERE is_active = true
          ORDER BY name ASC
        `) as ClientRow[])
      : ((await sql`
          SELECT id, name, trainer_id, secondary_trainer_id, mode,
                 tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, is_active, location,
                 COALESCE(is_personal_client, false) as is_personal_client
          FROM clients
          ORDER BY name ASC
        `) as ClientRow[])

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
      isActive: row.is_active ?? true,
      location: row.location ?? 'west',
      isPersonalClient: row.is_personal_client ?? false,
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
    const { name, trainerId, secondaryTrainerId, mode, location: reqLocation, customPricing, customModePremium, isPersonalClient } = await req.json()
    const location = (reqLocation === 'east' ? 'east' : 'west') as Location
    const personalClient = isPersonalClient === true

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

    // Get pricing - use custom pricing if provided, otherwise use tier-based pricing
    let pricingSnapshot = await getPricingSnapshotForTier(trainerTier)

    if (customPricing && typeof customPricing === 'object') {
      const { price1_12, price13_20, price21Plus } = customPricing
      if (
        typeof price1_12 === 'number' && price1_12 > 0 &&
        typeof price13_20 === 'number' && price13_20 > 0 &&
        typeof price21Plus === 'number' && price21Plus > 0
      ) {
        // Use custom pricing
        pricingSnapshot = {
          ...pricingSnapshot,
          price1_12,
          price13_20,
          price21Plus,
        }
      } else {
        return NextResponse.json({ error: 'Invalid custom pricing values' }, { status: 400 })
      }
    }

    // Override mode premium if custom value is provided for 1v2 mode
    if (typeof customModePremium === 'number' && customModePremium >= 0) {
      pricingSnapshot = {
        ...pricingSnapshot,
        modePremium: customModePremium,
      }
    }

    const [row] = (await sql`
      INSERT INTO clients (
        name, trainer_id, secondary_trainer_id, mode,
        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location, is_personal_client
      )
      VALUES (
        ${name.trim()}, ${trainerId}, ${secondaryId}, ${trainingMode},
        ${trainerTier}, ${pricingSnapshot.price1_12}, ${pricingSnapshot.price13_20}, ${pricingSnapshot.price21Plus}, ${pricingSnapshot.modePremium}, NOW(), ${location}, ${personalClient}
      )
      RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location, is_personal_client
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
      location: Location
      is_personal_client: boolean
    }[]

    // Also insert initial pricing into client_price_history table with precise timestamp
    // This is wrapped in try-catch to not fail client creation if history table doesn't exist yet
    try {
      await sql`
        INSERT INTO client_price_history (client_id, effective_date, price_1_12, price_13_20, price_21_plus, mode_premium, reason)
        VALUES (${row.id}, ${row.created_at}::timestamptz, ${pricingSnapshot.price1_12}, ${pricingSnapshot.price13_20}, ${pricingSnapshot.price21Plus}, ${pricingSnapshot.modePremium}, 'initial')
      `
    } catch (err) {
      // Table might not exist yet - that's OK, will be created on first GET to /api/client-price-history
      console.warn('Could not insert into client_price_history (table may not exist yet):', err)
    }

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
      location: row.location,
      isActive: true,
      isPersonalClient: row.is_personal_client,
    })
  } catch (err) {
    console.error('Error creating client', err)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 },
    )
  }
}
