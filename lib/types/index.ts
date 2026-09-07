export type UserRole = 'UNIVERSAL' | 'ADMINISTRATOR' | 'REGISTRAR';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'ARCHIVED';

export type RegistrationType =
  | 'INITIAL_REGISTRATION'
  | 'RE_REGISTRATION'
  | 'TRANSFER'
  | 'PROGRAM_PROGRESSION';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id?: string;
  institution_name?: string;
  institution_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActorContext {
  role: UserRole;
  institutionId?: string;
  userId?: string;
  email?: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Department {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  degree_level?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  permanent_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  national_id?: string;
  aadhar_number?: string; // Application-level alias for national_id
  state?: string; // Required for all new registrations, nullable for legacy records
  address?: string;
  city?: string;
  district?: string;
  pincode?: string;
  country?: string;
  alternate_phone?: string;
  alternate_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  registration_number: string;
  student_id: string;
  registration_type: RegistrationType;
  institution_id: string;
  department_id: string;
  program_id: string;
  academic_year: string;
  status: WorkflowStatus;
  notes?: string; // Institution Remarks
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;

  // First-class Academic Background & Qualification Fields
  highest_qualification?: string;
  previous_institution?: string;
  previous_program?: string;
  year_of_completion?: string;
  qualification_reg_no?: string;

  // First-class Conditional Previous Registration History
  previous_registration_number?: string;

  // Joined relation fields for ease of UI display
  student?: Student;
  institution?: Institution;
  department?: Department;
  program?: Program;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalRegistrations: number;
  approvedRegistrations: number;
  archivedRegistrations: number;
  attentionRequiredCount: number;
  registrarTasksCount: number;
  
  workflowDistribution: Array<{
    status: WorkflowStatus;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  
  registrationTypesDistribution: Array<{
    type: RegistrationType;
    label: string;
    count: number;
    percentage: number;
  }>;
  
  academicYearDistribution: Array<{
    year: string;
    count: number;
    percentage: number;
  }>;
  
  institutionDistribution: Array<{
    institutionId: string;
    name: string;
    code: string;
    count: number;
    percentage: number;
  }>;
}

export interface AuditLog {
  id: string;
  action:
    | 'REGISTRATION_CREATED'
    | 'STATUS_CHANGE'
    | 'APPROVAL'
    | 'CONTROLLED_UNLOCK'
    | 'EXCEL_BATCH_IMPORT'
    | 'DOCUMENT_CAPTURED'
    | 'DOSSIER_APPROVED'
    | 'CORRECTION_FLAGGED'
    | string;
  actor_name: string;
  actor_role: UserRole | string;
  entity_type: 'REGISTRATION' | 'STUDENT' | 'DOCUMENT' | string;
  entity_id: string;
  details: string;
  ip_address?: string;
  created_at: string;

  // Governance & Cryptographic Ledger Extensions
  event_number?: string;
  relative_time?: string;
  mutation_from?: string;
  mutation_to?: string;
  target_name?: string;
  target_ref?: string;
  target_program?: string;
  audit_reason?: string;
  reason_code?: string;
  cert_number?: string;
  manifest_name?: string;
  block_hash?: string;
  block_number?: number;
  merkle_root?: string;
  is_verified?: boolean;
}

export interface DashboardChecklistItem {
  id: string;
  notice_id?: string;
  title: string;
  description: string;
  is_completed: boolean;
  sort_order?: number;
}

export interface DashboardNotice {
  id: string;
  title: string;
  message: string;
  recipient_role: UserRole;
  is_active: boolean;
  checklist_title?: string;
  items: DashboardChecklistItem[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  key: string;
  title: string;
  message: string;
  recipient_role: UserRole;
  target_url: string;
  action_type: 'REGISTRATIONS_REVIEW' | 'REGISTRATIONS_CORRECTION' | 'ASSIGNED_NOTICE' | 'AUDIT_LOG_SYNC';
  is_read: boolean;
  is_completed: boolean;
  created_at: string;
  notice_id?: string;
  metadata?: Record<string, any>;
}



