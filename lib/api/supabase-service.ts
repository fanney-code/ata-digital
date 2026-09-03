import { supabase } from '../supabase/client';
import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  Profile,
  UserRole,
  WorkflowStatus,
  RegistrationType,
  DashboardMetrics,
} from '../types';

export interface ExcelStudentImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  academic_year?: string;
  registration_type?: RegistrationType;
  institution_name?: string;
  department_name?: string;
  program_name?: string;
}

/**
 * Pure Supabase Real-time API Service Layer
 */

export async function upsertProfile(
  email: string,
  full_name: string,
  role: UserRole
): Promise<Profile> {
  const now = new Date().toISOString();
  const payload = {
    email,
    full_name,
    role,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    return {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role,
      created_at: now,
      updated_at: now,
    };
  }
  return data;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createRegistrarByAdmin(email: string, full_name: string): Promise<Profile> {
  return upsertProfile(email, full_name, 'REGISTRAR');
}

export async function fetchInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase.from('institutions').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchDepartments(institutionId?: string): Promise<Department[]> {
  let query = supabase.from('departments').select('*').order('name');
  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchPrograms(departmentId?: string): Promise<Program[]> {
  let query = supabase.from('programs').select('*').order('name');
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getOrCreateInstitution(targetName?: string): Promise<Institution> {
  const allInsts = await fetchInstitutions();

  if (targetName && targetName.trim()) {
    const matched = allInsts.find(
      (inst) => inst.name.toLowerCase().includes(targetName.trim().toLowerCase()) ||
                inst.code.toLowerCase() === targetName.trim().toLowerCase()
    );
    if (matched) return matched;
  }

  if (allInsts.length > 0) return allInsts[0];

  // Auto-create default institution if table is empty
  const name = targetName && targetName.trim() ? targetName.trim() : 'Institute of Technology & Engineering';
  const code = (name.split(' ').map(w => w[0]).join('') || 'ITE').toUpperCase().slice(0, 10);

  const { data, error } = await supabase
    .from('institutions')
    .insert([{ name, code }])
    .select()
    .single();

  if (error) {
    // Retry fetching
    const reFetch = await fetchInstitutions();
    if (reFetch.length > 0) return reFetch[0];
    throw error;
  }

  return data;
}

export async function getOrCreateDepartment(institutionId: string, targetName?: string): Promise<Department> {
  const depts = await fetchDepartments(institutionId);

  if (targetName && targetName.trim()) {
    const matched = depts.find((d) => d.name.toLowerCase().includes(targetName.trim().toLowerCase()));
    if (matched) return matched;
  }

  if (depts.length > 0) return depts[0];

  // Auto-create department
  const name = targetName && targetName.trim() ? targetName.trim() : 'Computer Science & Software';
  const code = (name.split(' ').map(w => w[0]).join('') || 'CS').toUpperCase().slice(0, 10);

  const { data, error } = await supabase
    .from('departments')
    .insert([{ institution_id: institutionId, name, code }])
    .select()
    .single();

  if (error) {
    const reFetch = await fetchDepartments(institutionId);
    if (reFetch.length > 0) return reFetch[0];
    throw error;
  }

  return data;
}

export async function getOrCreateProgram(departmentId: string, targetName?: string): Promise<Program> {
  const progs = await fetchPrograms(departmentId);

  if (targetName && targetName.trim()) {
    const matched = progs.find((p) => p.name.toLowerCase().includes(targetName.trim().toLowerCase()));
    if (matched) return matched;
  }

  if (progs.length > 0) return progs[0];

  // Auto-create program
  const name = targetName && targetName.trim() ? targetName.trim() : 'B.Sc. Software Engineering';
  const code = (name.split(' ').map(w => w[0]).join('') || 'BS-SE').toUpperCase().slice(0, 10);

  const { data, error } = await supabase
    .from('programs')
    .insert([{ department_id: departmentId, name, code, degree_level: 'UNDERGRADUATE' }])
    .select()
    .single();

  if (error) {
    const reFetch = await fetchPrograms(departmentId);
    if (reFetch.length > 0) return reFetch[0];
    throw error;
  }

  return data;
}

export async function fetchStudents(searchQuery?: string): Promise<Student[]> {
  let query = supabase.from('students').select('*').order('created_at', { ascending: false });
  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    query = query.or(`permanent_uid.ilike.${q},first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createStudent(
  studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchRegistrations(filters?: {
  status?: WorkflowStatus;
}): Promise<Registration[]> {
  let query = supabase
    .from('registrations')
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .order('updated_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchRegistrationById(id: string): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .or(`id.eq.${id},registration_number.eq.${id}`)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createRegistration(
  regData: Partial<Registration>
): Promise<Registration> {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const regNumber = regData.registration_number || `REG-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

  const payload = {
    registration_number: regNumber,
    student_id: regData.student_id,
    registration_type: regData.registration_type || 'INITIAL_REGISTRATION',
    institution_id: regData.institution_id,
    department_id: regData.department_id,
    program_id: regData.program_id,
    academic_year: regData.academic_year || '2026-2027',
    status: regData.status || 'DRAFT',
    notes: regData.notes || '',
    submitted_at: regData.status === 'SUBMITTED' ? now : null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('registrations')
    .insert([payload])
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateRegistrationStatus(
  id: string,
  status: WorkflowStatus,
  reasonOrNotes?: string
): Promise<Registration> {
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status,
    updated_at: now,
  };

  if (status === 'SUBMITTED' || status === 'RESUBMITTED') {
    updatePayload.submitted_at = now;
  }
  if (status === 'APPROVED' || status === 'CORRECTION_REQUIRED') {
    updatePayload.reviewed_at = now;
  }
  if (status === 'CORRECTION_REQUIRED' && reasonOrNotes) {
    updatePayload.rejection_reason = reasonOrNotes;
  }
  if (reasonOrNotes && status !== 'CORRECTION_REQUIRED') {
    updatePayload.notes = reasonOrNotes;
  }

  const { data, error } = await supabase
    .from('registrations')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateRegistrationDraft(
  id: string,
  regData: Partial<Registration>
): Promise<Registration> {
  const now = new Date().toISOString();
  const updatePayload = {
    ...regData,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('registrations')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function batchImportStudentRegistrations(
  rows: ExcelStudentImportRow[]
): Promise<{ successCount: number; errors: string[]; createdRegistrations: Registration[] }> {
  let successCount = 0;
  const errors: string[] = [];
  const createdRegistrations: Registration[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const email = row.email || `student_${Date.now()}_${i}@student.edu`;
      const firstName = row.first_name || 'Student';
      const lastName = row.last_name || `${i + 1}`;
      const uid = `STU-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Get or Create Institution, Department, Program dynamically
      const inst = await getOrCreateInstitution(row.institution_name);
      const dept = await getOrCreateDepartment(inst.id, row.department_name);
      const prog = await getOrCreateProgram(dept.id, row.program_name);

      // 2. Create or fetch Student
      const { data: existingStudents } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .limit(1);

      let student: Student;
      if (existingStudents && existingStudents.length > 0) {
        student = existingStudents[0];
      } else {
        const { data: newStudent, error: stuErr } = await supabase
          .from('students')
          .insert([
            {
              permanent_uid: uid,
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: row.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (stuErr) throw stuErr;
        student = newStudent;
      }

      // 3. Create Registration (with valid non-null institution_id, department_id, program_id)
      const reg = await createRegistration({
        student_id: student.id,
        registration_type: row.registration_type || 'INITIAL_REGISTRATION',
        institution_id: inst.id,
        department_id: dept.id,
        program_id: prog.id,
        academic_year: row.academic_year || '2026-2027',
        status: 'SUBMITTED',
        notes: `Imported via Excel Batch Registration Processor on ${new Date().toLocaleDateString()}`,
      });

      createdRegistrations.push(reg);
      successCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 1} (${row.first_name} ${row.last_name}): ${err.message}`);
    }
  }

  return { successCount, errors, createdRegistrations };
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const studentsRes = await supabase.from('students').select('*', { count: 'exact', head: true });
  if (studentsRes.error) throw studentsRes.error;

  const regsRes = await supabase.from('registrations').select('*');
  if (regsRes.error) throw regsRes.error;

  const insts = await fetchInstitutions();

  const regs: Registration[] = regsRes.data || [];
  const totalStudents = studentsRes.count || 0;
  const totalRegistrations = regs.length;
  const approvedRegistrations = regs.filter((r) => r.status === 'APPROVED').length;
  const archivedRegistrations = regs.filter((r) => r.status === 'ARCHIVED').length;
  const attentionRequiredCount = regs.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'RESUBMITTED'
  ).length;
  const registrarTasksCount = regs.filter(
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
    ARCHIVED: { label: 'Archived', color: '#475569' },
  };

  const workflowDistribution = statuses.map((st) => {
    const count = regs.filter((r) => r.status === st).length;
    return {
      status: st,
      label: statusLabels[st].label,
      count,
      percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      color: statusLabels[st].color,
    };
  });

  const regTypes: Array<{ type: RegistrationType; label: string }> = [
    { type: 'INITIAL_REGISTRATION', label: 'Initial Registration' },
    { type: 'RE_REGISTRATION', label: 'Re-Registration' },
    { type: 'TRANSFER', label: 'Transfer' },
    { type: 'PROGRAM_PROGRESSION', label: 'Program Progression' },
  ];

  const registrationTypesDistribution = regTypes.map((t) => {
    const count = regs.filter((r) => r.registration_type === t.type).length;
    return {
      type: t.type,
      label: t.label,
      count,
      percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
    };
  });

  const years = Array.from(new Set(regs.map((r) => r.academic_year))).sort().reverse();
  const academicYearDistribution = years.map((y) => {
    const count = regs.filter((r) => r.academic_year === y).length;
    return {
      year: y,
      count,
      percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
    };
  });

  const institutionDistribution = insts.map((inst) => {
    const count = regs.filter((r) => r.institution_id === inst.id).length;
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

export async function updateStudent(
  studentId: string,
  data: Partial<Student>
): Promise<Student> {
  const { data: updated, error } = await supabase
    .from('students')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

export async function deleteRegistration(
  registrationId: string,
  studentId?: string
): Promise<void> {
  const { error: regError } = await supabase
    .from('registrations')
    .delete()
    .eq('id', registrationId);

  if (regError) throw regError;

  if (studentId) {
    const { data: otherRegs } = await supabase
      .from('registrations')
      .select('id')
      .eq('student_id', studentId);

    if (!otherRegs || otherRegs.length === 0) {
      await supabase.from('students').delete().eq('id', studentId);
    }
  }
}

export async function deleteRegistrationsBulk(
  registrationIds: string[],
  studentIds?: string[]
): Promise<void> {
  if (registrationIds.length === 0) return;

  const { error } = await supabase
    .from('registrations')
    .delete()
    .in('id', registrationIds);

  if (error) throw error;

  if (studentIds && studentIds.length > 0) {
    for (const sId of studentIds) {
      const { data: otherRegs } = await supabase
        .from('registrations')
        .select('id')
        .eq('student_id', sId);

      if (!otherRegs || otherRegs.length === 0) {
        await supabase.from('students').delete().eq('id', sId);
      }
    }
  }
}

export async function updateRegistrationAndStudent(
  registrationId: string,
  studentId: string,
  payload: {
    student: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
    registration: {
      academic_year?: string;
      registration_type?: RegistrationType;
      status?: WorkflowStatus;
      institution_id?: string;
      department_id?: string;
      program_id?: string;
      notes?: string;
    };
  }
): Promise<Registration> {
  if (Object.keys(payload.student).length > 0) {
    const { error: stuError } = await supabase
      .from('students')
      .update({ ...payload.student, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    if (stuError) throw stuError;
  }

  const { data: updatedReg, error: regError } = await supabase
    .from('registrations')
    .update({ ...payload.registration, updated_at: new Date().toISOString() })
    .eq('id', registrationId)
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .single();

  if (regError) throw regError;
  return updatedReg;
}
