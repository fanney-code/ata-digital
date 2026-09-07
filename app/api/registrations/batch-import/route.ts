/**
 * POST /api/registrations/batch-import
 * Batch import student registrations from Excel. REGISTRAR only, institution-scoped.
 * The request body must contain { rows: ExcelStudentImportRow[] }.
 * The actor is verified server-side — the REGISTRAR's institutionId from their session
 * is enforced against each row's institution name.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildActorFromSession } from '@/lib/auth/bff-actor';
import { batchImportStudentRegistrations, ExcelStudentImportRow } from '@/lib/api/supabase-service';

export async function POST(req: NextRequest) {
  try {
    const { actor, errorResponse } = await buildActorFromSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const rows: ExcelStudentImportRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows must be a non-empty array' }, { status: 400 });
    }

    const result = await batchImportStudentRegistrations(rows, actor);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/registrations/batch-import]', err.message);
    const status = err.message?.startsWith('403') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
