import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getPricePerClass } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const {
    clientId,
    trainerId,
    sessionsPurchased,
    startDate,
    trainerTier,
  } = await req.json()

  const pricePerClass = getPricePerClass(trainerTier, sessionsPurchased)

  let bonusRate = 0
  if (sessionsPurchased >= 13 && sessionsPurchased <= 20) bonusRate = 0.03
  else if (sessionsPurchased >= 21) bonusRate = 0.05

  const salesBonus =
    bonusRate > 0 ? pricePerClass * sessionsPurchased * bonusRate : 0

  const id = crypto.randomUUID()

  await sql`
    INSERT INTO packages (id, client_id, trainer_id, sessions_purchased, start_date, sales_bonus)
    VALUES (${id}, ${clientId}, ${trainerId}, ${sessionsPurchased}, ${startDate}, ${salesBonus})
  `

  return NextResponse.json({
    id,
    clientId,
    trainerId,
    sessionsPurchased,
    startDate,
    salesBonus,
  })
}
