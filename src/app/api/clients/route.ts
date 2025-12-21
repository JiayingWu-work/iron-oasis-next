import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { TrainingMode } from '@/types'

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, name, trainer_id, secondary_trainer_id, mode
      FROM clients
      ORDER BY name ASC
    `) as {
      id: number
      name: string
      trainer_id: number
      secondary_trainer_id: number | null
      mode: TrainingMode | null
    }[]

    const clients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      trainerId: row.trainer_id,
      secondaryTrainerId: row.secondary_trainer_id,
      mode: row.mode ?? '1v1',
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

    const [row] = (await sql`
      INSERT INTO clients (name, trainer_id, secondary_trainer_id, mode)
      VALUES (${name.trim()}, ${trainerId}, ${secondaryId}, ${trainingMode})
      RETURNING id, name, trainer_id, secondary_trainer_id, mode
    `) as {
      id: number
      name: string
      trainer_id: number
      secondary_trainer_id: number | null
      mode: TrainingMode | null
    }[]

    return NextResponse.json({
      id: row.id,
      name: row.name,
      trainerId: row.trainer_id,
      secondaryTrainerId: row.secondary_trainer_id,
      mode: row.mode,
    })
  } catch (err) {
    console.error('Error creating client', err)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 },
    )
  }
}
