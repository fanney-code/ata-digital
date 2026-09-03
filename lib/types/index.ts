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
  created_at?: string;
  updated_at?: string;
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
  notes?: string;
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
  
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
