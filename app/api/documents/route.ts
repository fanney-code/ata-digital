/**
 * GET /api/documents
 * Returns scoped document/registration records for the Document Vault.
 * - REGISTRAR: only registrations from their assigned institution
 * - ADMINISTRATOR/UNIVERSAL: all registrations
 */
import { NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchRegistrations } from '@/lib/api/supabase-service';

export async function GET() {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const registrations = await fetchRegistrations(undefined, actor);
    return NextResponse.json({ registrations });
  } catch (err: any) {
    console.error('[GET /api/documents]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
