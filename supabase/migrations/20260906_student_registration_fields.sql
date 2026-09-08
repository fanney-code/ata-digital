-- Migration: 20260906_student_registration_fields.sql
-- Description: Add first-class student personal/address fields and registration qualification/history fields.
-- Safety: Non-destructive, idempotent, preserves all existing records, backward-compatible with legacy nullable data.

-- 1. Extend Students Table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_email TEXT;

-- 2. Extend Registrations Table
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS highest_qualification TEXT,
  ADD COLUMN IF NOT EXISTS previous_institution TEXT,
  ADD COLUMN IF NOT EXISTS previous_program TEXT,
  ADD COLUMN IF NOT EXISTS year_of_completion TEXT,
  ADD COLUMN IF NOT EXISTS qualification_reg_no TEXT,
  ADD COLUMN IF NOT EXISTS previous_registration_number TEXT;

-- 3. Create Supporting Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_students_state ON public.students(state);
CREATE INDEX IF NOT EXISTS idx_registrations_prev_reg ON public.registrations(previous_registration_number);
