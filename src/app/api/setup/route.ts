import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Create user_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        auth_user_id TEXT UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'trainer')),
        trainer_id INTEGER REFERENCES trainers(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add email column to trainers table if it doesn't exist
    await sql`
      ALTER TABLE trainers
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE
    `;

    // Add is_active column to trainers table if it doesn't exist
    await sql`
      ALTER TABLE trainers
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    `;

    // Add is_active column to clients table if it doesn't exist
    await sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    `;

    // Add location column to trainers table (default 'west' for backfill)
    await sql`
      ALTER TABLE trainers
      ADD COLUMN IF NOT EXISTS location VARCHAR(10) NOT NULL DEFAULT 'west'
    `;

    // Add location column to clients table (default 'west' for backfill)
    await sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS location VARCHAR(10) NOT NULL DEFAULT 'west'
    `;

    // Add location column to packages table (default 'west' for backfill)
    await sql`
      ALTER TABLE packages
      ADD COLUMN IF NOT EXISTS location VARCHAR(10) NOT NULL DEFAULT 'west'
    `;

    // Add location_override column to sessions table (nullable - null means use client's default)
    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS location_override VARCHAR(10)
    `;

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
