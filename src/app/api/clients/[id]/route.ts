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

    const { name, mode, trainerId, secondaryTrainerId } = await req.json()

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 },
      )
    }

    const trainingMode: TrainingMode =
      mode === '1v2' || mode === '2v2' ? mode : '1v1'

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
        // Trainer is changing - recalculate pricing from new trainer's tier
        const [newTrainer] = (await sql`
          SELECT tier FROM trainers WHERE id = ${primaryId}
        `) as { tier: number }[]

        const newTier = (newTrainer?.tier ?? 1) as 1 | 2 | 3
        const newPricing = await getPricingSnapshotForTier(newTier)

        const [result] = (await sql`
          UPDATE clients
          SET
            name = ${name.trim()},
            mode = ${trainingMode},
            trainer_id = ${primaryId},
            secondary_trainer_id = ${secondaryId},
            tier_at_signup = ${newTier},
            price_1_12 = ${newPricing.price1_12},
            price_13_20 = ${newPricing.price13_20},
            price_21_plus = ${newPricing.price21Plus},
            mode_premium = ${newPricing.modePremium}
          WHERE id = ${clientId}
          RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                    tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
        `) as ClientRow[]

        row = result
      } else {
        // Trainer not changing - just update name, mode, secondary trainer
        const [result] = (await sql`
          UPDATE clients
          SET
            name = ${name.trim()},
            mode = ${trainingMode},
            trainer_id = COALESCE(${primaryId}, trainer_id),
            secondary_trainer_id = ${secondaryId}
          WHERE id = ${clientId}
          RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                    tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
        `) as ClientRow[]

        row = result
      }
    } else {
      // Only update name and mode
      const [result] = (await sql`
        UPDATE clients
        SET name = ${name.trim()}, mode = ${trainingMode}
        WHERE id = ${clientId}
        RETURNING id, name, trainer_id, secondary_trainer_id, mode,
                  tier_at_signup, price_1_12, price_13_20, price_21_plus, mode_premium, created_at
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
    })
  } catch (err) {
    console.error('Error updating client', err)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 },
    )
  }
}
