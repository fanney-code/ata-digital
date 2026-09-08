/**
 * GET /api/dashboard
 * Returns dashboard metrics and registrations scoped to the authenticated actor.
 * - REGISTRAR: scoped to their assigned institution_id
 * - ADMINISTRATOR: all institutions
 * - UNIVERSAL: all institutions (read-only)
 * ActorContext is built server-side from the HTTP-only session cookie.
 */
import { NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchDashboardMetrics, fetchRegistrations } from '@/lib/api/supabase-service';

export async function GET() {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const [metrics, registrations] = await Promise.all([
      fetchDashboardMetrics(actor),
      fetchRegistrations(undefined, actor),
    ]);

    return NextResponse.json({ metrics, registrations });
  } catch (err: any) {
    console.error('[GET /api/dashboard]', err.message);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
