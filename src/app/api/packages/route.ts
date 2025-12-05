import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getPricePerClass } from '@/lib/pricing'

type DBPackageRow = {
  id: number
  client_id: number
  trainer_id: number
  sessions_purchased: number
  start_date: string
  sales_bonus: number | null
}

export async function POST(req: NextRequest) {
  try {
    const {
      clientId,
      trainerId,
      sessionsPurchased,
      startDate,
      trainerTier,
    } = await req.json()

    if (
      typeof clientId !== 'number' ||
      typeof trainerId !== 'number' ||
      typeof sessionsPurchased !== 'number' ||
      typeof startDate !== 'string' ||
      (trainerTier !== 1 && trainerTier !== 2 && trainerTier !== 3)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const pricePerClass = getPricePerClass(trainerTier, sessionsPurchased)

    let bonusRate = 0
    if (sessionsPurchased >= 13 && sessionsPurchased <= 20) bonusRate = 0.03
    else if (sessionsPurchased >= 21) bonusRate = 0.05

    const salesBonus =
      bonusRate > 0 ? pricePerClass * sessionsPurchased * bonusRate : 0

    const [row] = (await sql`
      INSERT INTO packages (client_id, trainer_id, sessions_purchased, start_date, sales_bonus)
      VALUES (${clientId}, ${trainerId}, ${sessionsPurchased}, ${startDate}, ${salesBonus})
      RETURNING id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus
    `) as DBPackageRow[]

    const normalizedStartDate =
      typeof row.start_date === 'string'
        ? row.start_date.slice(0, 10)
        : new Date(row.start_date).toISOString().slice(0, 10)

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
    })
  } catch (err) {
    console.error('Error adding package', err)
    return NextResponse.json(
      { error: 'Failed to add package' },
      { status: 500 },
    )
  }
}
