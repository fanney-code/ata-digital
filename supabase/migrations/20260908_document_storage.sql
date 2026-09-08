-- Persist the authoritative reference to each uploaded private Storage object.
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_registration_id
  ON public.documents(registration_id);

-- All document access is mediated by authenticated server routes using the
-- service-role client. Keep direct anon/authenticated table access disabled.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
