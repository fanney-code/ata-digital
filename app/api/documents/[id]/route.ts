import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { deleteDocumentAttachment } from '@/lib/api/supabase-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    let registrationId = searchParams.get('registrationId') || '';

    if (!registrationId) {
      try {
        const body = await req.json();
        registrationId = body.registrationId || '';
      } catch {
        // body not present
      }
    }

    const result = await deleteDocumentAttachment(id, registrationId, actor);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.message?.includes('403') ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status });
  }
}
