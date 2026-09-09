/**
 * GET /api/registrations/[id]/documents
 * List the real uploaded documents attached to a registration.
 * Authorization is enforced server-side from the session cookie:
 * - REGISTRAR: only registrations in their assigned institution
 * - ADMINISTRATOR / UNIVERSAL: cross-institution read (preview) access
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { fetchDocumentsForRegistration } from '@/lib/api/supabase-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const documents = await fetchDocumentsForRegistration(id, actor);
    return NextResponse.json({ documents });
  } catch (err: any) {
    const message: string = err?.message || '';
    const status = message.startsWith('403')
      ? 403
      : message.startsWith('404')
        ? 404
        : 500;
    const error =
      status === 403
        ? 'You do not have permission to view documents for this registration.'
        : status === 404
          ? 'Registration not found.'
          : 'Unable to load documents. Please try again.';
    return NextResponse.json({ error }, { status });
  }
}
