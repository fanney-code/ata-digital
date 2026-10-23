import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/lib/types';

export const SESSION_COOKIE_NAME = 'ata_portal_session_v1';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  issuedAt: number;
}

// ---------------------------------------------------------------------------
// Hardcoded account definitions — kept in sync with the session route.
// These are the authoritative fallback when the profiles table is unavailable
// or the profile row hasn't been created yet.
// ---------------------------------------------------------------------------
const ACCOUNT_BY_EMAIL: Record<string, { email: string; role: UserRole; full_name: string }> = {
  'thomas@ataindia.org':  { email: 'thomas@ataindia.org',  role: 'REGISTRAR',     full_name: 'Thomas' },
  'john@ataindia.org':    { email: 'john@ataindia.org',    role: 'ADMINISTRATOR', full_name: 'John' },
  'justin@ataindia.org':  { email: 'justin@ataindia.org',  role: 'UNIVERSAL',     full_name: 'Justin' },
};

function stableId(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 36)
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Resolves the authenticated user server-side from the HTTP session cookie.
 * First checks the live `profiles` table; falls back to the hardcoded account
 * definitions so the app keeps working even if the DB row is absent.
 */
export async function getAuthenticatedSession(): Promise<Profile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    let payload: SessionPayload;
    try {
      payload = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    } catch {
      return null;
    }

    if (!payload?.userId || !payload?.email) return null;

    // 1. Try the live profiles table (works when DB is available).
    try {
      const { data: profileWithInst } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, institution_id, created_at, updated_at')
        .eq('id', payload.userId)
        .maybeSingle();

      if (profileWithInst) {
        return await enrichWithInstitution(profileWithInst);
      }

      // Also try by email in case the deterministic ID was used.
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, institution_id, created_at, updated_at')
        .eq('email', payload.email)
        .maybeSingle();

      if (profileByEmail) {
        return await enrichWithInstitution(profileByEmail);
      }
    } catch {
      // DB unreachable — fall through to hardcoded fallback.
    }

    // 2. Fallback: use the hardcoded account definitions.
    const normalised = payload.email.toLowerCase();
    const account = ACCOUNT_BY_EMAIL[normalised];
    if (!account) return null;

    return {
      id: stableId(normalised),
      email: account.email,
      full_name: account.full_name,
      role: account.role,
      institution_id: undefined,
      created_at: undefined,
      updated_at: undefined,
    } as Profile;
  } catch (err) {
    console.error('[getAuthenticatedSession] Error:', err);
    return null;
  }
}

async function enrichWithInstitution(profile: any): Promise<Profile> {
  let institution_name: string | undefined;
  let institution_code: string | undefined;

  if (profile.institution_id) {
    try {
      const { data: inst } = await supabase
        .from('institutions')
        .select('name, code')
        .eq('id', profile.institution_id)
        .maybeSingle();
      if (inst) {
        institution_name = inst.name;
        institution_code = inst.code;
      }
    } catch {
      // ignore
    }
  }

  return { ...profile, institution_name, institution_code } as Profile;
}
