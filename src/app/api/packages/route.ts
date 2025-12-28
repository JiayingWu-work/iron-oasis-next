import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getClientPricePerClass } from '@/lib/pricing'
import type { ApiPackage, ApiSession } from '@/types/api'
import type { TrainingMode, Location } from '@/types'

/**
 * After a new package is created, rebalance sessions across all packages for this client+trainer:
 * - Older packages never end up with more sessions than sessions_purchased
 *   (extra/overflow sessions are moved forward to later packages, including the new one).
 * - Single-class drop-in sessions (package_id = NULL) are *also* considered:
 *   they are attached to packages that still have remaining capacity, oldest → newest.
 * - Drop-ins that still don’t fit into any package remain with package_id = NULL.
 */
async function rebalanceClientPackages(clientId: number): Promise<void> {
  // All packages for this client (any trainer), oldest → newest
  // For 2v2 clients, sessions from both trainers share the same package
  const pkgRows = (await sql`
    SELECT id,
           client_id,
           trainer_id,
           sessions_purchased,
           start_date,
           sales_bonus,
           mode
    FROM packages
    WHERE client_id = ${clientId}
    ORDER BY start_date ASC, id ASC
  `) as ApiPackage[]

  if (pkgRows.length === 0) return

  // Sessions currently attached to some package (non-null)
  // Include sessions from ALL trainers for this client (important for 2v2)
  const sessionRows = (await sql`
    SELECT id,
           date,
           trainer_id,
           client_id,
           package_id,
           mode
    FROM sessions
    WHERE client_id = ${clientId}
      AND package_id IS NOT NULL
    ORDER BY date ASC, id ASC
  `) as ApiSession[]

  // ---------- A) Move overflow from older packages to newer ones ----------
  for (let i = 0; i < pkgRows.length - 1; i++) {
    const currentPkg = pkgRows[i]
    const nextPkg = pkgRows[i + 1]

    const currentSessions = sessionRows.filter(
      (s) => s.package_id === currentPkg.id,
    )

    const purchased = Number(currentPkg.sessions_purchased)
    if (currentSessions.length <= purchased) continue

    const overflowCount = currentSessions.length - purchased

    // Take the latest overflow sessions
    const overflowSessions = currentSessions.slice(-overflowCount)
    const overflowIds = overflowSessions.map((s) => s.id)

    if (overflowIds.length === 0) continue

    await sql`
      UPDATE sessions
      SET package_id = ${nextPkg.id}
      WHERE id = ANY(${overflowIds})
    `

    // keep in-memory view updated
    for (const s of sessionRows) {
      if (overflowIds.includes(s.id)) {
        s.package_id = nextPkg.id
      }
    }
  }

  // ---------- B) Absorb drop-in sessions into packages with spare capacity ----------

  // Drop-in sessions = no package_id (they should pay single-class until absorbed)
  // Include sessions from ALL trainers for this client (important for 2v2)
  const dropIns = (await sql`
    SELECT id,
           date,
           trainer_id,
           client_id,
           package_id,
           mode
    FROM sessions
    WHERE client_id = ${clientId}
      AND package_id IS NULL
    ORDER BY date ASC, id ASC
  `) as ApiSession[]

  if (dropIns.length === 0) return

  // How many sessions currently use each package (after step A)
  const usedByPkg = new Map<number, number>()
  for (const s of sessionRows) {
    if (s.package_id != null) {
      usedByPkg.set(s.package_id, (usedByPkg.get(s.package_id) ?? 0) + 1)
    }
  }

  // For each drop-in (in time order), assign it to the first package
  // that still has remaining capacity. If all packages are "full"
  // (used >= purchased), we leave the rest as true drop-ins.
  const updatesByPkg = new Map<number, number[]>() // pkgId -> [sessionIds]

  for (const drop of dropIns) {
    let assignedPkgId: number | null = null

    for (const pkg of pkgRows) {
      const used = usedByPkg.get(pkg.id) ?? 0
      const purchased = Number(pkg.sessions_purchased)

      if (used < purchased) {
        assignedPkgId = pkg.id
        usedByPkg.set(pkg.id, used + 1)
        break
      }
    }

    if (assignedPkgId != null) {
      if (!updatesByPkg.has(assignedPkgId)) {
        updatesByPkg.set(assignedPkgId, [])
      }
      updatesByPkg.get(assignedPkgId)!.push(drop.id)
    }
  }

  // Persist those updates
  for (const [pkgId, sessionIds] of updatesByPkg.entries()) {
    await sql`
      UPDATE sessions
      SET package_id = ${pkgId}
      WHERE id = ANY(${sessionIds})
    `
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      clientId,
      trainerId,
      sessionsPurchased,
      startDate,
    } = await req.json()

    if (
      typeof clientId !== 'number' ||
      typeof trainerId !== 'number' ||
      typeof sessionsPurchased !== 'number' ||
      typeof startDate !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Look up the client's training mode, pricing columns, and location
    const [clientRow] = (await sql`
      SELECT mode, price_1_12, price_13_20, price_21_plus, mode_premium, location
      FROM clients
      WHERE id = ${clientId}
    `) as {
      mode: TrainingMode
      price_1_12: number
      price_13_20: number
      price_21_plus: number
      mode_premium: number
      location: Location
    }[]

    if (!clientRow) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientMode: TrainingMode =
      clientRow?.mode === '1v2'
        ? '1v2'
        : clientRow?.mode === '2v2'
        ? '2v2'
        : '1v1'

    // Use client's locked-in pricing
    const clientPricing = {
      price1_12: Number(clientRow.price_1_12),
      price13_20: Number(clientRow.price_13_20),
      price21Plus: Number(clientRow.price_21_plus),
      modePremium: Number(clientRow.mode_premium),
    }

    const pricePerClass = getClientPricePerClass(
      clientPricing,
      sessionsPurchased,
      clientMode,
    )

    let bonusRate = 0
    if (sessionsPurchased >= 13 && sessionsPurchased <= 20) bonusRate = 0.03
    else if (sessionsPurchased >= 21) bonusRate = 0.05

    const salesBonus =
      bonusRate > 0 ? pricePerClass * sessionsPurchased * bonusRate : 0

    // Package inherits location from client
    const clientLocation = clientRow.location ?? 'west'

    const [row] = (await sql`
      INSERT INTO packages (
        client_id,
        trainer_id,
        sessions_purchased,
        start_date,
        sales_bonus,
        mode,
        location
      )
      VALUES (
        ${clientId},
        ${trainerId},
        ${sessionsPurchased},
        ${startDate},
        ${salesBonus},
        ${clientMode},
        ${clientLocation}
      )
      RETURNING
        id,
        client_id,
        trainer_id,
        sessions_purchased,
        start_date,
        sales_bonus,
        mode,
        location
    `) as (ApiPackage & { location: Location })[]

    const normalizedStartDate =
      typeof row.start_date === 'string'
        ? row.start_date.slice(0, 10)
        : new Date(row.start_date).toISOString().slice(0, 10)

    // After inserting, rebalance any "negative" sessions across packages
    await rebalanceClientPackages(clientId)

    return NextResponse.json({
      id: row.id,
      clientId: row.client_id,
      trainerId: row.trainer_id,
      sessionsPurchased: Number(row.sessions_purchased),
      startDate: normalizedStartDate,
      salesBonus:
        row.sales_bonus === null || row.sales_bonus === undefined
          ? undefined
          : Number(row.sales_bonus),
      mode: row.mode ?? '1v1',
      location: row.location ?? 'west',
    })
  } catch (err) {
    console.error('Error adding package', err)
    return NextResponse.json(
      { error: 'Failed to add package' },
      { status: 500 },
    )
  }
}
