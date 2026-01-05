import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { IncomeRate } from '@/types';
import { validateIncomeRates } from '@/lib/incomeRates';

type IncomeRateRow = {
  id: number
  trainer_id: number
  min_classes: number
  max_classes: number | null
  rate: string
}

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
      SELECT id, name, tier, email, is_active, location
      FROM trainers
      WHERE id = ${trainerId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    // Fetch income rates for this trainer
    const incomeRateRows = (await sql`
      SELECT id, trainer_id, min_classes, max_classes, rate
      FROM trainer_income_rates
      WHERE trainer_id = ${trainerId}
      ORDER BY min_classes
    `) as IncomeRateRow[]

    const incomeRates: IncomeRate[] = incomeRateRows.map((row) => ({
      id: row.id,
      trainerId: row.trainer_id,
      minClasses: row.min_classes,
      maxClasses: row.max_classes,
      rate: parseFloat(row.rate),
    }))

    const trainer = result[0] as { id: number; name: string; tier: number; email: string; is_active: boolean; location: string }

    return NextResponse.json({
      id: trainer.id,
      name: trainer.name,
      tier: trainer.tier,
      email: trainer.email,
      isActive: trainer.is_active ?? true,
      location: trainer.location ?? 'west',
      incomeRates,
    });
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
    const { name, email, tier, location, incomeRates } = await request.json();

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

    // Update income rates if provided
    let updatedIncomeRates: IncomeRate[] = []
    if (incomeRates && Array.isArray(incomeRates)) {
      // Validate that income rates cover 1 to infinity with no gaps
      const ratesError = validateIncomeRates(incomeRates)
      if (ratesError) {
        return NextResponse.json(
          { error: ratesError },
          { status: 400 }
        );
      }

      // Delete existing rates
      await sql`
        DELETE FROM trainer_income_rates
        WHERE trainer_id = ${trainerId}
      `

      // Insert new rates
      for (const rate of incomeRates as { minClasses: number; maxClasses: number | null; rate: number }[]) {
        const rateRows = (await sql`
          INSERT INTO trainer_income_rates (trainer_id, min_classes, max_classes, rate)
          VALUES (${trainerId}, ${rate.minClasses}, ${rate.maxClasses}, ${rate.rate})
          RETURNING id, trainer_id, min_classes, max_classes, rate
        `) as IncomeRateRow[]

        updatedIncomeRates.push({
          id: rateRows[0].id,
          trainerId: rateRows[0].trainer_id,
          minClasses: rateRows[0].min_classes,
          maxClasses: rateRows[0].max_classes,
          rate: parseFloat(rateRows[0].rate),
        })
      }
    } else {
      // Fetch existing rates if not updating
      const existingRates = (await sql`
        SELECT id, trainer_id, min_classes, max_classes, rate
        FROM trainer_income_rates
        WHERE trainer_id = ${trainerId}
        ORDER BY min_classes
      `) as IncomeRateRow[]

      updatedIncomeRates = existingRates.map((row) => ({
        id: row.id,
        trainerId: row.trainer_id,
        minClasses: row.min_classes,
        maxClasses: row.max_classes,
        rate: parseFloat(row.rate),
      }))
    }

    return NextResponse.json({
      ...result[0],
      incomeRates: updatedIncomeRates,
    });
  } catch (error) {
    console.error('Error updating trainer:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer' },
      { status: 500 }
    );
  }
}
