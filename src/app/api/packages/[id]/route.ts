import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { ApiPackage, DeleteResponse } from '@/types/api'

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
    // 0) Look up the package so we know client + trainer
    const pkgRows = (await sql`
      SELECT id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus
      FROM packages
      WHERE id = ${packageId}
    `) as ApiPackage[]

    if (pkgRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Package not found: ${packageId}` },
        { status: 404 },
      )
    }

    const pkg = pkgRows[0]

    // 1) Find other packages for this client+trainer (excluding the one we delete)
    const otherPkgs = (await sql`
      SELECT id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus
      FROM packages
      WHERE trainer_id = ${pkg.trainer_id}
        AND client_id = ${pkg.client_id}
        AND id <> ${packageId}
      ORDER BY start_date ASC, id ASC
    `) as ApiPackage[]

    // 2) Decide where the sessions should go:
    //    - If there are other packages, attach them to the *last* one (most recent)
    //    - If no other packages, set package_id = NULL (single-class drop-ins)
    if (otherPkgs.length > 0) {
      const lastPkg = otherPkgs[otherPkgs.length - 1]
      await sql`
        UPDATE sessions
        SET package_id = ${lastPkg.id}
        WHERE package_id = ${packageId}
      `
    } else {
      await sql`
        UPDATE sessions
        SET package_id = NULL
        WHERE package_id = ${packageId}
      `
    }

    // 3) Delete the package itself
    const deleted = (await sql`
      DELETE FROM packages
      WHERE id = ${packageId}
      RETURNING id
    `) as DeleteResponse[]

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
