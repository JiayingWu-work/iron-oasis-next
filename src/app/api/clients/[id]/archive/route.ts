import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isMonday, getCurrentWeekMonday } from '@/lib/incomeRates'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const clientId = parseInt(id, 10)

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const { isActive, effectiveWeek } = await req.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 },
      )
    }

    // When archiving, require and validate effectiveWeek
    let archivedAt: string | null = null
    if (!isActive) {
      const archiveWeek = effectiveWeek || getCurrentWeekMonday()
      if (!isMonday(archiveWeek)) {
        return NextResponse.json(
          { error: 'Effective week must be a Monday' },
          { status: 400 },
        )
      }
      archivedAt = archiveWeek
    }

    const [row] = (await sql`
      UPDATE clients
      SET is_active = ${isActive}, archived_at = ${archivedAt}
      WHERE id = ${clientId}
      RETURNING id, name, is_active, archived_at
    `) as { id: number; name: string; is_active: boolean; archived_at: string | null }[]

    if (!row) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      archivedAt: row.archived_at,
    })
  } catch (err) {
    console.error('Error archiving/unarchiving client', err)
    return NextResponse.json(
      { error: 'Failed to update client archive status' },
      { status: 500 },
    )
  }
}
