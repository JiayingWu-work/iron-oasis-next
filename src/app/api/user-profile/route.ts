import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Owner email for testing - in production this would be set up manually in DB
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'admin@gmail.com';

export async function GET(request: NextRequest) {
  const authUserId = request.nextUrl.searchParams.get('authUserId');

  if (!authUserId) {
    return NextResponse.json(
      { error: 'authUserId is required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT id, auth_user_id, role, trainer_id, created_at
      FROM user_profiles
      WHERE auth_user_id = ${authUserId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authUserId, email } = await request.json();

    if (!authUserId || !email) {
      return NextResponse.json(
        { error: 'authUserId and email are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if profile already exists
    const existingProfile = await sql`
      SELECT id, auth_user_id, role, trainer_id, created_at
      FROM user_profiles
      WHERE auth_user_id = ${authUserId}
    `;

    if (existingProfile.length > 0) {
      return NextResponse.json(existingProfile[0]);
    }

    // Check if this is the owner email
    if (normalizedEmail === OWNER_EMAIL.toLowerCase()) {
      const result = await sql`
        INSERT INTO user_profiles (auth_user_id, role, trainer_id)
        VALUES (${authUserId}, 'owner', NULL)
        RETURNING id, auth_user_id, role, trainer_id, created_at
      `;
      return NextResponse.json(result[0], { status: 201 });
    }

    // Check if email matches a trainer
    const trainer = await sql`
      SELECT id FROM trainers WHERE LOWER(email) = ${normalizedEmail}
    `;

    if (trainer.length === 0) {
      return NextResponse.json(
        { error: "Your email isn't registered. Please contact the gym owner." },
        { status: 403 }
      );
    }

    // Create trainer profile
    const result = await sql`
      INSERT INTO user_profiles (auth_user_id, role, trainer_id)
      VALUES (${authUserId}, 'trainer', ${trainer[0].id})
      RETURNING id, auth_user_id, role, trainer_id, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to create user profile' },
      { status: 500 }
    );
  }
}
