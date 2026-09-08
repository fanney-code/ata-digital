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
    const searchParams = req.nextUrl.searchParams;
    const registrationId = searchParams.get('registrationId') || '';
    const filename = searchParams.get('filename') || '';

    const { buffer, contentType, fileName } = await getDocumentFileBuffer(
      id,
      registrationId,
      'DOWNLOAD_DOCUMENT',
      actor,
      filename
    );

    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    const status = err.message?.includes('403') ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Download failed' }, { status });
  }
}
