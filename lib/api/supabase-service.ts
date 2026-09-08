import { supabase } from '../supabase/client';
import { supabaseAdmin, ensureStorageBucket, STORAGE_BUCKET } from '../supabase/admin';

import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  Profile,
  UserRole,
  ActorContext,
  WorkflowStatus,
  RegistrationType,
  DashboardMetrics,
  AuditLog,
} from '../types';
import {
  extractYear,
  findLowestUnusedUidSequence,
  findNextRegistrationSequence,
} from './id-generator';
import { isAadharMatch, normalizeAadhar, maskAadhar } from '../utils/aadhar';

// Institution assignment for Registrars must be provided explicitly via institutionId parameter
// in createRegistrarByAdmin(). Email-based lookup has been removed per the access control spec.

export function assertPermission(
  action:
    | 'CREATE_REGISTRATION'
    | 'EDIT_REGISTRATION'
    | 'UPLOAD_DOCUMENT'
    | 'PREVIEW_DOCUMENT'
    | 'DOWNLOAD_DOCUMENT'
    | 'DELETE_DOCUMENT'
    | 'UPDATE_STATUS'
    | 'DELETE_REGISTRATION'
    | 'IMPORT_BATCH'
    | 'CREATE_STUDENT'
    | 'EDIT_STUDENT'
    | 'DELETE_STUDENT'
    | 'MANAGE_USERS'
    | 'ASSIGN_NOTICE',
  actor?: ActorContext,
  targetInstitutionId?: string,
  extra?: { status?: WorkflowStatus }
): void {
  if (!actor) return; // Unrestricted if actor not specified directly (authoritative server-side check)

  const { role, institutionId } = actor;

  switch (action) {
    case 'PREVIEW_DOCUMENT':
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot preview documents belonging to another institution.');
        }
      }
      // Administrator and Universal have read-only cross-institution oversight preview
      break;

    case 'DOWNLOAD_DOCUMENT':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators are not permitted to download documents.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot download documents.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot download documents belonging to another institution.');
        }
      }
      break;

    case 'DELETE_DOCUMENT':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators cannot delete documents.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot delete documents.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot delete documents belonging to another institution.');
        }
      }
      break;

    case 'CREATE_REGISTRATION':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators are restricted from creating registrations. Registration creation is an operational Registrar action.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot create registrations.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Registrars can only create registrations for their assigned institution.');
        }
      }
      break;

    case 'EDIT_REGISTRATION':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators cannot edit registration operational details.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot edit registrations.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot modify registration belonging to another institution.');
        }
      }
      break;

    case 'UPLOAD_DOCUMENT':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrator document access is PREVIEW ONLY. Uploading or modifying documents is not permitted.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot upload documents.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot upload documents for another institution.');
        }
      }
      break;

    case 'UPDATE_STATUS':
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot alter workflow status.');
      }
      if (role === 'ADMINISTRATOR') {
        if (extra?.status === 'RESUBMITTED' || extra?.status === 'DRAFT') {
          throw new Error(`403 Forbidden: Administrators cannot perform ${extra?.status} operational workflow actions.`);
        }
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot alter status of registration belonging to another institution.');
        }
      }
      break;

    case 'DELETE_REGISTRATION':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators cannot delete registrations.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
        if (targetInstitutionId && targetInstitutionId !== institutionId) {
          throw new Error('403 Forbidden: Cannot delete registration belonging to another institution.');
        }
      }
      break;

    case 'IMPORT_BATCH':
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators cannot import registration batches.');
      }
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only.');
      }
      if (role === 'REGISTRAR') {
        if (!institutionId) {
          throw new Error('403 Forbidden: Registrar has no assigned institution.');
        }
      }
      break;

    case 'CREATE_STUDENT':
    case 'EDIT_STUDENT':
    case 'DELETE_STUDENT':
      if (role === 'UNIVERSAL') {
        throw new Error('403 Forbidden: Universal role is read-only and cannot mutate student records.');
      }
      if (role === 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Administrators cannot perform student operational mutations.');
      }
      break;

    case 'MANAGE_USERS':
    case 'ASSIGN_NOTICE':
      if (role !== 'ADMINISTRATOR') {
        throw new Error('403 Forbidden: Only Administrators can manage user accounts and assign notices.');
      }
      break;
  }
}

export interface ExcelStudentImportRow {
  permanent_uid?: string;
  registration_number?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  state?: string;
  address?: string;
  city?: string;
  district?: string;
  pincode?: string;
  country?: string;
  aadhar_number?: string;
  alternate_phone?: string;
  alternate_email?: string;
  highest_qualification?: string;
  previous_institution?: string;
  previous_program?: string;
  year_of_completion?: string;
  qualification_reg_no?: string;
  previous_registration_number?: string;
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
  role: UserRole,
  institution_id?: string
): Promise<Profile> {
  const now = new Date().toISOString();
  // Institution assignment is provided explicitly as institutionId parameter.
  // No email-based lookup — institution must be assigned by Administrator explicitly.
  const assignedInstId = institution_id;

  const payload: any = {
    email,
    full_name,
    role,
    updated_at: now,
  };
  if (assignedInstId) {
    payload.institution_id = assignedInstId;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([payload], { onConflict: 'email' })
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch {}

  // Fallback profile object
  return {
    id: `usr-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email,
    full_name,
    role,
    institution_id: assignedInstId,
    created_at: now,
    updated_at: now,
  };
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createRegistrarByAdmin(
  email: string,
  full_name: string,
  institutionId?: string,
  actor?: ActorContext
): Promise<Profile> {
  assertPermission('MANAGE_USERS', actor);
  return upsertProfile(email, full_name, 'REGISTRAR', institutionId);
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
  if (departmentId) {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('department_id', departmentId)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  // Authoritatively return the unique program catalog without being truncated by 1000 PostgREST row limit
  const { data: dept } = await supabase.from('departments').select('id').limit(1).maybeSingle();
  if (dept?.id) {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('department_id', dept.id)
      .order('name');
    if (!error && data && data.length > 0) {
      return data;
    }
  }

  const { data, error } = await supabase.from('programs').select('*').order('name');
  if (error) throw error;

  const seenCodes = new Set<string>();
  const uniquePrograms: Program[] = [];
  for (const prog of data || []) {
    if (!seenCodes.has(prog.code)) {
      seenCodes.add(prog.code);
      uniquePrograms.push(prog);
    }
  }
  return uniquePrograms;
}

export async function fetchProgramsForInstitution(institutionId: string): Promise<Program[]> {
  const depts = await fetchDepartments(institutionId);
  if (!depts || depts.length === 0) return [];
  const deptIds = depts.map((d) => d.id);
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .in('department_id', deptIds)
    .order('name');
  if (error) throw error;

  // Deduplicate by program code so programs don't repeat if an institution has multiple departments
  const seenCodes = new Set<string>();
  const uniquePrograms: Program[] = [];
  for (const prog of data || []) {
    if (!seenCodes.has(prog.code)) {
      seenCodes.add(prog.code);
      uniquePrograms.push(prog);
    }
  }
  return uniquePrograms;
}

export async function resolveInstitution(targetNameOrCode?: string): Promise<Institution> {
  const allInsts = await fetchInstitutions();
  if (!targetNameOrCode || !targetNameOrCode.trim()) {
    throw new Error('Institution name or code is required to resolve institution.');
  }

  const clean = targetNameOrCode.trim().toLowerCase();
  const matched = allInsts.find(
    (inst) => inst.id.toLowerCase() === clean ||
              inst.code.toLowerCase() === clean ||
              inst.name.toLowerCase() === clean ||
              inst.name.toLowerCase().includes(clean) ||
              clean.includes(inst.name.toLowerCase())
  );
  if (matched) return matched;

  throw new Error(`Institution "${targetNameOrCode}" not found in authoritative master data.`);
}

export async function getOrCreateInstitution(targetName?: string): Promise<Institution> {
  return resolveInstitution(targetName);
}

export async function resolveDepartment(institutionId: string, targetNameOrCode?: string): Promise<Department> {
  const depts = await fetchDepartments(institutionId);
  if (!targetNameOrCode || !targetNameOrCode.trim()) {
    if (depts.length > 0) return depts[0];
    throw new Error('No departments found for the selected institution.');
  }

  const clean = targetNameOrCode.trim().toLowerCase();
  const matched = depts.find(
    (d) => d.id.toLowerCase() === clean ||
           d.code.toLowerCase() === clean ||
           d.name.toLowerCase() === clean ||
           d.name.toLowerCase().includes(clean) ||
           clean.includes(d.name.toLowerCase())
  );
  if (matched) return matched;
  if (depts.length > 0) return depts[0];

  throw new Error(`Department "${targetNameOrCode}" not found for institution in authoritative master data.`);
}

export async function getOrCreateDepartment(institutionId: string, targetName?: string): Promise<Department> {
  return resolveDepartment(institutionId, targetName);
}

export async function resolveProgram(departmentId: string, targetNameOrCode?: string): Promise<Program> {
  const progs = await fetchPrograms(departmentId);
  if (progs.length === 0) {
    throw new Error('No programs found for the selected department.');
  }

  if (!targetNameOrCode || !targetNameOrCode.trim()) {
    throw new Error('Program name or code is required to resolve program.');
  }

  const clean = targetNameOrCode.trim().toLowerCase();
  const matched = progs.find(
    (p) => p.id.toLowerCase() === clean ||
           p.code.toLowerCase() === clean ||
           p.name.toLowerCase() === clean ||
           p.name.toLowerCase().includes(clean) ||
           clean.includes(p.name.toLowerCase())
  );
  if (matched) return matched;

  throw new Error(`Program "${targetNameOrCode}" not found for department in authoritative master data.`);
}

export async function getOrCreateProgram(departmentId: string, targetName?: string): Promise<Program> {
  return resolveProgram(departmentId, targetName);
}

export async function validateMasterDataHierarchy(params: {
  institutionId?: string;
  departmentId?: string;
  programId?: string;
  academicYear?: string;
}): Promise<{
  institution: Institution;
  department: Department;
  program: Program;
  year: number;
}> {
  if (!params.institutionId) throw new Error('Institution ID is required');
  if (!params.departmentId) throw new Error('Department ID is required');
  if (!params.programId) throw new Error('Program ID is required');

  const insts = await fetchInstitutions();
  const inst = insts.find((i) => i.id === params.institutionId || i.code === params.institutionId || i.name === params.institutionId);
  if (!inst) throw new Error(`Institution "${params.institutionId}" does not exist in master data`);
  if (!inst.code || !inst.code.trim()) {
    throw new Error(`Data Issue: Institution "${inst.name}" is missing an authoritative code`);
  }

  const depts = await fetchDepartments(inst.id);
  const dept = depts.find((d) => d.id === params.departmentId || d.code === params.departmentId || d.name === params.departmentId);
  if (!dept) throw new Error(`Department "${params.departmentId}" does not exist or does not belong to Institution "${inst.name}"`);
  if (dept.institution_id !== inst.id) {
    throw new Error(`Department "${dept.name}" does not belong to Institution "${inst.name}"`);
  }
  if (!dept.code || !dept.code.trim()) {
    throw new Error(`Data Issue: Department "${dept.name}" is missing an authoritative code`);
  }

  const progs = await fetchPrograms(dept.id);
  const prog = progs.find((p) => p.id === params.programId || p.code === params.programId || p.name === params.programId);
  if (!prog) throw new Error(`Program "${params.programId}" does not exist or does not belong to Department "${dept.name}"`);
  if (prog.department_id !== dept.id) {
    throw new Error(`Program "${prog.name}" does not belong to Department "${dept.name}"`);
  }
  if (!prog.code || !prog.code.trim()) {
    throw new Error(`Data Issue: Program "${prog.name}" is missing an authoritative code`);
  }

  const year = extractYear(params.academicYear);
  if (year < 1900 || year > 2100) {
    throw new Error(`Invalid academic year: ${params.academicYear}`);
  }

  return { institution: inst, department: dept, program: prog, year };
}

// Extended fields persistence cache (bridges DB schema cache refreshes / pending migrations)
const STUDENT_EXT_STORAGE_KEY = 'ata_student_extended_fields_v1';
const REG_EXT_STORAGE_KEY = 'ata_registration_extended_fields_v1';

let _supportsExtendedStudentColumns: boolean | null = null;
let _supportsExtendedRegistrationColumns: boolean | null = null;

const memoryStudentExtMap: Record<string, Partial<Student>> = {};
const memoryRegExtMap: Record<string, Partial<Registration>> = {};

function isSchemaCacheOrColumnError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('schema cache') ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    details.includes('schema cache')
  );
}

function getStoredExtendedMap(key: string): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : {};
  } catch {
    return {};
  }
}

function saveStoredExtendedMap(key: string, map: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

export function setStudentExtendedFields(idOrUid: string, fields: Partial<Student>) {
  if (!idOrUid) return;
  const cleanFields: Partial<Student> = {};
  if (fields.state !== undefined) cleanFields.state = fields.state;
  if (fields.address !== undefined) cleanFields.address = fields.address;
  if (fields.city !== undefined) cleanFields.city = fields.city;
  if (fields.district !== undefined) cleanFields.district = fields.district;
  if (fields.pincode !== undefined) cleanFields.pincode = fields.pincode;
  if (fields.country !== undefined) cleanFields.country = fields.country;
  if (fields.alternate_phone !== undefined) cleanFields.alternate_phone = fields.alternate_phone;
  if (fields.alternate_email !== undefined) cleanFields.alternate_email = fields.alternate_email;
  if (fields.aadhar_number !== undefined) cleanFields.aadhar_number = fields.aadhar_number;
  if (fields.national_id !== undefined && !cleanFields.aadhar_number) cleanFields.aadhar_number = fields.national_id;

  memoryStudentExtMap[idOrUid] = { ...(memoryStudentExtMap[idOrUid] || {}), ...cleanFields };
  const stored = getStoredExtendedMap(STUDENT_EXT_STORAGE_KEY);
  stored[idOrUid] = { ...(stored[idOrUid] || {}), ...cleanFields };
  saveStoredExtendedMap(STUDENT_EXT_STORAGE_KEY, stored);
}

export function getStudentExtendedFields(idOrUid: string): Partial<Student> | undefined {
  if (!idOrUid) return undefined;
  const stored = getStoredExtendedMap(STUDENT_EXT_STORAGE_KEY);
  const combined = { ...(stored[idOrUid] || {}), ...(memoryStudentExtMap[idOrUid] || {}) };
  return Object.keys(combined).length > 0 ? combined : undefined;
}

export function enrichStudent(student: Student | null | undefined): Student {
  if (!student) return student as any;
  const ext = getStudentExtendedFields(student.id) || (student.permanent_uid ? getStudentExtendedFields(student.permanent_uid) : undefined);
  if (!ext) return student;
  return {
    ...student,
    state: student.state || ext.state || '',
    address: student.address || ext.address || undefined,
    city: student.city || ext.city || undefined,
    district: student.district || ext.district || undefined,
    pincode: student.pincode || ext.pincode || undefined,
    country: student.country || ext.country || 'India',
    alternate_phone: student.alternate_phone || ext.alternate_phone || undefined,
    alternate_email: student.alternate_email || ext.alternate_email || undefined,
    aadhar_number: student.aadhar_number || ext.aadhar_number || student.national_id || undefined,
  };
}

export function setRegistrationExtendedFields(idOrRegNo: string, fields: Partial<Registration>) {
  if (!idOrRegNo) return;
  const cleanFields: Partial<Registration> = {};
  if (fields.highest_qualification !== undefined) cleanFields.highest_qualification = fields.highest_qualification;
  if (fields.previous_institution !== undefined) cleanFields.previous_institution = fields.previous_institution;
  if (fields.previous_program !== undefined) cleanFields.previous_program = fields.previous_program;
  if (fields.year_of_completion !== undefined) cleanFields.year_of_completion = fields.year_of_completion;
  if (fields.qualification_reg_no !== undefined) cleanFields.qualification_reg_no = fields.qualification_reg_no;
  if (fields.previous_registration_number !== undefined) cleanFields.previous_registration_number = fields.previous_registration_number;

  memoryRegExtMap[idOrRegNo] = { ...(memoryRegExtMap[idOrRegNo] || {}), ...cleanFields };
  const stored = getStoredExtendedMap(REG_EXT_STORAGE_KEY);
  stored[idOrRegNo] = { ...(stored[idOrRegNo] || {}), ...cleanFields };
  saveStoredExtendedMap(REG_EXT_STORAGE_KEY, stored);
}

export function getRegistrationExtendedFields(idOrRegNo: string): Partial<Registration> | undefined {
  if (!idOrRegNo) return undefined;
  const stored = getStoredExtendedMap(REG_EXT_STORAGE_KEY);
  const combined = { ...(stored[idOrRegNo] || {}), ...(memoryRegExtMap[idOrRegNo] || {}) };
  return Object.keys(combined).length > 0 ? combined : undefined;
}

export function enrichRegistration(reg: Registration | null | undefined): Registration {
  if (!reg) return reg as any;
  const ext = getRegistrationExtendedFields(reg.id) || (reg.registration_number ? getRegistrationExtendedFields(reg.registration_number) : undefined);
  const enrichedStudent = reg.student ? enrichStudent(reg.student) : reg.student;
  if (!ext) {
    return {
      ...reg,
      student: enrichedStudent,
    };
  }
  return {
    ...reg,
    highest_qualification: reg.highest_qualification || ext.highest_qualification || undefined,
    previous_institution: reg.previous_institution || ext.previous_institution || undefined,
    previous_program: reg.previous_program || ext.previous_program || undefined,
    year_of_completion: reg.year_of_completion || ext.year_of_completion || undefined,
    qualification_reg_no: reg.qualification_reg_no || ext.qualification_reg_no || undefined,
    previous_registration_number: reg.previous_registration_number || ext.previous_registration_number || undefined,
    student: enrichedStudent,
  };
}

export async function findStudentByAadhar(aadhar: string): Promise<Student | null> {
  const norm = normalizeAadhar(aadhar);
  if (!norm) return null;

  // Retrieve existing students with a non-null national_id
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .not('national_id', 'is', null);

  if (error || !data) return null;

  // Exact normalized comparison in application code
  const found = data.find((s) => isAadharMatch(s.national_id, norm));
  return found ? enrichStudent(found) : null;
}

export async function fetchStudents(searchQuery?: string, actor?: ActorContext): Promise<Student[]> {
  if (actor?.role === 'REGISTRAR') {
    if (!actor.institutionId) {
      return [];
    }
  }

  let query = supabase.from('students').select('*').order('created_at', { ascending: false });
  const trimmed = searchQuery?.trim();

  if (trimmed) {
    const q = `%${trimmed}%`;
    const normQ = normalizeAadhar(trimmed);
    const orClauses = [
      `permanent_uid.ilike.${q}`,
      `first_name.ilike.${q}`,
      `last_name.ilike.${q}`,
      `email.ilike.${q}`,
      `phone.ilike.${q}`,
      `national_id.ilike.${q}`,
      `state.ilike.${q}`,
    ];

    if (normQ && normQ !== trimmed) {
      orClauses.push(`national_id.ilike.%${normQ}%`);
    }

    query = query.or(orClauses.join(','));
  }

  const { data, error } = await query;
  if (error) throw error;
  let results = (data || []).map((s) => enrichStudent(s));

  // If search query contains Aadhar digits, perform application-level exact normalized matching
  // to ensure formatted search finds unformatted stored values and vice-versa
  if (trimmed) {
    const normQ = normalizeAadhar(trimmed);
    if (normQ && normQ.length >= 4) {
      const alreadyFound = results.some((s) => isAadharMatch(s.national_id, normQ));
      if (!alreadyFound) {
        const { data: aadharCandidates } = await supabase
          .from('students')
          .select('*')
          .not('national_id', 'is', null);

        if (aadharCandidates) {
          const matchedByAadhar = aadharCandidates
            .filter((s) => isAadharMatch(s.national_id, normQ))
            .map((s) => enrichStudent(s));

          const existingIds = new Set(results.map((r) => r.id));
          for (const m of matchedByAadhar) {
            if (!existingIds.has(m.id)) {
              results.unshift(m);
              existingIds.add(m.id);
            }
          }
        }
      }
    }
  }

  // If actor is REGISTRAR, strictly scope students to those with registrations in their assigned institution
  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    const { data: instRegs } = await supabase
      .from('registrations')
      .select('student_id')
      .eq('institution_id', actor.institutionId);
    const validStudentIds = new Set((instRegs || []).map((r) => r.student_id));
    results = results.filter((s) => validStudentIds.has(s.id));
  }

  return results;
}

export async function fetchStudentById(studentIdOrUid: string, actor?: ActorContext): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .or(`id.eq.${studentIdOrUid},permanent_uid.eq.${studentIdOrUid}`)
    .maybeSingle();

  if (error || !data) return null;

  if (actor?.role === 'REGISTRAR') {
    if (!actor.institutionId) return null;
    const { data: instRegs } = await supabase
      .from('registrations')
      .select('id')
      .eq('student_id', data.id)
      .eq('institution_id', actor.institutionId)
      .limit(1);
    if (!instRegs || instRegs.length === 0) {
      return null;
    }
  }

  return enrichStudent(data);
}

export async function fetchStudentWithHistory(studentIdOrUid: string, actor?: ActorContext): Promise<{ student: Student; registrations: Registration[] } | null> {
  const student = await fetchStudentById(studentIdOrUid, actor);
  if (!student) return null;

  let query = supabase
    .from('registrations')
    .select(`
      *,
      student:students(*),
      institution:institutions(*),
      department:departments(*),
      program:programs(*)
    `)
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    query = query.eq('institution_id', actor.institutionId);
  }

  const { data: registrations, error: regError } = await query;
  if (regError) throw regError;

  return {
    student: enrichStudent(student),
    registrations: (registrations || []).map((r) => enrichRegistration(r)),
  };
}

export async function generatePermanentStudentUid(year: number): Promise<string> {
  const prefix = `STU-${year}-`;
  const { data } = await supabase
    .from('students')
    .select('permanent_uid')
    .ilike('permanent_uid', `${prefix}%`);

  const existingUids = (data || []).map((s) => s.permanent_uid).filter(Boolean);
  return findLowestUnusedUidSequence(existingUids, year);
}

export async function createStudent(
  studentData: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'permanent_uid'> & {
    permanent_uid?: string;
  },
  intakeYear?: number,
  actor?: ActorContext
): Promise<Student> {
  assertPermission('CREATE_STUDENT', actor);

  // Required core field validations for new students
  if (!studentData.first_name?.trim()) throw new Error('First Name is required');
  if (!studentData.last_name?.trim()) throw new Error('Last Name is required');
  if (!studentData.email?.trim()) throw new Error('Email Address is required');
  if (!studentData.state?.trim()) throw new Error('State is required for student registration');
  if (!studentData.phone?.trim()) throw new Error('Phone Number is required for student registration');
  if (!studentData.date_of_birth) throw new Error('Date of Birth is required for student registration');

  const nationalId = studentData.aadhar_number?.trim() || studentData.national_id?.trim() || null;
  if (!nationalId) throw new Error('Aadhar Number / National ID is required for student registration');

  // Application-level Aadhar duplicate check before student creation
  const normAadhar = normalizeAadhar(nationalId);
  if (normAadhar) {
    const existingStu = await findStudentByAadhar(normAadhar);
    if (existingStu) {
      throw new Error(
        `A student with this Aadhar Number (Aadhar ending in ${maskAadhar(normAadhar)}) already exists (${existingStu.permanent_uid}). Please select the existing student record.`
      );
    }
  }

  if (!studentData.country?.trim()) throw new Error('Country is required for student registration');
  if (!studentData.address?.trim()) throw new Error('Street Address is required for student registration');
  if (!studentData.city?.trim()) throw new Error('City / Town is required for student registration');
  if (!studentData.pincode?.trim()) throw new Error('PIN Code / Postal Code is required for student registration');

  const year = intakeYear || new Date().getFullYear();
  let permanentUid = studentData.permanent_uid?.trim();

  if (!permanentUid) {
    permanentUid = await generatePermanentStudentUid(year);
  }

  let attempts = 0;

  while (attempts < 5) {
    attempts++;
    const fullPayload: any = {
      permanent_uid: permanentUid,
      first_name: studentData.first_name.trim(),
      last_name: studentData.last_name.trim(),
      email: studentData.email.trim(),
      phone: studentData.phone?.trim() || null,
      date_of_birth: studentData.date_of_birth || null,
      gender: studentData.gender || null,
      national_id: nationalId,
      state: studentData.state.trim(),
      address: studentData.address?.trim() || null,
      city: studentData.city?.trim() || null,
      district: studentData.district?.trim() || null,
      pincode: studentData.pincode?.trim() || null,
      country: studentData.country?.trim() || 'India',
      alternate_phone: studentData.alternate_phone?.trim() || null,
      alternate_email: studentData.alternate_email?.trim() || null,
    };

    const basePayload: any = {
      permanent_uid: permanentUid,
      first_name: studentData.first_name.trim(),
      last_name: studentData.last_name.trim(),
      email: studentData.email.trim(),
      phone: studentData.phone?.trim() || null,
      date_of_birth: studentData.date_of_birth || null,
      gender: studentData.gender || null,
      national_id: nationalId,
    };

    // If extended columns are not supported by the current remote schema cache, insert base columns directly
    if (_supportsExtendedStudentColumns === false) {
      const { data: baseData, error: baseErr } = await supabase
        .from('students')
        .insert([basePayload])
        .select()
        .single();

      if (!baseErr && baseData) {
        setStudentExtendedFields(baseData.id, fullPayload);
        setStudentExtendedFields(baseData.permanent_uid, fullPayload);
        return { ...baseData, ...fullPayload };
      }

      const baseErrStr = `${baseErr?.message || ''} ${baseErr?.details || ''}`.toLowerCase();
      if (baseErr?.code === '23505' && (baseErrStr.includes('email') || baseErrStr.includes('students_email_key'))) {
        throw new Error('A student with this email address already exists. Please select the existing student record.');
      }

      if (baseErr && (baseErr.code === '23505' || baseErrStr.includes('permanent_uid'))) {
        permanentUid = await generatePermanentStudentUid(year);
        continue;
      }

      throw new Error(baseErr?.message || 'Failed to create student record in database.');
    }

    // Try full insert first
    const { data, error } = await supabase
      .from('students')
      .insert([fullPayload])
      .select()
      .single();

    if (!error && data) {
      _supportsExtendedStudentColumns = true;
      setStudentExtendedFields(data.id, fullPayload);
      setStudentExtendedFields(data.permanent_uid, fullPayload);
      return data;
    }

    const errStr = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    if (error?.code === '23505' && (errStr.includes('email') || errStr.includes('students_email_key'))) {
      throw new Error('A student with this email address already exists. Please select the existing student record.');
    }

    if (error && (error.code === '23505' || errStr.includes('permanent_uid'))) {
      permanentUid = await generatePermanentStudentUid(year);
      continue;
    }

    // Handle schema cache / unmigrated column error gracefully
    if (error && isSchemaCacheOrColumnError(error)) {
      _supportsExtendedStudentColumns = false;
      const { data: baseData, error: baseErr } = await supabase
        .from('students')
        .insert([basePayload])
        .select()
        .single();

      if (!baseErr && baseData) {
        setStudentExtendedFields(baseData.id, fullPayload);
        setStudentExtendedFields(baseData.permanent_uid, fullPayload);
        return { ...baseData, ...fullPayload };
      }

      const fbErrStr = `${baseErr?.message || ''} ${baseErr?.details || ''}`.toLowerCase();
      if (baseErr?.code === '23505' && (fbErrStr.includes('email') || fbErrStr.includes('students_email_key'))) {
        throw new Error('A student with this email address already exists. Please select the existing student record.');
      }

      if (baseErr && (baseErr.code === '23505' || fbErrStr.includes('permanent_uid'))) {
        permanentUid = await generatePermanentStudentUid(year);
        continue;
      }

      throw new Error(baseErr?.message || 'Failed to create student record in database.');
    }

    throw error;
  }

  throw new Error('Failed to create student after maximum sequence retries');
}

export async function updateStudent(
  id: string,
  updates: Partial<Student>,
  actor?: ActorContext
): Promise<Student> {
  assertPermission('EDIT_STUDENT', actor);

  const nationalId = updates.aadhar_number?.trim() || updates.national_id?.trim();
  const fullPayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.first_name !== undefined) fullPayload.first_name = updates.first_name.trim();
  if (updates.last_name !== undefined) fullPayload.last_name = updates.last_name.trim();
  if (updates.email !== undefined) fullPayload.email = updates.email.trim();
  if (updates.phone !== undefined) fullPayload.phone = updates.phone?.trim() || null;
  if (updates.date_of_birth !== undefined) fullPayload.date_of_birth = updates.date_of_birth || null;
  if (updates.gender !== undefined) fullPayload.gender = updates.gender || null;
  if (nationalId !== undefined) fullPayload.national_id = nationalId || null;
  if (updates.state !== undefined) fullPayload.state = updates.state?.trim() || null;
  if (updates.address !== undefined) fullPayload.address = updates.address?.trim() || null;
  if (updates.city !== undefined) fullPayload.city = updates.city?.trim() || null;
  if (updates.district !== undefined) fullPayload.district = updates.district?.trim() || null;
  if (updates.pincode !== undefined) fullPayload.pincode = updates.pincode?.trim() || null;
  if (updates.country !== undefined) fullPayload.country = updates.country?.trim() || 'India';
  if (updates.alternate_phone !== undefined) fullPayload.alternate_phone = updates.alternate_phone?.trim() || null;
  if (updates.alternate_email !== undefined) fullPayload.alternate_email = updates.alternate_email?.trim() || null;

  const basePayload: any = {
    updated_at: fullPayload.updated_at,
    ...(fullPayload.first_name !== undefined && { first_name: fullPayload.first_name }),
    ...(fullPayload.last_name !== undefined && { last_name: fullPayload.last_name }),
    ...(fullPayload.email !== undefined && { email: fullPayload.email }),
    ...(fullPayload.phone !== undefined && { phone: fullPayload.phone }),
    ...(fullPayload.date_of_birth !== undefined && { date_of_birth: fullPayload.date_of_birth }),
    ...(fullPayload.gender !== undefined && { gender: fullPayload.gender }),
    ...(fullPayload.national_id !== undefined && { national_id: fullPayload.national_id }),
  };

  setStudentExtendedFields(id, updates);

  if (_supportsExtendedStudentColumns === false) {
    const { data: baseData, error: baseErr } = await supabase
      .from('students')
      .update(basePayload)
      .eq('id', id)
      .select()
      .single();

    if (!baseErr && baseData) {
      return enrichStudent({ ...baseData, ...updates });
    }
    return enrichStudent({ ...updates, id } as Student);
  }

  try {
    const { data, error } = await supabase
      .from('students')
      .update(fullPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isSchemaCacheOrColumnError(error)) {
        _supportsExtendedStudentColumns = false;
        const { data: fallbackData } = await supabase
          .from('students')
          .update(basePayload)
          .eq('id', id)
          .select()
          .single();
        return enrichStudent({ ...(fallbackData || {}), ...updates, id } as Student);
      }
      throw error;
    }
    return enrichStudent(data);
  } catch {
    return enrichStudent({ ...updates, id } as Student);
  }
}

export async function fetchRegistrations(
  filters?: { status?: WorkflowStatus },
  actor?: ActorContext
): Promise<Registration[]> {
  if (actor?.role === 'REGISTRAR') {
    if (!actor.institutionId) {
      return [];
    }
  }

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

  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    query = query.eq('institution_id', actor.institutionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  let results = (data || []).map((r) => enrichRegistration(r));

  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    results = results.filter((r) => r.institution_id === actor.institutionId);
  }

  return results;
}

export async function fetchRegistrationById(id: string, actor?: ActorContext): Promise<Registration | null> {
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

  if (error || !data) return null;

  if (actor?.role === 'REGISTRAR') {
    if (!actor.institutionId || data.institution_id !== actor.institutionId) {
      throw new Error('403 Forbidden: Access denied to other institutions\' registrations.');
    }
  }

  return enrichRegistration(data);
}

export async function generateRegistrationId(
  institutionCode: string,
  programCode: string,
  year: number
): Promise<{ registrationNumber: string; sequence: number }> {
  const inst = institutionCode.trim().toUpperCase();
  const prog = programCode.trim().toUpperCase();
  const prefix = `${inst}/${prog}/${year}/`;
  const { data } = await supabase
    .from('registrations')
    .select('registration_number')
    .ilike('registration_number', `${prefix}%`);

  const existingRegNumbers = (data || []).map((r) => r.registration_number).filter(Boolean);
  const { nextSeq, registrationNumber } = findNextRegistrationSequence(
    existingRegNumbers,
    inst,
    prog,
    year
  );

  return { registrationNumber, sequence: nextSeq };
}

export async function createRegistration(
  regData: Partial<Registration>,
  actor?: ActorContext
): Promise<Registration> {
  assertPermission('CREATE_REGISTRATION', actor, regData.institution_id);

  const now = new Date().toISOString();

  // 1. Authoritative Master Data Hierarchy Validation
  const { institution, department, program, year } = await validateMasterDataHierarchy({
    institutionId: regData.institution_id,
    departmentId: regData.department_id,
    programId: regData.program_id,
    academicYear: regData.academic_year,
  });

  // 2. Validate Student Profile: State is required for every new registration
  const stuRecord = regData.student_id ? await fetchStudentById(regData.student_id, actor) : null;
  const studentState = stuRecord?.state || (regData.student_id ? getStudentExtendedFields(regData.student_id)?.state : undefined);

  if (!studentState || !studentState.trim()) {
    throw new Error('State is required for every new registration. Please update the student profile with their state of residence before proceeding.');
  }

  // 3. Conditional Previous Registration Number Enforcement
  const regType = regData.registration_type || 'INITIAL_REGISTRATION';
  if (regType === 'TRANSFER' || regType === 'RE_REGISTRATION' || regType === 'PROGRAM_PROGRESSION') {
    if (!regData.previous_registration_number || !regData.previous_registration_number.trim()) {
      throw new Error(`Previous Registration Number is required for ${regType.replace('_', ' ')}.`);
    }
  }

  // 4. Concurrency-safe registration creation with retry on unique constraint conflict
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    let regNumber = regData.registration_number?.trim();

    if (!regNumber) {
      const generated = await generateRegistrationId(institution.code, program.code, year);
      regNumber = generated.registrationNumber;
    }

    const fullPayload: any = {
      registration_number: regNumber,
      student_id: regData.student_id,
      registration_type: regType,
      institution_id: institution.id,
      department_id: department.id,
      program_id: program.id,
      academic_year: regData.academic_year || `${year}-${year + 1}`,
      status: regData.status || 'DRAFT',
      notes: regData.notes || '',
      highest_qualification: regData.highest_qualification?.trim() || null,
      previous_institution: regData.previous_institution?.trim() || null,
      previous_program: regData.previous_program?.trim() || null,
      year_of_completion: regData.year_of_completion?.trim() || null,
      qualification_reg_no: regData.qualification_reg_no?.trim() || null,
      previous_registration_number: regData.previous_registration_number?.trim() || null,
      submitted_at: regData.status === 'SUBMITTED' ? now : null,
      created_at: now,
      updated_at: now,
    };

    const basePayload: any = {
      registration_number: regNumber,
      student_id: regData.student_id,
      registration_type: regType,
      institution_id: institution.id,
      department_id: department.id,
      program_id: program.id,
      academic_year: regData.academic_year || `${year}-${year + 1}`,
      status: regData.status || 'DRAFT',
      notes: regData.notes || '',
      submitted_at: regData.status === 'SUBMITTED' ? now : null,
      created_at: now,
      updated_at: now,
    };

    // If extended registration columns are not yet in remote schema cache, insert base directly
    if (_supportsExtendedRegistrationColumns === false) {
      const { data: baseData, error: baseErr } = await supabase
        .from('registrations')
        .insert([basePayload])
        .select(`
          *,
          student:students(*),
          institution:institutions(*),
          department:departments(*),
          program:programs(*)
        `)
        .single();

      if (!baseErr && baseData) {
        setRegistrationExtendedFields(baseData.id, fullPayload);
        setRegistrationExtendedFields(baseData.registration_number, fullPayload);
        return enrichRegistration({
          ...baseData,
          ...fullPayload,
        });
      }

      if (
        baseErr &&
        (baseErr.code === '23505' || baseErr.message?.includes('registration_number')) &&
        !regData.registration_number
      ) {
        continue;
      }

      throw new Error(baseErr?.message || 'Failed to create registration in database.');
    }

    // Try full insert first
    const { data, error } = await supabase
      .from('registrations')
      .insert([fullPayload])
      .select(`
        *,
        student:students(*),
        institution:institutions(*),
        department:departments(*),
        program:programs(*)
      `)
      .single();

    if (!error && data) {
      _supportsExtendedRegistrationColumns = true;
      setRegistrationExtendedFields(data.id, fullPayload);
      setRegistrationExtendedFields(data.registration_number, fullPayload);
      return enrichRegistration(data);
    }

    if (
      error &&
      (error.code === '23505' || error.message?.includes('registration_number')) &&
      !regData.registration_number
    ) {
      continue;
    }

    // Handle schema cache / unmigrated column error gracefully
    if (error && isSchemaCacheOrColumnError(error)) {
      _supportsExtendedRegistrationColumns = false;
      const { data: baseData, error: baseErr } = await supabase
        .from('registrations')
        .insert([basePayload])
        .select(`
          *,
          student:students(*),
          institution:institutions(*),
          department:departments(*),
          program:programs(*)
        `)
        .single();

      if (!baseErr && baseData) {
        setRegistrationExtendedFields(baseData.id, fullPayload);
        setRegistrationExtendedFields(baseData.registration_number, fullPayload);
        return enrichRegistration({
          ...baseData,
          ...fullPayload,
        });
      }

      if (
        baseErr &&
        (baseErr.code === '23505' || baseErr.message?.includes('registration_number')) &&
        !regData.registration_number
      ) {
        continue;
      }

      throw new Error(baseErr?.message || 'Failed to create registration in database.');
    }

    throw error;
  }

  throw new Error('Failed to create registration after sequence collision retries');
}

export async function updateRegistrationStatus(
  id: string,
  status: WorkflowStatus,
  reasonOrNotes?: string,
  actor?: ActorContext
): Promise<Registration> {
  const existing = await fetchRegistrationById(id, actor);
  if (!existing) throw new Error('Registration not found');
  assertPermission('UPDATE_STATUS', actor, existing.institution_id, { status });

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
  return enrichRegistration(data);
}

export async function updateRegistrationDraft(
  id: string,
  regData: Partial<Registration>,
  actor?: ActorContext
): Promise<Registration> {
  const existing = await fetchRegistrationById(id, actor);
  if (!existing) throw new Error('Registration not found');
  assertPermission('EDIT_REGISTRATION', actor, existing.institution_id);

  const now = new Date().toISOString();
  const updatePayload = {
    ...regData,
    updated_at: now,
  };

  setRegistrationExtendedFields(id, regData);

  const basePayload: any = {
    updated_at: now,
    ...(regData.status !== undefined && { status: regData.status }),
    ...(regData.academic_year !== undefined && { academic_year: regData.academic_year }),
    ...(regData.institution_id !== undefined && { institution_id: regData.institution_id }),
    ...(regData.department_id !== undefined && { department_id: regData.department_id }),
    ...(regData.program_id !== undefined && { program_id: regData.program_id }),
    ...(regData.notes !== undefined && { notes: regData.notes }),
  };

  if (_supportsExtendedRegistrationColumns === false) {
    const { data: baseData, error: baseErr } = await supabase
      .from('registrations')
      .update(basePayload)
      .eq('id', id)
      .select(`
        *,
        student:students(*),
        institution:institutions(*),
        department:departments(*),
        program:programs(*)
      `)
      .single();

    if (!baseErr && baseData) {
      return enrichRegistration({ ...baseData, ...regData });
    }
    return enrichRegistration({ ...regData, id } as Registration);
  }

  try {
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

    if (error) {
      if (isSchemaCacheOrColumnError(error)) {
        _supportsExtendedRegistrationColumns = false;
        const { data: fallbackData } = await supabase
          .from('registrations')
          .update(basePayload)
          .eq('id', id)
          .select(`
            *,
            student:students(*),
            institution:institutions(*),
            department:departments(*),
            program:programs(*)
          `)
          .single();
        return enrichRegistration({ ...(fallbackData || {}), ...regData, id } as Registration);
      }
      throw error;
    }
    return enrichRegistration(data);
  } catch {
    return enrichRegistration({ ...regData, id } as Registration);
  }
}

export async function batchImportStudentRegistrations(
  rows: ExcelStudentImportRow[],
  actor?: ActorContext
): Promise<{ successCount: number; errors: string[]; createdRegistrations: Registration[] }> {
  assertPermission('IMPORT_BATCH', actor);

  let successCount = 0;
  const errors: string[] = [];
  const createdRegistrations: Registration[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.first_name || !row.first_name.trim()) {
        throw new Error('Student first name is required.');
      }
      const firstName = row.first_name.trim();
      const lastName = row.last_name?.trim() || '';
      const email = row.email?.trim() || (() => {
        const firstSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const lastSlug = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const instSlug = row.institution_name ? row.institution_name.split(' ').map((w) => w[0]?.toLowerCase()).join('') : 'ata';
        return `${firstSlug}${lastSlug ? '.' + lastSlug : ''}@${instSlug || 'ata'}.edu`;
      })();
      const year = row.academic_year ? extractYear(row.academic_year) : new Date().getFullYear();

      // 1. Resolve Student Identity:
      // If Permanent UID is provided, locate existing student using that UID first!
      let student: Student | null = null;
      if (row.permanent_uid && row.permanent_uid.trim()) {
        const { data: stuByUid } = await supabase
          .from('students')
          .select('*')
          .eq('permanent_uid', row.permanent_uid.trim())
          .maybeSingle();

        if (stuByUid) {
          student = stuByUid;
        }
      }

      // If not located by UID, check by email
      if (!student && email) {
        const { data: stuByEmail } = await supabase
          .from('students')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (stuByEmail) {
          student = stuByEmail;
        }
      }

      // If not located by UID or email, check by Aadhar Number / national_id
      const incomingAadhar = row.aadhar_number?.trim() || (row as any).national_id?.trim();
      if (!student && incomingAadhar) {
        student = await findStudentByAadhar(incomingAadhar);
      }

      // If still not found, create new Student with server-side authoritative Permanent UID
      if (!student) {
        student = await createStudent(
          {
            permanent_uid: row.permanent_uid?.trim() || undefined,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: row.phone || undefined,
            date_of_birth: row.date_of_birth || undefined,
            gender: row.gender || undefined,
            state: row.state?.trim() || '',
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            district: row.district?.trim() || undefined,
            pincode: row.pincode?.trim() || undefined,
            country: row.country?.trim() || undefined,
            aadhar_number: row.aadhar_number?.trim() || undefined,
            alternate_phone: row.alternate_phone?.trim() || undefined,
            alternate_email: row.alternate_email?.trim() || undefined,
          },
          year,
          actor
        );
      }

      // 2. Resolve authoritative Master Data (Institution, Department, Program)
      const inst = await resolveInstitution(row.institution_name);

      // If registrar, must match assigned institution
      if (actor?.role === 'REGISTRAR' && actor.institutionId && inst.id !== actor.institutionId) {
        throw new Error(`Cannot import student for "${inst.name}". Scoped to assigned institution only.`);
      }

      const dept = await resolveDepartment(inst.id, row.department_name);
      const prog = await resolveProgram(dept.id, row.program_name);

      // 3. Create Registration (preserving historical registration_number if present)
      const reg = await createRegistration(
        {
          registration_number: row.registration_number?.trim() || undefined,
          student_id: student.id,
          registration_type: row.registration_type || 'INITIAL_REGISTRATION',
          institution_id: inst.id,
          department_id: dept.id,
          program_id: prog.id,
          academic_year: row.academic_year || `${year}-${year + 1}`,
          status: 'SUBMITTED',
          notes: `Imported via Excel Batch Registration Processor on ${new Date().toLocaleDateString()}`,
          highest_qualification: row.highest_qualification?.trim() || undefined,
          previous_institution: row.previous_institution?.trim() || undefined,
          previous_program: row.previous_program?.trim() || undefined,
          year_of_completion: row.year_of_completion?.trim() || undefined,
          qualification_reg_no: row.qualification_reg_no?.trim() || undefined,
          previous_registration_number: row.previous_registration_number?.trim() || undefined,
        },
        actor
      );

      createdRegistrations.push(reg);
      successCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 1} (${row.first_name} ${row.last_name}): ${err.message}`);
    }
  }

  return { successCount, errors, createdRegistrations };
}

export async function fetchDashboardMetrics(actor?: ActorContext): Promise<DashboardMetrics> {
  // For REGISTRAR actors, count only students with registrations in their assigned institution
  let studentsRes: Awaited<ReturnType<typeof supabase.from<'students', any>>>;
  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    // Count students that have at least one registration in the assigned institution
    const { data: instRegs } = await supabase
      .from('registrations')
      .select('student_id')
      .eq('institution_id', actor.institutionId);
    const validStudentIds = Array.from(new Set((instRegs || []).map((r: any) => r.student_id)));
    studentsRes = await (supabase.from('students') as any)
      .select('*', { count: 'exact', head: true })
      .in('id', validStudentIds.length > 0 ? validStudentIds : ['__none__']);
  } else {
    studentsRes = await (supabase.from('students') as any).select('*', { count: 'exact', head: true });
  }
  const studentsResTyped = studentsRes as any;
  if (studentsResTyped.error) throw studentsResTyped.error;

  // For REGISTRAR, scope registrations to their assigned institution
  let regs: Registration[];
  if (actor?.role === 'REGISTRAR' && actor.institutionId) {
    regs = await fetchRegistrations(undefined, actor);
  } else {
    const regsRes = await supabase.from('registrations').select('*');
    if (regsRes.error) throw regsRes.error;
    regs = regsRes.data || [];
  }

  const insts = await fetchInstitutions();

  const totalStudents: number = studentsResTyped.count || 0;
  // totalStudents already set above
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


export async function deleteStudent(studentId: string, actor?: ActorContext): Promise<void> {
  assertPermission('DELETE_STUDENT', actor);
  // First delete associated registrations
  await supabase.from('registrations').delete().eq('student_id', studentId);
  // Then delete student record
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;
}

export async function deleteStudentsBulk(studentIds: string[], actor?: ActorContext): Promise<void> {
  if (studentIds.length === 0) return;
  assertPermission('DELETE_STUDENT', actor);
  // First delete associated registrations
  await supabase.from('registrations').delete().in('student_id', studentIds);
  // Then delete student records
  const { error } = await supabase.from('students').delete().in('id', studentIds);
  if (error) throw error;
}

export async function deleteRegistration(
  registrationId: string,
  studentId?: string,
  actor?: ActorContext
): Promise<void> {
  const existing = await fetchRegistrationById(registrationId, actor);
  if (existing) {
    assertPermission('DELETE_REGISTRATION', actor, existing.institution_id);
  } else if (actor) {
    assertPermission('DELETE_REGISTRATION', actor);
  }

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
  studentIds?: string[],
  actor?: ActorContext
): Promise<void> {
  if (registrationIds.length === 0) return;
  for (let i = 0; i < registrationIds.length; i++) {
    const id = registrationIds[i];
    const sId = studentIds && studentIds[i] ? studentIds[i] : undefined;
    await deleteRegistration(id, sId, actor);
  }
}

export async function fetchDocuments(actor?: ActorContext): Promise<any[]> {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      registration:registrations(*, student:students(*))
    `)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    // Query live real-time registrations database to build dynamic real documents
    // Actor context is passed so REGISTRAR results are institution-scoped
    const regs = await fetchRegistrations(undefined, actor);
    return regs.map((r) => ({
      id: `doc-${r.id}`,
      name: `${r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Candidate'} - Registration Verification Dossier`,
      category: r.registration_type.replace(/_/g, ' '),
      size: '1.4 MB',
      updated: r.updated_at ? r.updated_at.slice(0, 10) : '2026-09-04',
      status: r.status === 'APPROVED' ? 'Verified' : r.status === 'SUBMITTED' ? 'Under Review' : 'Draft',
      studentName: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Unknown',
      regNumber: r.registration_number,
    }));
  }
  return data || [];
}

export async function uploadDocumentAttachment(
  file: File,
  registrationId: string,
  actor?: ActorContext
): Promise<any> {
  const existing = await fetchRegistrationById(registrationId, actor);
  if (!existing) {
    throw new Error('404 Registration not found.');
  }
  assertPermission('UPLOAD_DOCUMENT', actor, existing.institution_id);

  if (!supabaseAdmin) {
    console.error('Document upload requires SUPABASE_SERVICE_ROLE_KEY for the private storage bucket.');
    throw new Error('503 Document storage is not configured. Please contact an administrator.');
  }
  if (file.size <= 0 || file.size > 52_428_800) {
    throw new Error('400 The selected file must be between 1 byte and 50 MB.');
  }

  const allowedContentTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
  ]);
  if (!allowedContentTypes.has(file.type)) {
    throw new Error('400 Unsupported file type. Upload a PDF, JPEG, PNG, or TIFF file.');
  }

  const extensionByType: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/tiff': 'tiff',
  };
  const filePath = `${registrationId}/${crypto.randomUUID()}.${extensionByType[file.type]}`;

  const bucketResult = await ensureStorageBucket();
  if (!bucketResult.ok) {
    console.error('Document bucket setup failed:', bucketResult.message);
    throw new Error('503 Document storage is unavailable. Please try again later.');
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error('Document storage upload failed:', uploadError.message);
    throw new Error('503 Unable to store the uploaded document. Please try again.');
  }

  const payload = {
    registration_id: registrationId,
    file_path: filePath,
    file_name: file.name,
    file_size: `${Math.round(file.size / 1024)} KB`,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert([payload])
    .select()
    .single();

  if (error || !data) {
    console.error('Document metadata insert failed:', error?.message);
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    throw new Error('500 Unable to save the uploaded document. Please try again.');
  }

  return data;
}

interface ResolvedDocumentAttachment {
  id: string;
  filePath: string;
  fileName: string;
  registrationId: string;
  institutionId: string;
}

async function resolveDocumentAttachment(
  documentId: string,
  action: 'PREVIEW_DOCUMENT' | 'DOWNLOAD_DOCUMENT' | 'DELETE_DOCUMENT',
  actor?: ActorContext
): Promise<ResolvedDocumentAttachment> {
  if (!supabaseAdmin) {
    console.error('Document retrieval requires SUPABASE_SERVICE_ROLE_KEY for the private storage bucket.');
    throw new Error('503 Document storage is unavailable. Please try again later.');
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, file_path, file_name, registration:registrations!inner(id, institution_id)')
    .eq('id', documentId)
    .maybeSingle();

  if (error) {
    console.error('Document lookup failed:', error.message);
    throw new Error('500 Unable to retrieve this document. Please try again.');
  }
  if (!data?.file_path || !data.file_name || !data.registration) {
    throw new Error('404 Document not found.');
  }

  const registration = Array.isArray(data.registration) ? data.registration[0] : data.registration;
  if (!registration?.id || !registration.institution_id) {
    throw new Error('404 Document not found.');
  }
  assertPermission(action, actor, registration.institution_id);

  return {
    id: data.id,
    filePath: data.file_path,
    fileName: data.file_name,
    registrationId: registration.id,
    institutionId: registration.institution_id,
  };
}

function contentTypeForFile(fileName: string, storedContentType?: string): string {
  if (storedContentType) return storedContentType;
  const extension = fileName.toLowerCase().split('.').pop();
  return {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    tif: 'image/tiff',
    tiff: 'image/tiff',
  }[extension || ''] || 'application/octet-stream';
}

export async function getDocumentFileBuffer(
  documentId: string,
  action: 'PREVIEW_DOCUMENT' | 'DOWNLOAD_DOCUMENT',
  actor?: ActorContext
): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
}> {
  const document = await resolveDocumentAttachment(documentId, action, actor);
  const { data, error } = await supabaseAdmin!.storage
    .from(STORAGE_BUCKET)
    .download(document.filePath);

  if (error || !data) {
    console.error('Document storage retrieval failed:', error?.message);
    throw new Error('404 Unable to preview document. The uploaded file could not be found in storage.');
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: contentTypeForFile(document.fileName, data.type),
    fileName: document.fileName,
  };
}

export async function deleteDocumentAttachment(
  documentId: string,
  actor?: ActorContext
): Promise<{ success: boolean; message: string }> {
  const document = await resolveDocumentAttachment(documentId, 'DELETE_DOCUMENT', actor);

  const { error: storageError } = await supabaseAdmin!.storage
    .from(STORAGE_BUCKET)
    .remove([document.filePath]);
  if (storageError) {
    console.error('Document storage deletion failed:', storageError.message);
    throw new Error('500 Unable to delete this document. Please try again.');
  }

  const { error: databaseError } = await supabaseAdmin!
    .from('documents')
    .delete()
    .eq('id', document.id);
  if (databaseError) {
    console.error('Document metadata deletion failed:', databaseError.message);
    throw new Error('500 Unable to delete this document. Please try again.');
  }

  try {
    await logAuditAction(
      'DOCUMENT_DELETED',
      actor?.email || 'Registrar',
      actor?.role || 'REGISTRAR',
      'DOCUMENT',
      document.id,
      `Document deleted from registration record #${document.registrationId}`
    );
  } catch (err: any) {
    console.warn('Document deletion audit write failed:', err.message);
  }

  return { success: true, message: 'Document deleted successfully' };
}

export async function updateRegistrationAndStudent(
  registrationId: string,
  studentId: string,
  payload: {
    student?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
    registration?: {
      academic_year?: string;
      registration_type?: RegistrationType;
      status?: WorkflowStatus;
      institution_id?: string;
      department_id?: string;
      program_id?: string;
      notes?: string;
    };
  },
  actor?: ActorContext
): Promise<Registration> {
  const existing = await fetchRegistrationById(registrationId, actor);
  if (!existing) throw new Error('Registration not found');

  if (payload.student && Object.keys(payload.student).length > 0) {
    assertPermission('EDIT_STUDENT', actor);
  }
  if (payload.registration && Object.keys(payload.registration).length > 0) {
    assertPermission('EDIT_REGISTRATION', actor, existing.institution_id);
    if (
      actor?.role === 'REGISTRAR' &&
      payload.registration.institution_id &&
      payload.registration.institution_id !== actor.institutionId
    ) {
      throw new Error('403 Forbidden: Cannot reassign registration to another institution.');
    }
  }

  if (payload.student && Object.keys(payload.student).length > 0) {
    const { error: stuError } = await supabase
      .from('students')
      .update({ ...payload.student, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    if (stuError) throw stuError;
  }

  const { data: updatedReg, error: regError } = await supabase
    .from('registrations')
    .update({ ...(payload.registration || {}), updated_at: new Date().toISOString() })
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

export const INITIAL_GOVERNANCE_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    event_number: '#LOG-2026-98124',
    action: 'CONTROLLED_UNLOCK',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Chief Academic Administrator',
    ip_address: '103.24.81.12',
    entity_type: 'REGISTRATION',
    entity_id: 'SAIACS/BA-CML/2026/1',
    target_name: 'Ananya Sengupta',
    target_ref: 'Reg #SAIACS/BA-CML/2026/1',
    target_program: 'Master of Theology (M.Th)',
    mutation_from: 'LOCKED_FINAL',
    mutation_to: 'CONTROLLED_EDIT',
    audit_reason: "State Mutation: LOCKED_FINAL → CONTROLLED_EDIT",
    details: '"Candidate submitted revised Master\'s thesis dissertation title per academic board directive. Super-Admin Multi-Key authorization #ATH-99-B verified."',
    block_hash: '7b018f2a41d9c091',
    merkle_root: '#711',
    relative_time: 'Just now • 10:14 AM',
    created_at: '2026-02-28T10:14:00Z',
  },
  {
    id: 'log-002',
    event_number: '#LOG-2026-98108',
    action: 'DOSSIER_APPROVED',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Chief Academic Administrator',
    ip_address: '103.24.81.12',
    entity_type: 'REGISTRATION',
    entity_id: 'UBS/BA-CML/2026/1',
    target_name: 'Hannah R. Lin',
    target_ref: 'Reg #UBS/BA-CML/2026/1',
    target_program: 'Doctor of Ministry (D.Min)',
    mutation_from: 'PENDING_AUDIT',
    mutation_to: 'APPROVED_SEALED',
    cert_number: 'Cert #ATA-CRT-9921',
    audit_reason: 'State Mutation: PENDING_AUDIT → APPROVED_SEALED',
    details: 'Final credential audit successful. All 120 credit units verified with Union Theological College. Accreditation Certificate issued: #ATA-CRT-9921.',
    block_hash: '9a48be1284cc82df',
    merkle_root: '#711',
    relative_time: 'Today • 09:48 AM',
    created_at: '2026-02-28T09:48:00Z',
  },
  {
    id: 'log-003',
    event_number: '#LOG-2026-98042',
    action: 'CORRECTION_FLAGGED',
    actor_name: 'Prof. A. Kuruvilla',
    actor_role: 'Admissions Reviewer',
    ip_address: '49.207.185.4',
    entity_type: 'REGISTRATION',
    entity_id: 'COTR-TS/BA-CML/2026/1',
    target_name: 'Priya Sharma',
    target_ref: 'Reg #COTR-TS/BA-CML/2026/1',
    target_program: 'Bachelor of Theology (B.Th)',
    mutation_from: 'UNDER_REVIEW',
    mutation_to: 'CORRECTION_REQUIRED',
    reason_code: 'INCOMPLETE_TRANSCRIPTS',
    audit_reason: 'Flagged for Incomplete Transcripts',
    details: 'Year 2 official mark sheet copy missing university registrar seal. Application reverted to Registrar Draft Queue with notice dispatched to candidate email.',
    block_hash: 'f10c345178bb67ea',
    merkle_root: '#711',
    relative_time: 'Today • 08:30 AM',
    created_at: '2026-02-28T08:30:00Z',
  },
  {
    id: 'log-004',
    event_number: '#LOG-2026-97918',
    action: 'EXCEL_BATCH_IMPORT',
    actor_name: 'Rev. M. Thomas',
    actor_role: 'Registrar Operations',
    ip_address: '14.139.182.2',
    entity_type: 'DOCUMENT',
    entity_id: 'IMP-SAIACS-2026-02',
    target_name: 'SAIACS Bengaluru',
    target_ref: 'Batch #IMP-SAIACS-2026-02',
    target_program: '28 Candidates Ingested',
    audit_reason: 'Bulk Schema Validation: 28 Passed / 0 Errors',
    details: 'Automated pre-flight schema checks passed. Candidate UIDs generated in sequential block STU-2026-00020 to STU-2026-00048. Pre-allocated to M.Div Cohort.',
    manifest_name: 'manifest-saiacs-28.json.sig',
    block_hash: '368149efa01212b4',
    merkle_root: '#711',
    relative_time: 'Yesterday • 04:15 PM',
    created_at: '2026-02-27T16:15:00Z',
  },
  {
    id: 'log-005',
    event_number: '#LOG-2026-97884',
    action: 'DOCUMENT_CAPTURED',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Chief Academic Administrator',
    ip_address: '103.24.81.12',
    entity_type: 'STUDENT',
    entity_id: 'ACPL/BA-CML/2026/1',
    target_name: 'Joshua R. Sailo',
    target_ref: 'Reg #ACPL/BA-CML/2026/1',
    target_program: 'M.A. in Intercultural Studies',
    audit_reason: 'Live Biometric Identification Seal Added',
    details: 'National Passport bio-page confirmed via live capture interface during high-table identity reconciliation. Watermark ATA-VAULT-2026 successfully inscribed.',
    block_hash: '5d129a01bb41fe77',
    merkle_root: '#711',
    relative_time: 'Yesterday • 02:22 PM',
    created_at: '2026-02-27T14:22:00Z',
  },
];

let inMemoryAuditLogs: AuditLog[] = [...INITIAL_GOVERNANCE_AUDIT_LOGS];

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge remote DB audit logs with initial governance events
      const existingIds = new Set(data.map((d: any) => d.id || d.event_number));
      const filteredInitials = inMemoryAuditLogs.filter((l) => !existingIds.has(l.id) && !existingIds.has(l.event_number));
      return [...data, ...filteredInitials];
    }
  } catch {
    // Ignore schema cache or offline errors and return in-memory ledger
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('ATA_GOVERNANCE_AUDIT_LOGS');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return [...inMemoryAuditLogs];
}

export async function logAuditAction(
  action: AuditLog['action'],
  actorName: string,
  actorRole: UserRole | string,
  entityType: AuditLog['entity_type'],
  entityId: string,
  details: string
): Promise<void> {
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    event_number: `#LOG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    action,
    actor_name: actorName,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: '103.24.81.12',
    created_at: new Date().toISOString(),
    relative_time: 'Just now',
    block_hash: Math.random().toString(16).slice(2, 18),
    merkle_root: '#f7f9a',
  };

  inMemoryAuditLogs.unshift(newLog);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ATA_GOVERNANCE_AUDIT_LOGS', JSON.stringify(inMemoryAuditLogs));
    } catch {
      // ignore
    }
  }

  try {
    await supabase.from('audit_logs').insert([newLog]);
  } catch {
    // Ignore if table not present
  }
}

export async function createAuditLog(log: Partial<AuditLog>): Promise<void> {
  const newLog: AuditLog = {
    id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event_number: log.event_number || `#LOG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    action: log.action || 'STATUS_CHANGED',
    actor_name: log.actor_name || 'Dr. Grace Chen',
    actor_role: log.actor_role || 'Chief Academic Administrator / Council Director',
    entity_type: log.entity_type || 'REGISTRATION',
    entity_id: log.entity_id || '',
    target_name: log.target_name,
    target_ref: log.target_ref,
    target_program: log.target_program,
    mutation_from: log.mutation_from,
    mutation_to: log.mutation_to,
    details: log.details || '',
    ip_address: log.ip_address || '103.24.81.12',
    created_at: log.created_at || new Date().toISOString(),
    relative_time: log.relative_time || 'Just now',
    block_hash: log.block_hash || Math.random().toString(16).slice(2, 18),
    merkle_root: log.merkle_root || '#f7f9a',
  };

  inMemoryAuditLogs.unshift(newLog);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ATA_GOVERNANCE_AUDIT_LOGS', JSON.stringify(inMemoryAuditLogs));
    } catch {
      // ignore
    }
  }

  try {
    await supabase.from('audit_logs').insert([newLog]);
  } catch {
    // Ignore if table not present
  }
}

export async function exportRegistrationsToExcel(registrations: Registration[]): Promise<void> {
  const exportData = registrations.map((r, idx) => ({
    'S.No': idx + 1,
    'Registration Number': r.registration_number,
    'Permanent UID': r.student?.permanent_uid || 'N/A',
    'Student Name': r.student ? `${r.student.first_name} ${r.student.last_name}` : 'N/A',
    Email: r.student?.email || 'N/A',
    Phone: r.student?.phone || 'N/A',
    Institution: r.institution?.name || 'N/A',
    Department: r.department?.name || 'N/A',
    Program: r.program?.name || 'N/A',
    'Academic Year': r.academic_year,
    'Registration Type': r.registration_type,
    Status: r.status,
    'Submitted At': r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'N/A',
  }));

  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'System Registrations Report');
  XLSX.writeFile(wb, `ATA_System_Registrations_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
