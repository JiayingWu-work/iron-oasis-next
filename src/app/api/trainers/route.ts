import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type TrainerRow = {
  id: number
  name: string
  tier: 1 | 2 | 3
  email: string
  is_active: boolean
}

export async function GET(req: NextRequest) {
  try {
    // Check if is_active column exists and add it if not
    const isActiveCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'trainers' AND column_name = 'is_active'
      ) as exists
    `
    if (!isActiveCheck[0]?.exists) {
      await sql`
        ALTER TABLE trainers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `
    }

    // Check for active filter in query params
    const url = new URL(req.url)
    const activeOnly = url.searchParams.get('active') === 'true'

    const rows = activeOnly
      ? ((await sql`
          SELECT id, name, tier, email, is_active
          FROM trainers
          WHERE is_active = true
          ORDER BY id;
        `) as TrainerRow[])
      : ((await sql`
          SELECT id, name, tier, email, is_active
          FROM trainers
          ORDER BY id;
        `) as TrainerRow[])

    const trainers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      email: row.email,
      isActive: row.is_active ?? true,
    }))

    return NextResponse.json({ trainers })
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
    `) as { id: number; name: string; tier: 1 | 2 | 3; email: string }[]

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/trainers error', err)
    return NextResponse.json(
      { error: 'Failed to create trainer' },
      { status: 500 },
    )
  }
}
