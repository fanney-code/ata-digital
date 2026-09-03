import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  WorkflowStatus,
  RegistrationType,
  DashboardMetrics,
} from '../types';

export const INITIAL_INSTITUTIONS: Institution[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Institute of Technology & Engineering', code: 'ITE' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'College of Business & Public Policy', code: 'CBPP' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Academy of Health & Medical Sciences', code: 'AHMS' },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd1111111-1111-1111-1111-111111111111', institution_id: '11111111-1111-1111-1111-111111111111', name: 'Computer Science & Software Engineering', code: 'CS' },
  { id: 'd2222222-2222-2222-2222-222222222222', institution_id: '11111111-1111-1111-1111-111111111111', name: 'Electrical & Electronic Engineering', code: 'EE' },
  { id: 'd3333333-3333-3333-3333-333333333333', institution_id: '22222222-2222-2222-2222-222222222222', name: 'Business Administration & Management', code: 'BA' },
  { id: 'd4444444-4444-4444-4444-444444444444', institution_id: '33333333-3333-3333-3333-333333333333', name: 'Clinical Medicine & Surgery', code: 'CM' },
];

export const INITIAL_PROGRAMS: Program[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', department_id: 'd1111111-1111-1111-1111-111111111111', name: 'B.Sc. Software Engineering', code: 'BS-SE', degree_level: 'UNDERGRADUATE' },
  { id: 'a2222222-2222-2222-2222-222222222222', department_id: 'd1111111-1111-1111-1111-111111111111', name: 'M.Sc. Artificial Intelligence', code: 'MS-AI', degree_level: 'POSTGRADUATE' },
  { id: 'a3333333-3333-3333-3333-333333333333', department_id: 'd2222222-2222-2222-2222-222222222222', name: 'B.Sc. Electrical Engineering', code: 'BS-EE', degree_level: 'UNDERGRADUATE' },
  { id: 'a4444444-4444-4444-4444-444444444444', department_id: 'd3333333-3333-3333-3333-333333333333', name: 'Bachelor of Business Administration', code: 'BBA', degree_level: 'UNDERGRADUATE' },
  { id: 'a5555555-5555-5555-5555-555555555555', department_id: 'd4444444-4444-4444-4444-444444444444', name: 'Doctor of Medicine (MD)', code: 'MD', degree_level: 'DOCTORATE' },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    permanent_uid: 'STU-2026-00421',
    first_name: 'Sophia',
    last_name: 'Chen',
    email: 'sophia.chen@student.edu',
    phone: '+1 (555) 234-5678',
    date_of_birth: '2003-05-14',
    gender: 'Female',
    created_at: '2026-01-10T09:30:00Z',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    permanent_uid: 'STU-2026-00892',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@student.edu',
    phone: '+1 (555) 345-6789',
    date_of_birth: '2002-11-22',
    gender: 'Male',
    created_at: '2026-01-12T14:15:00Z',
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    permanent_uid: 'STU-2026-01044',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.rostova@student.edu',
    phone: '+1 (555) 456-7890',
    date_of_birth: '2004-03-08',
    gender: 'Female',
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    permanent_uid: 'STU-2026-01589',
    first_name: 'David',
    last_name: 'Kalu',
    email: 'david.kalu@student.edu',
    phone: '+1 (555) 567-8901',
    date_of_birth: '2001-08-19',
    gender: 'Male',
    created_at: '2026-01-20T16:45:00Z',
  },
  {
    id: 'b5555555-5555-5555-5555-555555555555',
    permanent_uid: 'STU-2026-02110',
    first_name: 'Aisha',
    last_name: 'Patel',
    email: 'aisha.patel@student.edu',
    phone: '+1 (555) 678-9012',
    date_of_birth: '2003-01-30',
    gender: 'Female',
    created_at: '2026-02-01T10:20:00Z',
  },
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    registration_number: 'REG-2026-000101',
    student_id: 'b1111111-1111-1111-1111-111111111111',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a1111111-1111-1111-1111-111111111111',
    academic_year: '2026-2027',
    status: 'SUBMITTED',
    notes: 'High school transcripts and identity proof attached.',
    submitted_at: '2026-02-10T10:00:00Z',
    created_at: '2026-02-10T09:15:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    registration_number: 'REG-2026-000102',
    student_id: 'b2222222-2222-2222-2222-222222222222',
    registration_type: 'RE_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd2222222-2222-2222-2222-222222222222',
    program_id: 'a3333333-3333-3333-3333-333333333333',
    academic_year: '2026-2027',
    status: 'UNDER_REVIEW',
    notes: 'Continuing student re-registering for Semester 3.',
    submitted_at: '2026-02-12T11:30:00Z',
    created_at: '2026-02-11T14:20:00Z',
    updated_at: '2026-02-13T08:45:00Z',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    registration_number: 'REG-2026-000103',
    student_id: 'b3333333-3333-3333-3333-333333333333',
    registration_type: 'TRANSFER',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a4444444-4444-4444-4444-444444444444',
    academic_year: '2026-2027',
    status: 'CORRECTION_REQUIRED',
    rejection_reason: 'Previous institution credit evaluation document is missing seal.',
    notes: 'Transfer applicant from State University.',
    submitted_at: '2026-02-05T16:10:00Z',
    reviewed_at: '2026-02-08T09:20:00Z',
    created_at: '2026-02-04T12:00:00Z',
    updated_at: '2026-02-08T09:20:00Z',
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    registration_number: 'REG-2026-000104',
    student_id: 'b4444444-4444-4444-4444-444444444444',
    registration_type: 'PROGRAM_PROGRESSION',
    institution_id: '33333333-3333-3333-3333-333333333333',
    department_id: 'd4444444-4444-4444-4444-444444444444',
    program_id: 'a5555555-5555-5555-5555-555555555555',
    academic_year: '2026-2027',
    status: 'APPROVED',
    notes: 'Clinical rotation prerequisites cleared.',
    submitted_at: '2026-01-25T14:00:00Z',
    reviewed_at: '2026-01-28T11:00:00Z',
    created_at: '2026-01-24T10:00:00Z',
    updated_at: '2026-01-28T11:00:00Z',
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    registration_number: 'REG-2026-000105',
    student_id: 'b5555555-5555-5555-5555-555555555555',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a2222222-2222-2222-2222-222222222222',
    academic_year: '2026-2027',
    status: 'DRAFT',
    notes: 'Draft saved by registrar awaiting final diploma copy.',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    registration_number: 'REG-2025-000088',
    student_id: 'b1111111-1111-1111-1111-111111111111',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a1111111-1111-1111-1111-111111111111',
    academic_year: '2025-2026',
    status: 'ARCHIVED',
    notes: 'Previous year completed record.',
    submitted_at: '2025-08-15T10:00:00Z',
    reviewed_at: '2025-08-20T14:00:00Z',
    created_at: '2025-08-10T09:00:00Z',
    updated_at: '2026-01-05T12:00:00Z',
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    registration_number: 'REG-2026-000107',
    student_id: 'b2222222-2222-2222-2222-222222222222',
    registration_type: 'RE_REGISTRATION',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a4444444-4444-4444-4444-444444444444',
    academic_year: '2026-2027',
    status: 'RESUBMITTED',
    notes: 'Resubmitted after providing updated transcript.',
    submitted_at: '2026-02-14T15:30:00Z',
    created_at: '2026-02-02T11:00:00Z',
    updated_at: '2026-02-14T15:30:00Z',
  }
];

// Helper to hydrate joined relation data for mock
export function hydrateRegistration(
  reg: Registration,
  students: Student[],
  institutions: Institution[],
  departments: Department[],
  programs: Program[]
): Registration {
  const student = students.find((s) => s.id === reg.student_id);
  const institution = institutions.find((i) => i.id === reg.institution_id);
  const department = departments.find((d) => d.id === reg.department_id);
  const program = programs.find((p) => p.id === reg.program_id);

  return {
    ...reg,
    student,
    institution,
    department,
    program,
  };
}

const STORAGE_KEYS = {
  STUDENTS: 'ata_students_v1',
  REGISTRATIONS: 'ata_registrations_v1',
};

class LocalFallbackStore {
  private students: Student[] = [];
  private registrations: Registration[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStudents) {
        try {
          this.students = JSON.parse(storedStudents);
        } catch {
          this.students = [...INITIAL_STUDENTS];
        }
      } else {
        this.students = [...INITIAL_STUDENTS];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      }

      const storedRegs = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (storedRegs) {
        try {
          this.registrations = JSON.parse(storedRegs);
        } catch {
          this.registrations = [...INITIAL_REGISTRATIONS];
        }
      } else {
        this.registrations = [...INITIAL_REGISTRATIONS];
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(this.registrations));
      }
    } else {
      this.students = [...INITIAL_STUDENTS];
      this.registrations = [...INITIAL_REGISTRATIONS];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(this.registrations));
    }
  }

  getInstitutions(): Institution[] {
    return INITIAL_INSTITUTIONS;
  }

  getDepartments(institutionId?: string): Department[] {
    if (institutionId) {
      return INITIAL_DEPARTMENTS.filter((d) => d.institution_id === institutionId);
    }
    return INITIAL_DEPARTMENTS;
  }

  getPrograms(departmentId?: string): Program[] {
    if (departmentId) {
      return INITIAL_PROGRAMS.filter((p) => p.department_id === departmentId);
    }
    return INITIAL_PROGRAMS;
  }

  getStudents(): Student[] {
    return [...this.students];
  }

  searchStudents(query: string): Student[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getStudents();
    return this.students.filter(
      (s) =>
        s.permanent_uid.toLowerCase().includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }

  createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Student {
    const newStudent: Student = {
      ...data,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.students.unshift(newStudent);
    this.save();
    return newStudent;
  }

  getRegistrations(): Registration[] {
    return this.registrations.map((r) =>
      hydrateRegistration(r, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS)
    );
  }

  getRegistrationById(id: string): Registration | null {
    const reg = this.registrations.find((r) => r.id === id || r.registration_number === id);
    if (!reg) return null;
    return hydrateRegistration(reg, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  createRegistration(data: Partial<Registration>): Registration {
    const now = new Date().toISOString();
    const count = this.registrations.length + 101;
    const year = new Date().getFullYear();
    const regNumber = data.registration_number || `REG-${year}-${String(count).padStart(6, '0')}`;

    const newReg: Registration = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c${Date.now()}`,
      registration_number: regNumber,
      student_id: data.student_id!,
      registration_type: data.registration_type || 'INITIAL_REGISTRATION',
      institution_id: data.institution_id!,
      department_id: data.department_id!,
      program_id: data.program_id!,
      academic_year: data.academic_year || '2026-2027',
      status: data.status || 'DRAFT',
      notes: data.notes || '',
      submitted_at: data.status === 'SUBMITTED' ? now : undefined,
      created_at: now,
      updated_at: now,
    };

    this.registrations.unshift(newReg);
    this.save();
    return hydrateRegistration(newReg, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  updateRegistrationStatus(
    id: string,
    status: WorkflowStatus,
    reasonOrNotes?: string
  ): Registration {
    const idx = this.registrations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Registration not found');

    const now = new Date().toISOString();
    const current = this.registrations[idx];

    const updated: Registration = {
      ...current,
      status,
      updated_at: now,
    };

    if (status === 'SUBMITTED' || status === 'RESUBMITTED') {
      updated.submitted_at = now;
    }
    if (status === 'APPROVED' || status === 'CORRECTION_REQUIRED') {
      updated.reviewed_at = now;
    }
    if (status === 'CORRECTION_REQUIRED' && reasonOrNotes) {
      updated.rejection_reason = reasonOrNotes;
    }
    if (reasonOrNotes && status !== 'CORRECTION_REQUIRED') {
      updated.notes = reasonOrNotes;
    }

    this.registrations[idx] = updated;
    this.save();
    return hydrateRegistration(updated, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  updateRegistrationDraft(id: string, data: Partial<Registration>): Registration {
    const idx = this.registrations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Registration not found');

    const now = new Date().toISOString();
    const updated: Registration = {
      ...this.registrations[idx],
      ...data,
      updated_at: now,
    };

    this.registrations[idx] = updated;
    this.save();
    return hydrateRegistration(updated, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  getDashboardMetrics(): DashboardMetrics {
    const hydrated = this.getRegistrations();
    const totalStudents = this.students.length;
    const totalRegistrations = hydrated.length;
    const approvedRegistrations = hydrated.filter((r) => r.status === 'APPROVED').length;
    const archivedRegistrations = hydrated.filter((r) => r.status === 'ARCHIVED').length;
    const attentionRequiredCount = hydrated.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'RESUBMITTED'
    ).length;
    const registrarTasksCount = hydrated.filter(
      (r) => r.status === 'DRAFT' || r.status === 'CORRECTION_REQUIRED'
    ).length;

    const statuses: WorkflowStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'CORRECTION_REQUIRED',
      'RESUBMITTED',
      'APPROVED',
      'ARCHIVED',
    ];

    const statusLabels: Record<WorkflowStatus, { label: string; color: string }> = {
      DRAFT: { label: 'Draft', color: '#64748b' },
      SUBMITTED: { label: 'Submitted', color: '#3b82f6' },
      UNDER_REVIEW: { label: 'Under Review', color: '#8b5cf6' },
      CORRECTION_REQUIRED: { label: 'Correction Required', color: '#f59e0b' },
      RESUBMITTED: { label: 'Resubmitted', color: '#06b6d4' },
      APPROVED: { label: 'Approved', color: '#10b981' },
      GRADUATED: { label: 'Graduated', color: '#059669' },
      COMPLETED: { label: 'Completed', color: '#0d9488' },
      NOT_COMPLETED: { label: 'Not Completed', color: '#ea580c' },
      TRANSFERRED: { label: 'Transferred', color: '#4f46e5' },
      ARCHIVED: { label: 'Archived', color: '#475569' },
    };

    const workflowDistribution = statuses.map((st) => {
      const count = hydrated.filter((r) => r.status === st).length;
      return {
        status: st,
        label: statusLabels[st].label,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
        color: statusLabels[st].color,
      };
    });

    const regTypes: RegistrationType[] = [
      'INITIAL_REGISTRATION',
      'RE_REGISTRATION',
      'TRANSFER',
      'PROGRAM_PROGRESSION',
    ];

    const typeLabels: Record<RegistrationType, string> = {
      INITIAL_REGISTRATION: 'Initial Registration',
      RE_REGISTRATION: 'Re-Registration',
      TRANSFER: 'Transfer',
      PROGRAM_PROGRESSION: 'Program Progression',
    };

    const registrationTypesDistribution = regTypes.map((t) => {
      const count = hydrated.filter((r) => r.registration_type === t).length;
      return {
        type: t,
        label: typeLabels[t],
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    const years = Array.from(new Set(hydrated.map((r) => r.academic_year))).sort().reverse();
    const academicYearDistribution = years.map((y) => {
      const count = hydrated.filter((r) => r.academic_year === y).length;
      return {
        year: y,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    const institutionDistribution = INITIAL_INSTITUTIONS.map((inst) => {
      const count = hydrated.filter((r) => r.institution_id === inst.id).length;
      return {
        institutionId: inst.id,
        name: inst.name,
        code: inst.code,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    return {
      totalStudents,
      totalRegistrations,
      approvedRegistrations,
      archivedRegistrations,
      attentionRequiredCount,
      registrarTasksCount,
      workflowDistribution,
      registrationTypesDistribution,
      academicYearDistribution,
      institutionDistribution,
    };
  }
}

export const fallbackStore = new LocalFallbackStore();
