/**
 * GET /api/search?q=<query>
 * Global search scoped to actor's institution.
 * - REGISTRAR: students and registrations within their assigned institution only
 * - ADMINISTRATOR/UNIVERSAL: cross-institution search
 * Returns { students, registrations }
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchStudents, fetchRegistrations } from '@/lib/api/supabase-service';

export async function GET(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';

    const [students, registrations] = await Promise.all([
      fetchStudents(q || undefined, actor).catch(() => []),
      fetchRegistrations(undefined, actor).catch(() => []),
    ]);

    // Filter registrations by query if provided
    const filteredRegistrations = q
      ? registrations.filter((r) => {
          const stuName = r.student
            ? `${r.student.first_name} ${r.student.last_name}`.toLowerCase()
            : '';
          const uid = (r.student?.permanent_uid || '').toLowerCase();
          const email = (r.student?.email || '').toLowerCase();
          const regNum = r.registration_number.toLowerCase();
          const inst = (r.institution?.name || '').toLowerCase();
          const prog = (r.program?.name || '').toLowerCase();
          const lq = q.toLowerCase();
          return (
            stuName.includes(lq) ||
            uid.includes(lq) ||
            email.includes(lq) ||
            regNum.includes(lq) ||
            inst.includes(lq) ||
            prog.includes(lq)
          );
        })
      : registrations;

    return NextResponse.json({ students, registrations: filteredRegistrations });
  } catch (err: any) {
    console.error('[GET /api/search]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
