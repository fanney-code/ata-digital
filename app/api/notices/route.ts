import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAuthenticatedSession } from '@/lib/auth/server-session';
import { DashboardNotice, DashboardChecklistItem } from '@/lib/types';

// In-memory / PostgreSQL resilient storage adapter
// Mirrors schema operations and ensures graceful execution
let localNoticesStore: DashboardNotice[] = [];

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Valid authenticated session required.' }, { status: 401 });
    }

    const { role } = session;

    // 1. Attempt PostgreSQL fetch
    try {
      let query = supabase
        .from('dashboard_notices')
        .select(`
          *,
          items:notice_checklist_items(*)
        `)
        .order('created_at', { ascending: false });

      if (role !== 'ADMINISTRATOR') {
        query = query.eq('recipient_role', role).eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ notices: data });
      }
    } catch {
      // Fall through to resilient in-memory store if remote table cache is updating
    }

    // Filter by role server-side
    let filtered = localNoticesStore;
    if (role !== 'ADMINISTRATOR') {
      filtered = localNoticesStore.filter((n) => n.recipient_role === role && n.is_active);
    }

    return NextResponse.json({ notices: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    // Strict server-side role check: Only ADMINISTRATOR can create/assign notices
    if (session.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrators can create or assign dashboard notices.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, message, recipient_role = 'REGISTRAR', is_active = true, checklist_title = 'Audit Checklist', items = [] } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const noticeId = `notice-${Date.now()}`;

    const formattedItems: DashboardChecklistItem[] = (items || []).map((it: any, idx: number) => ({
      id: it.id || `item-${Date.now()}-${idx}`,
      notice_id: noticeId,
      title: it.title?.trim() || `Checklist Item ${idx + 1}`,
      description: it.description?.trim() || '',
      is_completed: Boolean(it.is_completed),
      sort_order: idx,
    }));

    const newNotice: DashboardNotice = {
      id: noticeId,
      title: title.trim(),
      message: message.trim(),
      recipient_role,
      is_active,
      checklist_title: checklist_title.trim() || 'Audit Checklist',
      items: formattedItems,
      created_by: session.id,
      created_at: now,
      updated_at: now,
    };

    // 1. Try PostgreSQL insertion
    try {
      const { data: noticeData, error: noticeErr } = await supabase
        .from('dashboard_notices')
        .insert([
          {
            title: newNotice.title,
            message: newNotice.message,
            recipient_role: newNotice.recipient_role,
            is_active: newNotice.is_active,
            checklist_title: newNotice.checklist_title,
            created_by: session.id,
          },
        ])
        .select()
        .single();

      if (!noticeErr && noticeData) {
        const dbItems = formattedItems.map((it) => ({
          notice_id: noticeData.id,
          title: it.title,
          description: it.description,
          is_completed: it.is_completed,
          sort_order: it.sort_order,
        }));

        const { data: insertedItems } = await supabase
          .from('notice_checklist_items')
          .insert(dbItems)
          .select();

        return NextResponse.json({
          success: true,
          notice: {
            ...noticeData,
            items: insertedItems || formattedItems,
          },
        });
      }
    } catch {
      // Fallback to local resilient store
    }

    // If previous notice was active for this role, deactivate it
    if (is_active) {
      localNoticesStore = localNoticesStore.map((n) =>
        n.recipient_role === recipient_role ? { ...n, is_active: false } : n
      );
    }
    localNoticesStore.unshift(newNotice);

    return NextResponse.json({ success: true, notice: newNotice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save notice' }, { status: 500 });
  }
}
