import { DashboardNotice, DashboardChecklistItem, AppNotification } from '@/lib/types';

export async function fetchActiveDashboardNotices(): Promise<DashboardNotice[]> {
  try {
    const res = await fetch('/api/notices', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const notices: DashboardNotice[] = data.notices || [];
    return notices.filter((n) => n.is_active);
  } catch (err) {
    console.error('[fetchActiveDashboardNotices] Error:', err);
    return [];
  }
}

export async function fetchActiveDashboardNotice(noticeId?: string): Promise<DashboardNotice | null> {
  try {
    const notices = await fetchActiveDashboardNotices();
    if (noticeId) {
      return notices.find((n) => n.id === noticeId) || null;
    }
    return notices[0] || null;
  } catch (err) {
    console.error('[fetchActiveDashboardNotice] Error:', err);
    return null;
  }
}

export async function fetchAllAdminNotices(): Promise<DashboardNotice[]> {
  try {
    const res = await fetch('/api/notices', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.notices || [];
  } catch (err) {
    console.error('[fetchAllAdminNotices] Error:', err);
    return [];
  }
}

export async function saveDashboardNotice(
  noticeData: Partial<DashboardNotice>
): Promise<{ success: boolean; notice?: DashboardNotice; error?: string }> {
  try {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noticeData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to save notice' };
    }
    return { success: true, notice: data.notice };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save notice' };
  }
}

export async function deactivateDashboardNotice(noticeId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notices/${noticeId}/deactivate`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateChecklistItemStatus(
  itemId: string,
  isCompleted: boolean
): Promise<{ success: boolean; allCompleted?: boolean }> {
  try {
    const res = await fetch(`/api/checklist-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: isCompleted }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, allCompleted: data.allCompleted };
  } catch {
    return { success: false };
  }
}

export async function fetchUserNotifications(): Promise<AppNotification[]> {
  try {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.notifications || [];
  } catch (err) {
    console.error('[fetchUserNotifications] Error:', err);
    return [];
  }
}

export async function markNotificationRead(notificationKey: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationKey, action: 'MARK_READ' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function acknowledgeNotification(notificationKey: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationKey, action: 'ACKNOWLEDGE' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
