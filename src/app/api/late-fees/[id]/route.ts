import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const idStr = parts[parts.length - 1]
  const id = Number(idStr)

  if (!idStr || Number.isNaN(id)) {
    return NextResponse.json(
      { error: `Invalid late fee id: ${idStr}` },
      { status: 400 },
    )
  }

  try {
    const rows = await sql`
      DELETE FROM late_fees
      WHERE id = ${id}
      RETURNING id;
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Late fee not found for id=${id}` },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting late fee:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
