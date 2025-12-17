import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
    const { authUserId, role, trainerId } = await request.json();

    if (!authUserId || !role) {
      return NextResponse.json(
        { error: 'authUserId and role are required' },
        { status: 400 }
      );
    }

    if (!['owner', 'trainer'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be owner or trainer' },
        { status: 400 }
      );
    }

    if (role === 'trainer' && !trainerId) {
      return NextResponse.json(
        { error: 'trainerId is required for trainer role' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO user_profiles (auth_user_id, role, trainer_id)
      VALUES (${authUserId}, ${role}, ${trainerId || null})
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
