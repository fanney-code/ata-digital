/**
 * PATCH /api/registrations/[id]/status
 * Update registration workflow status. Actor is verified server-side from session cookie.
 * - REGISTRAR: can submit, resubmit within their institution
 * - ADMINISTRATOR: can approve, reject, mark for correction across institutions; cannot resubmit
 * - UNIVERSAL: no mutations (403)
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { updateRegistrationStatus } from '@/lib/api/supabase-service';
import { WorkflowStatus } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const status = body.status as WorkflowStatus;
    const notes = body.notes as string | undefined;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const updated = await updateRegistrationStatus(id, status, notes, actor);
    return NextResponse.json({ registration: updated });
  } catch (err: any) {
    console.error('[PATCH /api/registrations/[id]/status]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
