/**
 * GET /api/setup/storage
 * One-shot endpoint to create the 'student-documents' Storage bucket.
 * Call this once after setting SUPABASE_SERVICE_ROLE_KEY in .env
 * Requires REGISTRAR or ADMINISTRATOR role to call.
 */
import { NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { ensureStorageBucket } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    if (!actor || (actor.role !== 'ADMINISTRATOR' && actor.role !== 'REGISTRAR')) {
      return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });
    }

    const result = await ensureStorageBucket();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
