/**
 * GET /api/students/[id]
 * Fetch a single student (and optionally their registration history) scoped to actor.
 * - REGISTRAR: only if student has registrations in their assigned institution
 * - ADMINISTRATOR/UNIVERSAL: any student
 * 
 * Query param: ?history=true to include registration history
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchStudentById, fetchStudentWithHistory, updateStudent } from '@/lib/api/supabase-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const withHistory = searchParams.get('history') === 'true';

    if (withHistory) {
      const result = await fetchStudentWithHistory(id, actor);
      if (!result) {
        return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const student = await fetchStudentById(id, actor);
    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ student });
  } catch (err: any) {
    console.error('[GET /api/students/[id]]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();

    const student = await updateStudent(id, body, actor);
    return NextResponse.json({ student });
  } catch (err: any) {
    console.error('[PATCH /api/students/[id]]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
