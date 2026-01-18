import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { Package, Session, TrainingMode, Location } from '@/types'
import type { ApiPackage, ApiSession } from '@/types/api'

type AddSessionsBody = {
  date: string
  trainerId: number
  clientIds: number[]
  locationOverride?: Location // optional: override the client's default location
}

export async function POST(req: NextRequest) {
  try {
    const { date, trainerId, clientIds, locationOverride } = (await req.json()) as AddSessionsBody

    if (!date || typeof trainerId !== 'number' || !Array.isArray(clientIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Validate locationOverride if provided
    const validLocationOverride = locationOverride === 'west' || locationOverride === 'east' ? locationOverride : null

    // 1) Fetch ALL packages for these clients (any trainer)
    const packagesRows = (await sql`
      SELECT id,
             client_id,
             trainer_id,
             sessions_purchased,
             start_date,
             sales_bonus,
             mode,
             location
      FROM packages
      WHERE client_id = ANY(${clientIds})
    `) as ApiPackage[]

    const allPackages: Package[] = packagesRows.map((p) => {
      const startDateStr =
        typeof p.start_date === 'string'
          ? p.start_date.slice(0, 10)
          : new Date(p.start_date).toISOString().slice(0, 10)

      return {
        id: p.id,
        clientId: p.client_id,
        trainerId: p.trainer_id,
        sessionsPurchased: Number(p.sessions_purchased),
        startDate: startDateStr,
        salesBonus:
          p.sales_bonus === null || p.sales_bonus === undefined
            ? undefined
            : Number(p.sales_bonus),
        mode: (p.mode as TrainingMode) ?? '1v1',
        location: (p.location as Location) ?? 'west',
      }
    })

    // 2) Fetch client modes so we can set session.mode
    const clientModeRows = (await sql`
      SELECT id, mode
      FROM clients
      WHERE id = ANY(${clientIds})
    `) as { id: number; mode: TrainingMode | null }[]

    const clientModeMap = new Map<number, TrainingMode>()
    for (const r of clientModeRows) {
      clientModeMap.set(r.id, (r.mode as TrainingMode) ?? '1v1')
    }

    // 3) Fetch existing sessions to know usage per package
    const existingSessionRows = (await sql`
      SELECT id, package_id
      FROM sessions
      WHERE client_id = ANY(${clientIds})
        AND package_id IS NOT NULL
    `) as { id: number; package_id: number }[]

    // Build a map of session counts per package
    const sessionCountByPkg = new Map<number, number>()
    for (const s of existingSessionRows) {
      sessionCountByPkg.set(s.package_id, (sessionCountByPkg.get(s.package_id) ?? 0) + 1)
    }

    const newSessions: Session[] = []

    // 4) Create a session for each clientId
    for (const clientId of clientIds) {
      // All packages for this client (any trainer), sorted by start date (oldest first)
      const clientPkgs = allPackages
        .filter((p) => p.clientId === clientId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))

      // FIFO: Use the oldest package with remaining capacity.
      // If all packages are full, fall back to the newest (allows going negative).
      let pkg: Package | null = null
      for (const p of clientPkgs) {
        const used = sessionCountByPkg.get(p.id) ?? 0
        if (used < p.sessionsPurchased) {
          pkg = p
          break
        }
      }
      // Fallback to newest if all are full
      if (!pkg && clientPkgs.length > 0) {
        pkg = clientPkgs[clientPkgs.length - 1]
      }

      const packageId = pkg ? pkg.id : null
      const clientMode = clientModeMap.get(clientId) ?? '1v1'

      // Update in-memory count so subsequent sessions in this request use correct counts
      if (packageId !== null) {
        sessionCountByPkg.set(packageId, (sessionCountByPkg.get(packageId) ?? 0) + 1)
      }

      const [inserted] = (await sql`
        INSERT INTO sessions (date, trainer_id, client_id, package_id, mode, location_override)
        VALUES (${date}, ${trainerId}, ${clientId}, ${packageId}, ${clientMode}, ${validLocationOverride})
        RETURNING id, date, trainer_id, client_id, package_id, mode, location_override
      `) as (ApiSession & { location_override: Location | null })[]

      const normalizedDate =
        typeof inserted.date === 'string'
          ? inserted.date.slice(0, 10)
          : new Date(inserted.date).toISOString().slice(0, 10)

      newSessions.push({
        id: inserted.id,
        date: normalizedDate,
        trainerId: inserted.trainer_id,
        clientId: inserted.client_id,
        packageId: inserted.package_id,
        mode: (inserted.mode as TrainingMode) ?? clientMode,
        locationOverride: inserted.location_override ?? undefined,
      })
    }

    return NextResponse.json({ newSessions, failed: [] })
  } catch (err) {
    console.error('Error adding sessions', err)
    return NextResponse.json(
      { error: 'Failed to add sessions' },
      { status: 500 },
    )
  }
}
