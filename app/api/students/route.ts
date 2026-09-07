/**
 * GET  /api/students       — list students scoped to actor's institution
 * POST /api/students       — create a new student (REGISTRAR only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchStudents, createStudent } from '@/lib/api/supabase-service';

export async function GET(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? undefined;

    const students = await fetchStudents(q, actor);
    return NextResponse.json({ students });
  } catch (err: any) {
    console.error('[GET /api/students]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { studentData, intakeYear } = body;

    const student = await createStudent(studentData, intakeYear, actor);
    return NextResponse.json({ student }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/students]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
