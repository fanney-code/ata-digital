/**
 * GET  /api/registrations     — list registrations scoped to actor
 * POST /api/registrations     — create a new registration (REGISTRAR only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchRegistrations, createRegistration } from '@/lib/api/supabase-service';

export async function GET(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any ?? undefined;
    const filters = status ? { status } : undefined;

    const registrations = await fetchRegistrations(filters, actor);
    return NextResponse.json({ registrations });
  } catch (err: any) {
    console.error('[GET /api/registrations]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const registration = await createRegistration(body, actor);
    return NextResponse.json({ registration }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/registrations]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
