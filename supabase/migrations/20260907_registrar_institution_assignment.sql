-- Migration: Add institution_id to profiles for Registrar institution assignment
-- This column is the persistent, administrator-controlled assignment.
-- It is NEVER inferred from email, name, or other data.
-- It is set ONLY by an authenticated Administrator via the /api/admin/registrars BFF route.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);

-- Comment for clarity
COMMENT ON COLUMN public.profiles.institution_id IS
  'For REGISTRAR role: the institution this registrar is assigned to manage. NULL means unassigned. Set only by ADMINISTRATOR role via BFF.';
