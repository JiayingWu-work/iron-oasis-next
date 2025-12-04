import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type DbTrainer = {
  id: string
  name: string
  tier: number
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, tier
      FROM trainers
      ORDER BY name;
    `

    const trainers: DbTrainer[] = rows as DbTrainer[]

    return NextResponse.json({ trainers })
  } catch (err) {
    console.error('Failed to load trainers:', err)
    return NextResponse.json(
      { error: 'Failed to load trainers' },
      { status: 500 },
    )
  }
}
