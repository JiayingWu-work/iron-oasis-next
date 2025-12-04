import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type DBDeleteResult = { id: string }

export async function DELETE(req: Request) {
  // Parse id from URL: /api/sessions/:id
  const url = new URL(req.url)
  const parts = url.pathname.split('/') // ["", "api", "sessions", "<id>"]
  const sessionId = parts[3]

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Session id is required' },
      { status: 400 },
    )
  }

  try {
    const deleted = (await sql`
      DELETE FROM sessions
      WHERE id = ${sessionId}
      RETURNING id
    `) as DBDeleteResult[]

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: `Session not found: ${sessionId}` },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting session', err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 },
    )
  }
}
