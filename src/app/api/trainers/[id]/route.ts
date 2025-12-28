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

export async function PATCH(
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
    const { name, email, tier, location } = await request.json();

    // Validate name
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Trainer name is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate tier
    const validTier = tier === 1 || tier === 2 || tier === 3 ? tier : 1;

    // Validate location
    const validLocation = location === 'west' || location === 'east' ? location : 'west';

    // Check email uniqueness (excluding current trainer)
    const existingTrainer = await sql`
      SELECT id FROM trainers
      WHERE email = ${email.trim().toLowerCase()}
        AND id != ${trainerId}
    `;

    if (existingTrainer.length > 0) {
      return NextResponse.json(
        { error: 'A trainer with this email already exists' },
        { status: 400 }
      );
    }

    // Update trainer
    const result = await sql`
      UPDATE trainers
      SET name = ${name.trim()}, email = ${email.trim().toLowerCase()}, tier = ${validTier}, location = ${validLocation}
      WHERE id = ${trainerId}
      RETURNING id, name, email, tier, location
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating trainer:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer' },
      { status: 500 }
    );
  }
}
