import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { pickPackageForSession } from '@/lib/package'
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
  package_id: number
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

    // 1) Fetch relevant packages for these clients & trainer
    const packagesRows = (await sql`
      SELECT id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus
      FROM packages
      WHERE trainer_id = ${trainerId}
        AND client_id = ANY(${clientIds})
    `) as DBPackageRow[]

    // 2) Fetch all existing sessions for this trainer
    const sessionsRows = (await sql`
      SELECT id, date, trainer_id, client_id, package_id
      FROM sessions
      WHERE trainer_id = ${trainerId}
    `) as DBSessionRow[]

    // 3) Convert DB rows → app types so we can reuse pickPackageForSession
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
    const failed: number[] = []

    // 4) Try to create a session for each clientId
    for (const clientId of clientIds) {
      const pkg = pickPackageForSession(
        clientId,
        trainerId,
        date,
        allPackages,
        [...allSessions, ...newSessions],
      )

      if (!pkg) {
        failed.push(clientId)
        continue
      }

      const [inserted] = (await sql`
        INSERT INTO sessions (date, trainer_id, client_id, package_id)
        VALUES (${date}, ${trainerId}, ${clientId}, ${pkg.id})
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
        packageId: inserted.package_id,
      })
    }

    return NextResponse.json({ newSessions, failed })
  } catch (err) {
    console.error('Error adding sessions', err)
    return NextResponse.json(
      { error: 'Failed to add sessions' },
      { status: 500 },
    )
  }
}
