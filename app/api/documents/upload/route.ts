/**
 * POST /api/documents/upload
 * Upload a document attachment. REGISTRAR only, institution-scoped.
 * Accepts multipart/form-data with fields: file (File), registrationId (string)
 * 
 * Preserves the existing uploadDocumentAttachment() behavior:
 * - Validates institution ownership of the registration server-side
 * - Uploads to Supabase Storage bucket 'student-documents'
 * - Inserts metadata into the 'documents' table
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { uploadDocumentAttachment } from '@/lib/api/supabase-service';

export async function POST(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const registrationId = formData.get('registrationId') as string | null;

    if (!file || !registrationId) {
      return NextResponse.json(
        { error: 'file and registrationId are required' },
        { status: 400 }
      );
    }

    const result = await uploadDocumentAttachment(file, registrationId, actor);
    return NextResponse.json({ document: result }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/documents/upload]', err.message);
    const status = err.message?.startsWith('400') ? 400 : err.message?.startsWith('403') ? 403 : err.message?.startsWith('404') ? 404 : 500;
    const error = status === 403
      ? 'You do not have permission to upload documents for this registration.'
      : status === 404
        ? 'Registration not found.'
        : status === 400
          ? err.message.replace(/^400\s*/, '')
          : 'Unable to upload the document. Please try again.';
    return NextResponse.json({ error }, { status });
  }
}
