-- Migration: 20260907_dashboard_notices_and_notifications.sql
-- Description: Creates tables for Admin-assigned dashboard notices, checklist items, and user notification tracking states.
-- Note: Zero sample notices seeded per production specification.

-- 1. Dashboard Notices Table
CREATE TABLE IF NOT EXISTS public.dashboard_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('REGISTRAR', 'ADMINISTRATOR', 'UNIVERSAL')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  checklist_title TEXT DEFAULT 'Audit Checklist',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Notice Checklist Items Table
CREATE TABLE IF NOT EXISTS public.notice_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.dashboard_notices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Notification States Table
CREATE TABLE IF NOT EXISTS public.user_notification_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_key)
);

-- 4. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_dashboard_notices_role_active ON public.dashboard_notices(recipient_role, is_active);
CREATE INDEX IF NOT EXISTS idx_checklist_items_notice_id ON public.notice_checklist_items(notice_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_key ON public.user_notification_states(user_id, notification_key);

-- 5. Row Level Security
ALTER TABLE public.dashboard_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for dashboard_notices" ON public.dashboard_notices;
CREATE POLICY "Allow all for dashboard_notices" ON public.dashboard_notices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for notice_checklist_items" ON public.notice_checklist_items;
CREATE POLICY "Allow all for notice_checklist_items" ON public.notice_checklist_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for user_notification_states" ON public.user_notification_states;
CREATE POLICY "Allow all for user_notification_states" ON public.user_notification_states FOR ALL USING (true) WITH CHECK (true);
