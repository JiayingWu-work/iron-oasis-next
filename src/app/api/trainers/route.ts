import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { Trainer } from '@/types'

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, name, tier
      FROM trainers
      ORDER BY id;
    `) as Trainer[]

    return NextResponse.json({ trainers: rows })
  } catch (err) {
    console.error('GET /api/trainers error', err)
    return NextResponse.json(
      { error: 'Failed to load trainers' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const tier = Number(body.tier)

    if (!name || ![1, 2, 3].includes(tier)) {
      return NextResponse.json(
        { error: 'name and tier (1|2|3) required' },
        { status: 400 },
      )
    }

    const rows = (await sql`
      INSERT INTO trainers (name, tier)
      VALUES (${name}, ${tier})
      RETURNING id, name, tier;
    `) as Trainer[]

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/trainers error', err)
    return NextResponse.json(
      { error: 'Failed to create trainer' },
      { status: 500 },
    )
  }
}
