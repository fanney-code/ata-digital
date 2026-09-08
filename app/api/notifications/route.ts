import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAuthenticatedSession } from '@/lib/auth/server-session';
import { AppNotification } from '@/lib/types';

// Fallback in-memory notification state tracking
const inMemoryUserNotifStates = new Map<string, { is_read: boolean; is_completed: boolean }>();

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: userId, role } = session;

    // 1. Fetch user notification states from PostgreSQL
    const notifStatesMap = new Map<string, { is_read: boolean; is_completed: boolean }>();
    try {
      const { data: dbStates } = await supabase
        .from('user_notification_states')
        .select('notification_key, is_read, is_completed')
        .eq('user_id', userId);

      (dbStates || []).forEach((st) => {
        notifStatesMap.set(st.notification_key, {
          is_read: Boolean(st.is_read),
          is_completed: Boolean(st.is_completed),
        });
      });
    } catch {
      // Fallback
    }

    const getKeyState = (key: string) => {
      if (notifStatesMap.has(key)) return notifStatesMap.get(key)!;
      const memKey = `${userId}:${key}`;
      if (inMemoryUserNotifStates.has(memKey)) return inMemoryUserNotifStates.get(memKey)!;
      return { is_read: false, is_completed: false };
    };

    const notifications: AppNotification[] = [];
    const now = new Date().toISOString();

    // 2. Resolve role-based notifications
    if (role === 'ADMINISTRATOR' || role === 'UNIVERSAL') {
      // REGISTRATIONS_AWAITING_REVIEW: Query actual registrations
      try {
        const { data: pendingRegs } = await supabase
          .from('registrations')
          .select('id, status')
          .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED']);

        const count = pendingRegs?.length || 0;

        // Active only if pending registrations exist (> 0)
        if (count > 0) {
          const key = 'REGISTRATIONS_AWAITING_REVIEW';
          const st = getKeyState(key);
          notifications.push({
            id: `notif-admin-regs`,
            key,
            title: 'New Registrations Awaiting Review',
            message: `${count} student record${count > 1 ? 's' : ''} submitted for accreditation verification.`,
            recipient_role: role,
            target_url: '/registrations',
            action_type: 'REGISTRATIONS_REVIEW',
            is_read: st.is_read,
            is_completed: false,
            created_at: now,
            metadata: { count },
          });
        }
      } catch {
        // Safe fallback
      }

      // SYSTEM_AUDIT_LOG_SYNC: Acknowledgement notification for batch ledger operations
      const auditKey = 'SYSTEM_AUDIT_LOG_SYNC';
      const auditSt = getKeyState(auditKey);
      if (!auditSt.is_completed) {
        notifications.push({
          id: `notif-audit-sync`,
          key: auditKey,
          title: 'System Audit Log Synchronized',
          message: 'Batch import actions recorded and validated in real time.',
          recipient_role: role,
          target_url: '/audit-logs',
          action_type: 'AUDIT_LOG_SYNC',
          is_read: auditSt.is_read,
          is_completed: false,
          created_at: now,
        });
      }
    }

    if (role === 'REGISTRAR') {
      // REGISTRATIONS_CORRECTION_REQUIRED: Distinct actionable notification for flagged dossiers
      try {
        const { data: flaggedRegs } = await supabase
          .from('registrations')
          .select('id, status')
          .eq('status', 'CORRECTION_REQUIRED');

        const flaggedCount = flaggedRegs?.length || 0;
        if (flaggedCount > 0) {
          const corrKey = 'REGISTRATIONS_CORRECTION_REQUIRED';
          const corrSt = getKeyState(corrKey);
          notifications.push({
            id: `notif-reg-corrections`,
            key: corrKey,
            title: 'Dossiers Requiring Correction',
            message: `${flaggedCount} student registration dossier${flaggedCount > 1 ? 's' : ''} flagged for revision.`,
            recipient_role: 'REGISTRAR',
            target_url: '/registrations',
            action_type: 'REGISTRATIONS_CORRECTION',
            is_read: corrSt.is_read,
            is_completed: false,
            created_at: now,
            metadata: { count: flaggedCount },
          });
        }
      } catch {
        // Safe fallback
      }

      // ASSIGNED_NOTICE_${notice.id}: Distinct notification for EACH active notice
      try {
        const { data: activeNotices } = await supabase
          .from('dashboard_notices')
          .select(`
            id,
            title,
            message,
            recipient_role,
            is_active,
            items:notice_checklist_items(id, is_completed)
          `)
          .eq('recipient_role', 'REGISTRAR')
          .eq('is_active', true);

        for (const notice of activeNotices || []) {
          const noticeKey = `ASSIGNED_NOTICE_${notice.id}`;
          const noticeSt = getKeyState(noticeKey);

          // Completion rule: completed if all checklist items are completed in DB OR marked completed
          const items = notice.items || [];
          const allItemsDone = items.length > 0 && items.every((it: any) => it.is_completed);

          if (!allItemsDone && !noticeSt.is_completed) {
            notifications.push({
              id: `notif-notice-${notice.id}`,
              key: noticeKey,
              title: notice.title,
              message: notice.message,
              recipient_role: 'REGISTRAR',
              target_url: `/dashboard?action=checklist&noticeId=${notice.id}`,
              action_type: 'ASSIGNED_NOTICE',
              is_read: noticeSt.is_read,
              is_completed: false,
              created_at: now,
              notice_id: notice.id,
            });
          }
        }
      } catch {
        // Safe fallback
      }

      // SYSTEM_AUDIT_LOG_SYNC for Registrar
      const auditKey = 'SYSTEM_AUDIT_LOG_SYNC';
      const auditSt = getKeyState(auditKey);
      if (!auditSt.is_completed) {
        notifications.push({
          id: `notif-audit-sync`,
          key: auditKey,
          title: 'System Audit Log Synchronized',
          message: 'Batch import actions recorded and validated in real time.',
          recipient_role: 'REGISTRAR',
          target_url: '/audit-logs',
          action_type: 'AUDIT_LOG_SYNC',
          is_read: auditSt.is_read,
          is_completed: false,
          created_at: now,
        });
      }
    }

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resolve notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationKey, action } = body;

    if (!notificationKey) {
      return NextResponse.json({ error: 'Missing notificationKey' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const isRead = action === 'MARK_READ' || action === 'COMPLETE' || action === 'ACKNOWLEDGE';
    const isCompleted = action === 'COMPLETE' || action === 'ACKNOWLEDGE';

    // 1. Update PostgreSQL user_notification_states
    try {
      await supabase
        .from('user_notification_states')
        .upsert(
          [
            {
              user_id: session.id,
              notification_key: notificationKey,
              is_read: isRead,
              is_completed: isCompleted,
              read_at: isRead ? now : undefined,
              completed_at: isCompleted ? now : undefined,
              updated_at: now,
            },
          ],
          { onConflict: 'user_id,notification_key' }
        );
    } catch {
      // Fallback
    }

    // In-memory fallback tracking
    const memKey = `${session.id}:${notificationKey}`;
    inMemoryUserNotifStates.set(memKey, {
      is_read: isRead,
      is_completed: isCompleted,
    });

    return NextResponse.json({ success: true, notificationKey, isRead, isCompleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update notification state' }, { status: 500 });
  }
}
