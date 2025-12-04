import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { pickPackageForSession } from '@/lib/package'
import type { Package, Session } from '@/types'
import { randomUUID } from 'crypto'

type DBPackageRow = {
  id: string
  client_id: string
  trainer_id: string
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

type DBSessionRow = {
  id: string
  date: string
  trainer_id: string
  client_id: string
  package_id: string
}

type AddSessionsBody = {
  date: string
  trainerId: string
  clientIds: string[]
}

export async function POST(req: NextRequest) {
  const { date, trainerId, clientIds } = (await req.json()) as AddSessionsBody

  if (!date || !trainerId || !Array.isArray(clientIds)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Fetch relevant packages
  const packagesRows = (await sql`
    SELECT *
    FROM packages
    WHERE trainer_id = ${trainerId}
      AND client_id = ANY(${clientIds})
  `) as DBPackageRow[]

  // Fetch all existing sessions for this trainer
  const sessionsRows = (await sql`
    SELECT *
    FROM sessions
    WHERE trainer_id = ${trainerId}
  `) as DBSessionRow[]

  // Convert DB rows → app types so we can reuse pickPackageForSession
  const allPackages: Package[] = packagesRows.map((p) => {
    const startDateStr =
      typeof p.start_date === 'string'
        ? p.start_date.slice(0, 10) // '2025-11-01' or '2025-11-01T...' → '2025-11-01'
        : new Date(p.start_date).toISOString().slice(0, 10)

    const sessionsPurchased = Number(p.sessions_purchased)
    const salesBonus =
      p.sales_bonus === null || p.sales_bonus === undefined
        ? undefined
        : Number(p.sales_bonus)

    return {
      id: p.id,
      clientId: p.client_id,
      trainerId: p.trainer_id,
      sessionsPurchased,
      startDate: startDateStr,
      salesBonus,
    }
  })

  const allSessions: Session[] = sessionsRows.map((s) => ({
    id: s.id,
    date:
      typeof s.date === 'string'
        ? s.date.slice(0, 10)
        : new Date(s.date).toISOString().slice(0, 10),
    trainerId: s.trainer_id,
    clientId: s.client_id,
    packageId: s.package_id,
  }))

  const newSessions: Session[] = []
  const failed: string[] = []

  for (const clientId of clientIds) {
    const pkg = pickPackageForSession(clientId, trainerId, date, allPackages, [
      ...allSessions,
      ...newSessions,
    ])

    if (!pkg) {
      failed.push(clientId)
      continue
    }

    const id = randomUUID()

    await sql`
      INSERT INTO sessions (id, date, trainer_id, client_id, package_id)
      VALUES (${id}, ${date}, ${trainerId}, ${clientId}, ${pkg.id})
    `

    newSessions.push({
      id,
      date,
      trainerId,
      clientId,
      packageId: pkg.id,
    })
  }

  return NextResponse.json({ newSessions, failed })
}
