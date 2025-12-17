import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { sql } from '@/lib/db';

export type UserRole = 'owner' | 'trainer';

export interface UserProfile {
  id: number;
  auth_user_id: string;
  role: UserRole;
  trainer_id: number | null;
  created_at: Date;
}

export async function getCurrentUser() {
  const { user } = await neonAuth();
  return user;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await sql`
    SELECT id, auth_user_id, role, trainer_id, created_at
    FROM user_profiles
    WHERE auth_user_id = ${user.id}
  `;

  return (result[0] as UserProfile) || null;
}

export async function isOwner(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'owner';
}

export async function isTrainer(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'trainer';
}

export async function getTrainerIdForCurrentUser(): Promise<number | null> {
  const profile = await getCurrentUserProfile();
  return profile?.trainer_id || null;
}
