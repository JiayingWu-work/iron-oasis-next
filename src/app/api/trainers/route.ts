import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { Trainer } from '@/types'

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, name, tier, email
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
    const email = String(body.email ?? '').trim().toLowerCase()
    const tier = Number(body.tier)

    if (!name || ![1, 2, 3].includes(tier)) {
      return NextResponse.json(
        { error: 'name and tier (1|2|3) required' },
        { status: 400 },
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM trainers WHERE LOWER(email) = ${email}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A trainer with this email already exists' },
        { status: 400 },
      )
    }

    const rows = (await sql`
      INSERT INTO trainers (name, tier, email)
      VALUES (${name}, ${tier}, ${email})
      RETURNING id, name, tier, email;
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
