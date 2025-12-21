import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { TrainingMode } from '@/types'

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

    // Build update based on what fields are provided
    let row: {
      id: number
      name: string
      trainer_id: number
      secondary_trainer_id: number | null
      mode: TrainingMode | null
    }

    // If trainer IDs are provided, update them too
    if (trainerId !== undefined) {
      const primaryId = typeof trainerId === 'number' ? trainerId : null
      const secondaryId =
        secondaryTrainerId === null
          ? null
          : typeof secondaryTrainerId === 'number'
            ? secondaryTrainerId
            : null

      const [result] = (await sql`
        UPDATE clients
        SET
          name = ${name.trim()},
          mode = ${trainingMode},
          trainer_id = COALESCE(${primaryId}, trainer_id),
          secondary_trainer_id = ${secondaryId}
        WHERE id = ${clientId}
        RETURNING id, name, trainer_id, secondary_trainer_id, mode
      `) as typeof row[]

      row = result
    } else {
      // Only update name and mode
      const [result] = (await sql`
        UPDATE clients
        SET name = ${name.trim()}, mode = ${trainingMode}
        WHERE id = ${clientId}
        RETURNING id, name, trainer_id, secondary_trainer_id, mode
      `) as typeof row[]

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
    })
  } catch (err) {
    console.error('Error updating client', err)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 },
    )
  }
}
