import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trainerId = parseInt(id, 10);

  if (isNaN(trainerId)) {
    return NextResponse.json(
      { error: 'Invalid trainer ID' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT id, name, tier
      FROM trainers
      WHERE id = ${trainerId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching trainer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer' },
      { status: 500 }
    );
  }
}
