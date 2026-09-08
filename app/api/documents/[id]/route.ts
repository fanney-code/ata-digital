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
    const result = await deleteDocumentAttachment(id, actor);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.message?.startsWith('403') ? 403 : err.message?.startsWith('404') ? 404 : 500;
    const error = status === 403
      ? 'You do not have permission to delete this document.'
      : status === 404
        ? 'Document not found.'
        : 'Unable to delete this document. Please try again.';
    return NextResponse.json({ error }, { status });
  }
}
