-- Student Registration & Institution Management System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('UNIVERSAL', 'ADMINISTRATOR', 'REGISTRAR')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Institutions Table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

-- 4. Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  degree_level TEXT NOT NULL DEFAULT 'UNDERGRADUATE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, code)
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permanent_uid TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  national_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('INITIAL_REGISTRATION', 'RE_REGISTRATION', 'TRANSFER', 'PROGRAM_PROGRESSION')),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  program_id UUID NOT NULL REFERENCES public.programs(id),
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'ARCHIVED')),
  notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON public.registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_institution ON public.registrations(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_uid ON public.students(permanent_uid);

-- RLS Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies (Allow ALL for write & import operations)
DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for profiles" ON public.profiles;
CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for institutions" ON public.institutions;
DROP POLICY IF EXISTS "Allow select for institutions" ON public.institutions;
CREATE POLICY "Allow all for institutions" ON public.institutions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for departments" ON public.departments;
DROP POLICY IF EXISTS "Allow select for departments" ON public.departments;
CREATE POLICY "Allow all for departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for programs" ON public.programs;
DROP POLICY IF EXISTS "Allow select for programs" ON public.programs;
CREATE POLICY "Allow all for programs" ON public.programs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for students" ON public.students;
CREATE POLICY "Allow all for students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for registrations" ON public.registrations;
CREATE POLICY "Allow all for registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

-- Seed Data: Profiles (Admin, Universal, Registrar Users)
INSERT INTO public.profiles (id, full_name, email, role) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'System Administrator', 'admin@ataportal.edu', 'ADMINISTRATOR'),
  ('e2222222-2222-2222-2222-222222222222', 'Universal Auditor', 'universal@ataportal.edu', 'UNIVERSAL'),
  ('e3333333-3333-3333-3333-333333333333', 'Eleanor Vance', 'registrar@ataportal.edu', 'REGISTRAR')
ON CONFLICT (email) DO NOTHING;

-- Seed Data: Institutions (Valid UUID Hex)
INSERT INTO public.institutions (id, name, code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'New India Bible Seminary', 'NIBS'),
  ('22222222-2222-2222-2222-222222222222', 'College of Business & Public Policy', 'CBPP'),
  ('33333333-3333-3333-3333-333333333333', 'Academy of Health & Medical Sciences', 'AHMS')
ON CONFLICT (code) DO NOTHING;

-- Seed Data: Departments (Valid UUID Hex using 'd')
INSERT INTO public.departments (id, institution_id, name, code) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Theology', 'THEO'),
  ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Electrical & Electronics', 'EE'),
  ('d3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Business Administration', 'BA'),
  ('d4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Clinical Medicine', 'CM')
ON CONFLICT (institution_id, code) DO NOTHING;

-- Seed Data: Programs (Valid UUID Hex using 'a')
INSERT INTO public.programs (id, department_id, name, code, degree_level) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Bachelor of Theology', 'BTH', 'UNDERGRADUATE'),
  ('a2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'M.Sc. Artificial Intelligence', 'MS-AI', 'POSTGRADUATE'),
  ('a3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'B.Sc. Electrical Engineering', 'BS-EE', 'UNDERGRADUATE'),
  ('a4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'Bachelor of Business Administration', 'BBA', 'UNDERGRADUATE'),
  ('a5555555-5555-5555-5555-555555555555', 'd4444444-4444-4444-4444-444444444444', 'Doctor of Medicine (MD)', 'MD', 'DOCTORATE')
ON CONFLICT (department_id, code) DO NOTHING;

-- Seed Data: Students (Valid UUID Hex using 'b')
INSERT INTO public.students (id, permanent_uid, first_name, last_name, email, phone, date_of_birth, gender) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'STU-2026-00421', 'Sophia', 'Chen', 'sophia.chen@student.edu', '+1 (555) 234-5678', '2003-05-14', 'Female'),
  ('b2222222-2222-2222-2222-222222222222', 'STU-2026-00892', 'Marcus', 'Vance', 'marcus.vance@student.edu', '+1 (555) 345-6789', '2002-11-22', 'Male'),
  ('b3333333-3333-3333-3333-333333333333', 'STU-2026-01044', 'Elena', 'Rostova', 'elena.rostova@student.edu', '+1 (555) 456-7890', '2004-03-08', 'Female'),
  ('b4444444-4444-4444-4444-444444444444', 'STU-2026-01589', 'David', 'Kalu', 'david.kalu@student.edu', '+1 (555) 567-8901', '2001-08-19', 'Male'),
  ('b5555555-5555-5555-5555-555555555555', 'STU-2026-02110', 'Aisha', 'Patel', 'aisha.patel@student.edu', '+1 (555) 678-9012', '2003-01-30', 'Female')
ON CONFLICT (permanent_uid) DO NOTHING;

-- Seed Data: Registrations (Valid UUID Hex using 'c')
INSERT INTO public.registrations (id, registration_number, student_id, registration_type, institution_id, department_id, program_id, academic_year, status, notes, rejection_reason, submitted_at, reviewed_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'REG-2026-000101', 'b1111111-1111-1111-1111-111111111111', 'INITIAL_REGISTRATION', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2026-2027', 'SUBMITTED', 'High school transcripts and identity proof attached.', NULL, NOW(), NULL),
  ('c2222222-2222-2222-2222-222222222222', 'REG-2026-000102', 'b2222222-2222-2222-2222-222222222222', 'RE_REGISTRATION', '11111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', '2026-2027', 'UNDER_REVIEW', 'Continuing student re-registering for Semester 3.', NULL, NOW(), NOW()),
  ('c3333333-3333-3333-3333-333333333333', 'REG-2026-000103', 'b3333333-3333-3333-3333-333333333333', 'TRANSFER', '22222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', '2026-2027', 'CORRECTION_REQUIRED', 'Transfer applicant from State University.', 'Previous institution credit evaluation document is missing seal.', NOW(), NOW()),
  ('c4444444-4444-4444-4444-444444444444', 'REG-2026-000104', 'b4444444-4444-4444-4444-444444444444', 'PROGRAM_PROGRESSION', '33333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', '2026-2027', 'APPROVED', 'Clinical rotation prerequisites cleared.', NULL, NOW(), NOW()),
  ('c5555555-5555-5555-5555-555555555555', 'REG-2026-000105', 'b5555555-5555-5555-5555-555555555555', 'INITIAL_REGISTRATION', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', '2026-2027', 'DRAFT', 'Draft saved by registrar awaiting final diploma copy.', NULL, NULL, NULL),
  ('c6666666-6666-6666-6666-666666666666', 'REG-2025-000088', 'b1111111-1111-1111-1111-111111111111', 'INITIAL_REGISTRATION', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2025-2026', 'ARCHIVED', 'Previous year completed record.', NULL, NOW(), NOW()),
  ('c7777777-7777-7777-7777-777777777777', 'REG-2026-000107', 'b2222222-2222-2222-2222-222222222222', 'RE_REGISTRATION', '22222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', '2026-2027', 'RESUBMITTED', 'Resubmitted after providing updated transcript.', NULL, NOW(), NOW())
ON CONFLICT (registration_number) DO NOTHING;
