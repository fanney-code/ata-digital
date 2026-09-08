import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { getDocumentFileBuffer } from '@/lib/api/supabase-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { buffer, contentType, fileName } = await getDocumentFileBuffer(
      id,
      'PREVIEW_DOCUMENT',
      actor
    );

    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    const status = err.message?.startsWith('403') ? 403 : err.message?.startsWith('404') ? 404 : 500;
    const error = status === 403
      ? 'You do not have permission to view this document.'
      : status === 404
        ? err.message.includes('could not be found in storage')
          ? 'Unable to preview document. The uploaded file could not be found in storage.'
          : 'Document not found.'
        : 'Unable to preview this document. Please try again.';
    return NextResponse.json({ error }, { status });
  }
}
