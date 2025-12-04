import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type DBDeleteResult = { id: string }

export async function DELETE(req: Request) {
  // Parse id from URL path: /api/packages/:id
  const url = new URL(req.url)
  const parts = url.pathname.split('/') // ["", "api", "packages", "<id>"]
  const packageId = parts[3] // "<id>"

  if (!packageId) {
    return NextResponse.json(
      { success: false, error: 'Package id is required' },
      { status: 400 },
    )
  }

  try {
    // 1) delete sessions that reference this package (to avoid FK issues)
    await sql`
      DELETE FROM sessions
      WHERE package_id = ${packageId}
    `

    // 2) delete the package itself, and see if anything was actually deleted
    const deleted = (await sql`
      DELETE FROM packages
      WHERE id = ${packageId}
      RETURNING id
    `) as DBDeleteResult[]

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: `Package not found: ${packageId}` },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting package', err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 },
    )
  }
}
