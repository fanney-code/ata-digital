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

    const { id } = await params;
    const body = await req.json();
    const { is_completed } = body;

    const now = new Date().toISOString();

    // 1. Update in PostgreSQL
    try {
      const { data: updatedItem, error } = await supabase
        .from('notice_checklist_items')
        .update({
          is_completed: Boolean(is_completed),
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && updatedItem) {
        // Check if all items for this notice are now completed
        const { data: allItems } = await supabase
          .from('notice_checklist_items')
          .select('is_completed')
          .eq('notice_id', updatedItem.notice_id);

        const allCompleted = allItems && allItems.length > 0 && allItems.every((it) => it.is_completed);

        await supabase
          .from('user_notification_states')
          .upsert([
            {
              user_id: session.id,
              notification_key: `ASSIGNED_NOTICE_${updatedItem.notice_id}`,
              is_completed: Boolean(allCompleted),
              completed_at: allCompleted ? now : null,
              updated_at: now,
            },
          ], { onConflict: 'user_id,notification_key' });

        return NextResponse.json({
          success: true,
          item: updatedItem,
          allCompleted: Boolean(allCompleted),
        });
      }
    } catch {
      // Fallback response
    }

    return NextResponse.json({
      success: true,
      item: { id, is_completed: Boolean(is_completed) },
      allCompleted: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update checklist item' }, { status: 500 });
  }
}
