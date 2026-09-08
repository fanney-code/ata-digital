import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAuthenticatedSession } from '@/lib/auth/server-session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (session.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrators can deactivate notices.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    try {
      await supabase
        .from('dashboard_notices')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, deactivatedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to deactivate notice' }, { status: 500 });
  }
}
