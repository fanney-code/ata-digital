/**
 * POST /api/admin/registrars
 * Create or update a Registrar account with an assigned institution.
 * ADMINISTRATOR role required (verified from server session cookie).
 * 
 * Body: { email: string, fullName: string, institutionId?: string }
 * 
 * The institution assignment is written to profiles.institution_id in Supabase.
 * This is the ONLY mechanism for Registrar institution assignment.
 * It is never inferred from email, name, data, or any client-supplied field.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { createRegistrarByAdmin, fetchProfiles } from '@/lib/api/supabase-service';

export async function GET() {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    if (actor.role !== 'ADMINISTRATOR' && actor.role !== 'UNIVERSAL') {
      return NextResponse.json(
        { error: '403 Forbidden: Access denied.' },
        { status: 403 }
      );
    }

    const profiles = await fetchProfiles();
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/admin/registrars]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    // Only Administrators can assign registrars
    if (actor.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: '403 Forbidden: Only Administrators can manage registrar accounts.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, fullName, institutionId } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: 'email and fullName are required' }, { status: 400 });
    }

    const profile = await createRegistrarByAdmin(email, fullName, institutionId, actor);
    return NextResponse.json(profile, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/admin/registrars]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
