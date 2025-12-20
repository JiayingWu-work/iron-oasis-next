import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// One-time script to add fake emails to existing trainers
export async function POST() {
  try {
    // Update existing trainers with fake emails based on their names
    const trainers = await sql`SELECT id, name FROM trainers WHERE email IS NULL`;

    for (const trainer of trainers) {
      const email = `${trainer.name.toLowerCase().replace(/\s+/g, '.')}@test.com`;
      await sql`UPDATE trainers SET email = ${email} WHERE id = ${trainer.id}`;
    }

    // Fetch updated trainers to verify
    const updated = await sql`SELECT id, name, email FROM trainers ORDER BY id`;

    return NextResponse.json({
      success: true,
      message: `Updated ${trainers.length} trainers with fake emails`,
      trainers: updated
    });
  } catch (error) {
    console.error('Seed emails error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
