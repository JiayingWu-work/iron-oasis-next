// src/app/api/debug-trainers/route.ts
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type DBTrainerRow = {
  id: string
  name: string
  tier: number
}

export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, name, tier
      FROM trainers
      ORDER BY id
    `) as DBTrainerRow[]

    return NextResponse.json({ trainers: rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'DB error', details: String(err) },
      { status: 500 },
    )
  }
}
