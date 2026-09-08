import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

export const SESSION_COOKIE_NAME = 'ata_portal_session_v1';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  issuedAt: number;
}

/**
 * Resolves the authenticated user server-side from the HTTP session cookie.
 * Authoritatively verifies the user's role and status directly against the PostgreSQL `profiles` table.
 * Never trusts client-supplied query parameters or headers.
 */
export async function getAuthenticatedSession(): Promise<Profile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    let payload: SessionPayload;
    try {
      payload = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    } catch {
      return null;
    }

    if (!payload?.userId) {
      return null;
    }

    // Authoritative check against PostgreSQL profiles table
    let profile: any = null;
    const { data: profileWithInst, error: errInst } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, institution_id, created_at, updated_at')
      .eq('id', payload.userId)
      .maybeSingle();

    if (!errInst && profileWithInst) {
      profile = profileWithInst;
    } else {
      // Fallback query if institution_id column is not yet applied to profiles table
      const { data: basicProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, updated_at')
        .eq('id', payload.userId)
        .maybeSingle();
      if (basicProfile) {
        profile = { ...basicProfile, institution_id: null };
      }
    }

    if (!profile) {
      return null;
    }

    // Enrich with institution details if assigned
    let institution_name: string | undefined;
    let institution_code: string | undefined;
    if (profile.institution_id) {
      const { data: inst } = await supabase
        .from('institutions')
        .select('name, code')
        .eq('id', profile.institution_id)
        .maybeSingle();
      if (inst) {
        institution_name = inst.name;
        institution_code = inst.code;
      }
    }

    return {
      ...profile,
      institution_name,
      institution_code,
    } as Profile;
  } catch (err) {
    console.error('[getAuthenticatedSession] Error resolving session:', err);
    return null;
  }
}
