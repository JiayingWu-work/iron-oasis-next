import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { TrainingMode } from '@/types'
import { getPricingSnapshotForTier } from '@/lib/pricing'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const clientId = parseInt(id, 10)

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const { name, mode, trainerId, secondaryTrainerId, location, customPricing, customModePremium } = await req.json()

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 },
      )
    }

    const trainingMode: TrainingMode =
      mode === '1v2' || mode === '2v2' ? mode : '1v1'

    // Validate location if provided
    const validLocation = location === 'west' || location === 'east' ? location : undefined

    // Define row type including pricing columns
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
      location: string
    }

    let row: ClientRow

    // If trainer IDs are provided, check if trainer is changing
    if (trainerId !== undefined) {
      const primaryId = typeof trainerId === 'number' ? trainerId : null
      const secondaryId =
        secondaryTrainerId === null
          ? null
          : typeof secondaryTrainerId === 'number'
            ? secondaryTrainerId
            : null

      // Check if primary trainer is changing
      const [existingClient] = (await sql`
        SELECT trainer_id FROM clients WHERE id = ${clientId}
      `) as { trainer_id: number }[]

      const trainerChanged = primaryId !== null && primaryId !== existingClient?.trainer_id

      if (trainerChanged && primaryId !== null) {
        // Trainer is changing - check if custom pricing is provided
        const [newTrainer] = (await sql`
          SELECT tier FROM trainers WHERE id = ${primaryId}
        `) as { tier: number }[]

        const newTier = (newTrainer?.tier ?? 1) as 1 | 2 | 3

        // Use custom pricing if provided, otherwise use tier-based pricing
        let pricingToUse: { price1_12: number; price13_20: number; price21Plus: number; modePremium: number } =
          await getPricingSnapshotForTier(newTier)

        if (customPricing && typeof customPricing === 'object') {
          const { price1_12, price13_20, price21Plus } = customPricing
          if (
            typeof price1_12 === 'number' && price1_12 > 0 &&
            typeof price13_20 === 'number' && price13_20 > 0 &&
            typeof price21Plus === 'number' && price21Plus > 0
          ) {
            pricingToUse = {
              ...pricingToUse,
              price1_12,
              price13_20,
              price21Plus,
            }
          } else {
            return NextResponse.json({ error: 'Invalid custom pricing values' }, { status: 400 })
          }
        }

        // Override mode premium if custom value is provided
        if (typeof customModePremium === 'number' && customModePremium >= 0) {
          pricingToUse = {
            ...pricingToUse,
            modePremium: customModePremium,
          }
        }

        const [result] = validLocation
          ? (await sql`
              UPDATE clients
              SET
                name = ${name.trim()},
                mode = ${trainingMode},
                trainer_id = ${primaryId},
                secondary_trainer_id = ${secondaryId},
                tier_at_signup = ${newTier},
                price_1_12 = ${pricingToUse.price1_12},
                price_13_20 = ${pricingToUse.price13_20},
                price_21_plus = ${pricingToUse.price21Plus},
                mode_premium = ${pricingToUse.modePremium},
                location = ${validLocation}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]
          : (await sql`
              UPDATE clients
              SET
                name = ${name.trim()},
                mode = ${trainingMode},
                trainer_id = ${primaryId},
                secondary_trainer_id = ${secondaryId},
                tier_at_signup = ${newTier},
                price_1_12 = ${pricingToUse.price1_12},
                price_13_20 = ${pricingToUse.price13_20},
                price_21_plus = ${pricingToUse.price21Plus},
                mode_premium = ${pricingToUse.modePremium}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]

        row = result
      } else if (customPricing && typeof customPricing === 'object' || typeof customModePremium === 'number') {
        // No trainer change but custom pricing or mode premium provided
        const price1_12 = customPricing?.price1_12
        const price13_20 = customPricing?.price13_20
        const price21Plus = customPricing?.price21Plus
        const hasCustomPricing = customPricing && typeof customPricing === 'object'

        if (hasCustomPricing && (
          typeof price1_12 !== 'number' || price1_12 <= 0 ||
          typeof price13_20 !== 'number' || price13_20 <= 0 ||
          typeof price21Plus !== 'number' || price21Plus <= 0
        )) {
          return NextResponse.json({ error: 'Invalid custom pricing values' }, { status: 400 })
        }

        // Build dynamic SET clause based on what's provided
        const hasModePremium = typeof customModePremium === 'number' && customModePremium >= 0

        const [result] = hasCustomPricing && hasModePremium
          ? validLocation
            ? (await sql`
                UPDATE clients
                SET
                  name = ${name.trim()},
                  mode = ${trainingMode},
                  trainer_id = COALESCE(${primaryId}, trainer_id),
                  secondary_trainer_id = ${secondaryId},
                  price_1_12 = ${price1_12},
                  price_13_20 = ${price13_20},
                  price_21_plus = ${price21Plus},
                  mode_premium = ${customModePremium},
                  location = ${validLocation}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]
            : (await sql`
                UPDATE clients
                SET
                  name = ${name.trim()},
                  mode = ${trainingMode},
                  trainer_id = COALESCE(${primaryId}, trainer_id),
                  secondary_trainer_id = ${secondaryId},
                  price_1_12 = ${price1_12},
                  price_13_20 = ${price13_20},
                  price_21_plus = ${price21Plus},
                  mode_premium = ${customModePremium}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]
          : hasCustomPricing
            ? validLocation
              ? (await sql`
                  UPDATE clients
                  SET
                    name = ${name.trim()},
                    mode = ${trainingMode},
                    trainer_id = COALESCE(${primaryId}, trainer_id),
                    secondary_trainer_id = ${secondaryId},
                    price_1_12 = ${price1_12},
                    price_13_20 = ${price13_20},
                    price_21_plus = ${price21Plus},
                    location = ${validLocation}
                  WHERE id = ${clientId}
                  RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                            tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
                `) as ClientRow[]
              : (await sql`
                  UPDATE clients
                  SET
                    name = ${name.trim()},
                    mode = ${trainingMode},
                    trainer_id = COALESCE(${primaryId}, trainer_id),
                    secondary_trainer_id = ${secondaryId},
                    price_1_12 = ${price1_12},
                    price_13_20 = ${price13_20},
                    price_21_plus = ${price21Plus}
                  WHERE id = ${clientId}
                  RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                            tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
                `) as ClientRow[]
            : validLocation
              ? (await sql`
                  UPDATE clients
                  SET
                    name = ${name.trim()},
                    mode = ${trainingMode},
                    trainer_id = COALESCE(${primaryId}, trainer_id),
                    secondary_trainer_id = ${secondaryId},
                    mode_premium = ${customModePremium},
                    location = ${validLocation}
                  WHERE id = ${clientId}
                  RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                            tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
                `) as ClientRow[]
              : (await sql`
                  UPDATE clients
                  SET
                    name = ${name.trim()},
                    mode = ${trainingMode},
                    trainer_id = COALESCE(${primaryId}, trainer_id),
                    secondary_trainer_id = ${secondaryId},
                    mode_premium = ${customModePremium}
                  WHERE id = ${clientId}
                  RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                            tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
                `) as ClientRow[]

        row = result
      } else {
        // Trainer not changing - just update name, mode, secondary trainer
        const [result] = validLocation
          ? (await sql`
              UPDATE clients
              SET
                name = ${name.trim()},
                mode = ${trainingMode},
                trainer_id = COALESCE(${primaryId}, trainer_id),
                secondary_trainer_id = ${secondaryId},
                location = ${validLocation}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]
          : (await sql`
              UPDATE clients
              SET
                name = ${name.trim()},
                mode = ${trainingMode},
                trainer_id = COALESCE(${primaryId}, trainer_id),
                secondary_trainer_id = ${secondaryId}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]

        row = result
      }
    } else if (customPricing && typeof customPricing === 'object' || typeof customModePremium === 'number') {
      // No trainer ID provided but custom pricing or mode premium provided
      const price1_12 = customPricing?.price1_12
      const price13_20 = customPricing?.price13_20
      const price21Plus = customPricing?.price21Plus
      const hasCustomPricing = customPricing && typeof customPricing === 'object'

      if (hasCustomPricing && (
        typeof price1_12 !== 'number' || price1_12 <= 0 ||
        typeof price13_20 !== 'number' || price13_20 <= 0 ||
        typeof price21Plus !== 'number' || price21Plus <= 0
      )) {
        return NextResponse.json({ error: 'Invalid custom pricing values' }, { status: 400 })
      }

      const hasModePremium = typeof customModePremium === 'number' && customModePremium >= 0

      const [result] = hasCustomPricing && hasModePremium
        ? validLocation
          ? (await sql`
              UPDATE clients
              SET name = ${name.trim()}, mode = ${trainingMode}, location = ${validLocation},
                  price_1_12 = ${price1_12}, price_13_20 = ${price13_20}, price_21_plus = ${price21Plus},
                  mode_premium = ${customModePremium}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]
          : (await sql`
              UPDATE clients
              SET name = ${name.trim()}, mode = ${trainingMode},
                  price_1_12 = ${price1_12}, price_13_20 = ${price13_20}, price_21_plus = ${price21Plus},
                  mode_premium = ${customModePremium}
              WHERE id = ${clientId}
              RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                        tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
            `) as ClientRow[]
        : hasCustomPricing
          ? validLocation
            ? (await sql`
                UPDATE clients
                SET name = ${name.trim()}, mode = ${trainingMode}, location = ${validLocation},
                    price_1_12 = ${price1_12}, price_13_20 = ${price13_20}, price_21_plus = ${price21Plus}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]
            : (await sql`
                UPDATE clients
                SET name = ${name.trim()}, mode = ${trainingMode},
                    price_1_12 = ${price1_12}, price_13_20 = ${price13_20}, price_21_plus = ${price21Plus}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]
          : validLocation
            ? (await sql`
                UPDATE clients
                SET name = ${name.trim()}, mode = ${trainingMode}, location = ${validLocation},
                    mode_premium = ${customModePremium}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]
            : (await sql`
                UPDATE clients
                SET name = ${name.trim()}, mode = ${trainingMode},
                    mode_premium = ${customModePremium}
                WHERE id = ${clientId}
                RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                          tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
              `) as ClientRow[]

      row = result
    } else {
      // Only update name, mode, and optionally location
      const [result] = validLocation
        ? (await sql`
            UPDATE clients
            SET name = ${name.trim()}, mode = ${trainingMode}, location = ${validLocation}
            WHERE id = ${clientId}
            RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                      tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
          `) as ClientRow[]
        : (await sql`
            UPDATE clients
            SET name = ${name.trim()}, mode = ${trainingMode}
            WHERE id = ${clientId}
            RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                      tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at, location
          `) as ClientRow[]

      row = result
    }

    if (!row) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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
    })
  } catch (err) {
    console.error('Error updating client', err)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 },
    )
  }
}
