/**
 * GET    /api/registrations/[id]   — fetch single registration (scoped to actor)
 * DELETE /api/registrations/[id]   — delete registration (REGISTRAR only, institution-scoped)
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import {
  fetchRegistrationById,
  deleteRegistration,
  updateRegistrationDraft,
  updateRegistrationAndStudent,
} from '@/lib/api/supabase-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const registration = await fetchRegistrationById(id, actor);
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    return NextResponse.json({ registration });
  } catch (err: any) {
    console.error('[GET /api/registrations/[id]]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') ?? undefined;

    await deleteRegistration(id, studentId, actor);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/registrations/[id]]', err.message);
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

    if (body.student && body.studentId) {
      const updated = await updateRegistrationAndStudent(
        id,
        body.studentId,
        {
          student: body.student,
          registration: body.registration,
        },
        actor
      );
      return NextResponse.json({ registration: updated });
    }

    if (body.registration) {
      const updated = await updateRegistrationDraft(id, body.registration, actor);
      return NextResponse.json({ registration: updated });
    }

    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  } catch (err: any) {
    console.error('[PATCH /api/registrations/[id]]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
