import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { Package, Session } from '@/types'

type DBPackageRow = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type DBSessionRow = {
  id: number
  date: string
  trainer_id: number
  client_id: number
  package_id: number | null
}

type AddSessionsBody = {
  date: string
  trainerId: number
  clientIds: number[]
}

export async function POST(req: NextRequest) {
  try {
    const { date, trainerId, clientIds } = (await req.json()) as AddSessionsBody

    if (!date || typeof trainerId !== 'number' || !Array.isArray(clientIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 1) Fetch all packages for these clients & trainer (if any)
    const packagesRows = (await sql`
      SELECT id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus
      FROM packages
      WHERE trainer_id = ${trainerId}
        AND client_id = ANY(${clientIds})
    `) as DBPackageRow[]

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
      }
    })

    const newSessions: Session[] = []

    // 2) Create a session for each clientId
    for (const clientId of clientIds) {
      // All packages for this client & trainer, sorted by start date
      const clientPkgs = allPackages
        .filter((p) => p.clientId === clientId && p.trainerId === trainerId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))

      // If they have *any* package history, use the most recent package.
      // This will keep using "the rate they were at before" and allows remaining to go negative when they run out.
      // If they NEVER bought a package, we set packageId = null and treat it as single-class rate in the income calc.
      const pkg = clientPkgs[clientPkgs.length - 1] ?? null
      const packageId = pkg ? pkg.id : null

      const [inserted] = (await sql`
        INSERT INTO sessions (date, trainer_id, client_id, package_id)
        VALUES (${date}, ${trainerId}, ${clientId}, ${packageId})
        RETURNING id, date, trainer_id, client_id, package_id
      `) as DBSessionRow[]

      const normalizedDate =
        typeof inserted.date === 'string'
          ? inserted.date.slice(0, 10)
          : new Date(inserted.date).toISOString().slice(0, 10)

      newSessions.push({
        id: inserted.id,
        date: normalizedDate,
        trainerId: inserted.trainer_id,
        clientId: inserted.client_id,
        packageId: inserted.package_id, // may be null
      } as Session)
    }

    // Keep 'failed' in response shape for compatibility, but it's always [] now
    return NextResponse.json({ newSessions, failed: [] })
  } catch (err) {
    console.error('Error adding sessions', err)
    return NextResponse.json(
      { error: 'Failed to add sessions' },
      { status: 500 },
    )
  }
}
