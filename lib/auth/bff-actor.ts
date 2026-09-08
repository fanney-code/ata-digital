/**
 * BFF (Backend-for-Frontend) utility: buildActorFromSession
 *
 * Every protected BFF route calls this to get the trusted ActorContext.
 * This is the ONLY authoritative source of ActorContext in the application.
 * 
 * - Reads the HTTP-only session cookie
 * - Queries the live profiles table for role and institution_id
 * - Returns null if no valid session exists
 * 
 * NEVER accept role, institutionId, or ActorContext from the browser request body,
 * query parameters, headers, or any client-supplied value.
 */

import { getAuthenticatedSession } from '@/lib/auth/server-session';
import { ActorContext } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function buildActorFromSession(): Promise<{
  actor: ActorContext;
  errorResponse: null;
} | {
  actor: null;
  errorResponse: NextResponse;
}> {
  const profile = await getAuthenticatedSession();

  if (!profile) {
    return {
      actor: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Valid session required.' },
        { status: 401 }
      ),
    };
  }

  const actor: ActorContext = {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    institutionId: profile.institution_id ?? undefined,
  };

  return { actor, errorResponse: null };
}
