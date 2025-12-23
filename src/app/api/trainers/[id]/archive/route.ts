import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const trainerId = parseInt(id, 10)

    if (isNaN(trainerId)) {
      return NextResponse.json({ error: 'Invalid trainer ID' }, { status: 400 })
    }

    const { isActive } = await req.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 },
      )
    }

    const [row] = (await sql`
      UPDATE trainers
      SET is_active = ${isActive}
      WHERE id = ${trainerId}
      RETURNING id, name, is_active
    `) as { id: number; name: string; is_active: boolean }[]

    if (!row) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    })
  } catch (err) {
    console.error('Error archiving/unarchiving trainer', err)
    return NextResponse.json(
      { error: 'Failed to update trainer archive status' },
      { status: 500 },
    )
  }
}
