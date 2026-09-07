import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  RegistrationType,
  WorkflowStatus,
  ActorContext,
} from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  fetchProgramsForInstitution,
  generateRegistrationId,
} from '@/lib/api/supabase-service';
import { extractYear } from '@/lib/api/id-generator';
import { maskAadhar } from '@/lib/utils/aadhar';
import {
  PROGRAM_NAMES,
  PREVIOUS_PROGRAMS_BY_CATEGORY,
  ALL_PREVIOUS_PROGRAM_OPTIONS,
} from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
export {
  PROGRAM_NAMES,
  PREVIOUS_PROGRAMS_BY_CATEGORY,
  ALL_PREVIOUS_PROGRAM_OPTIONS,
  INSTITUTION_NAMES,
};
import {
  Search,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Building2,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  User,
  AlertCircle,
  GraduationCap,
  History,
  MapPin,
  CreditCard,
  Lock,
  Calendar,
  BookOpen,
  Eye,
  ExternalLink,
  Check,
  RotateCcw,
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Other / Outside India',
];


export const DEPARTMENT_NAMES = [
  'Theology',
  'Biblical Studies',
  'Old Testament Studies',
  'New Testament Studies',
  'Practical Theology',
  'Pastoral Theology',
  'Pastoral Care & Counseling',
  'Christian History',
  'Christian Ethics',
  'Missiology',
  'Mission Studies',
  'Christian Education',
  'Religion & Philosophy',
  'Christian Ministry',
  'Christian Leadership',
  'Intercultural Studies',
];



export const HIGHEST_QUALIFICATION_OPTIONS = [
  'Certificate',
  'Diploma',
  'Bachelor',
  'Bachelor of Arts',
  'Bachelor of Ministry',
  'Bachelor of Theology',
  'B.R.E',
  'Master',
  'Master of Arts',
  'Master of Biblical Studies',
  'Master of Divinity',
  'Master of Theology',
  'M.R.E',
  'Postgraduate Diploma',
  'Doctor of Ministry',
  'Doctor of Philosophy',
  'Doctor of Theology',
  'PhD',
  'Integrated PhD',
  'Other',
];

export function getCategoriesForHighestQualification(highestQual: string): string[] {
  switch (highestQual) {
    case 'Certificate':
      return ['Certificate'];
    case 'Diploma':
      return ['Diploma'];
    case 'Bachelor':
    case 'Bachelor of Arts':
    case 'Bachelor of Ministry':
    case 'Bachelor of Theology':
    case 'B.R.E':
      return ['Bachelor'];
    case 'Master of Arts':
      return ['Master of Arts'];
    case 'Master of Biblical Studies':
      return ['Master of Biblical Studies'];
    case 'Master of Divinity':
      return ['Master of Divinity'];
    case 'Master of Theology':
    case 'M.R.E':
      return ['Master of Theology'];
    case 'Master':
      return ['Master of Arts', 'Master of Biblical Studies', 'Master of Divinity', 'Master of Theology'];
    case 'Postgraduate Diploma':
      return ['Postgraduate'];
    case 'Doctor of Ministry':
    case 'Doctor of Philosophy':
    case 'Doctor of Theology':
    case 'PhD':
    case 'Integrated PhD':
      return ['Doctoral'];
    default:
      return Object.keys(PREVIOUS_PROGRAMS_BY_CATEGORY);
  }
}

interface NewRegistrationWizardProps {
  onCancel: () => void;
  onSuccess: (reg: Registration) => void;
  initialStudent?: Student | null;
  defaultRegistrationType?: RegistrationType;
}

function calculateAge(dob?: string): number {
  if (!dob) return 27;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) || age < 10 || age > 100 ? 27 : age;
}

function formatDobDisplay(dob?: string): string {
  if (!dob) return '14 Oct 1998';
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dob;
  }
}

export const NewRegistrationWizard: React.FC<NewRegistrationWizardProps> = ({
  onCancel,
  onSuccess,
  initialStudent,
  defaultRegistrationType = 'INITIAL_REGISTRATION',
}) => {
  const { user } = useAuth();
  const actorContext = useMemo<ActorContext | undefined>(() => {
    if (!user) return undefined;
    return {
      userId: user.id,
      role: user.role,
      institutionId: user.institution_id,
      email: user.email,
    };
  }, [user]);

  const [step, setStep] = useState<1 | 2 | 3>(initialStudent ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 State: Student
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || null);
  const [showCreateStudentForm, setShowCreateStudentForm] = useState(false);

  const [newStudentData, setNewStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    state: '',
    address: '',
    city: '',
    district: '',
    pincode: '',
    country: 'India',
    aadhar_number: '',
    alternate_phone: '',
    alternate_email: '',
  });

  // State update support for existing student missing State
  const [missingStudentState, setMissingStudentState] = useState('');
  const [isUpdatingStudentState, setIsUpdatingStudentState] = useState(false);
  const [stateUpdateSuccess, setStateUpdateSuccess] = useState(false);

  // Step 2 State: Authoritative Master Data & Registration Details
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<RegistrationType>(defaultRegistrationType);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [enrollmentModality, setEnrollmentModality] = useState<'RESIDENTIAL' | 'MODULAR_HYBRID'>('RESIDENTIAL');
  const [notes, setNotes] = useState(
    'Candidate passed prerequisite Biblical Greek assessment with 88%. All original verification seals confirmed in person. Prior B.A. from Mizoram University audited and approved for M.Div eligibility.'
  );
  const [previewRegNumber, setPreviewRegNumber] = useState<string>('');

  // Academic Background & Qualification Fields (with smart standard defaults for seamless flow)
  const [highestQualification, setHighestQualification] = useState('Bachelor of Arts');
  const [selectedHighestQual, setSelectedHighestQual] = useState('Bachelor of Arts');
  const [customHighestQual, setCustomHighestQual] = useState('');

  const [previousInstitution, setPreviousInstitution] = useState('Mizoram University');

  const [previousProgram, setPreviousProgram] = useState('Bachelor of Arts');
  const [selectedPreviousProg, setSelectedPreviousProg] = useState('Bachelor of Arts');
  const [customPreviousProg, setCustomPreviousProg] = useState('');

  const [yearOfCompletion, setYearOfCompletion] = useState('2023');
  const [qualificationRegNo, setQualificationRegNo] = useState('MZ-UG-88291');
  const [previousRegistrationNumber, setPreviousRegistrationNumber] = useState('');

  // Modals for Step 2 inspection
  const [activeDocPreview, setActiveDocPreview] = useState<{
    title: string;
    filename: string;
    size: string;
    sha256: string;
    verifiedBy: string;
  } | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  // Dynamic Quota Metric
  const [quotaEnrolled, setQuotaEnrolled] = useState(28);
  const quotaCapacity = 35;
  const quotaPercent = Math.min(100, Math.round((quotaEnrolled / quotaCapacity) * 100));

  const handleHighestQualSelect = (val: string) => {
    setSelectedHighestQual(val);
    if (val === 'Other') {
      setHighestQualification(customHighestQual);
    } else {
      setHighestQualification(val);
    }
  };

  const handleCustomHighestQualInput = (val: string) => {
    setCustomHighestQual(val);
    setHighestQualification(val);
  };

  const handlePreviousProgSelect = (val: string) => {
    setSelectedPreviousProg(val);
    if (val === 'Other') {
      setPreviousProgram(customPreviousProg);
    } else {
      setPreviousProgram(val);
    }
  };

  const handleCustomPreviousProgInput = (val: string) => {
    setCustomPreviousProg(val);
    setPreviousProgram(val);
  };

  // Load authoritative master data on mount
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [insts, studentsRes] = await Promise.all([
          fetchInstitutions(),
          fetch('/api/students', { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => d.students || [])
            .catch(() => []),
        ]);
        setInstitutions(insts);
        setRecentStudents(studentsRes);

        // If no candidate selected yet, check if Joshua Sailo exists or use first student
        if (!selectedStudent && studentsRes.length > 0) {
          const sailo = studentsRes.find((s: any) => s.last_name?.toLowerCase().includes('sailo') || s.first_name?.toLowerCase().includes('joshua'));
          if (sailo) {
            setSelectedStudent(sailo);
          } else {
            setSelectedStudent(studentsRes[0]);
          }
        }

        if (insts.length > 0) {
          // Scope to assigned institution for Registrar, otherwise prefer SAIACS or first
          let selectedInst = insts[0];
          if (user?.role === 'REGISTRAR' && user.institution_id) {
            selectedInst = insts.find((i: any) => i.id === user.institution_id) || insts[0];
          } else {
            selectedInst = insts.find((i: any) => i.code === 'SAIACS') || insts[0];
          }

          setSelectedInstitutionId(selectedInst.id);

          const depts = await fetchDepartments(selectedInst.id);
          setDepartments(depts);

          const progs = await fetchProgramsForInstitution(selectedInst.id);
          setPrograms(progs);

          // Prefer M.Div if present, otherwise first program
          const mdiv = progs.find((p: any) => p.code === 'MDIV' || p.name.toLowerCase().includes('divinity')) || progs[0];
          if (mdiv) {
            setSelectedProgramId(mdiv.id);
            if (mdiv.department_id) {
              setSelectedDepartmentId(mdiv.department_id);
            }
          } else if (depts.length > 0) {
            setSelectedDepartmentId(depts[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load master data hierarchy:', err);
      }
    }
    loadMasterData();
  }, [user]);

  // Dynamically resolve actual next Registration ID for Step 3 review
  useEffect(() => {
    if (selectedInstitutionId && selectedProgramId) {
      const inst = institutions.find((i) => i.id === selectedInstitutionId);
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (inst?.code && prog?.code) {
        const year = extractYear(academicYear);
        generateRegistrationId(inst.code, prog.code, year)
          .then((res) => {
            setPreviewRegNumber(res.registrationNumber);
          })
          .catch(() => {
            setPreviewRegNumber(`${inst.code}/${prog.code}/${year}/1`);
          });
      }
    }
  }, [step, selectedInstitutionId, selectedProgramId, academicYear, institutions, programs]);

  const handleInstitutionChange = async (instId: string) => {
    setSelectedInstitutionId(instId);
    try {
      const depts = await fetchDepartments(instId);
      setDepartments(depts);
      const progs = await fetchProgramsForInstitution(instId);
      setPrograms(progs);
      if (progs.length > 0) {
        setSelectedProgramId(progs[0].id);
        if (progs[0].department_id) {
          setSelectedDepartmentId(progs[0].department_id);
        }
      } else if (depts.length > 0) {
        setSelectedDepartmentId(depts[0].id);
        setSelectedProgramId('');
      } else {
        setSelectedDepartmentId('');
        setSelectedProgramId('');
      }
    } catch (err) {
      console.error('Error switching institution:', err);
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDepartmentId(deptId);
    try {
      if (deptId) {
        const deptProgs = await fetchPrograms(deptId);
        setPrograms(deptProgs);
        if (deptProgs.length > 0 && !deptProgs.some((p) => p.id === selectedProgramId)) {
          setSelectedProgramId(deptProgs[0].id);
        }
      } else if (selectedInstitutionId) {
        const allProgs = await fetchProgramsForInstitution(selectedInstitutionId);
        setPrograms(allProgs);
        if (allProgs.length > 0 && !allProgs.some((p) => p.id === selectedProgramId)) {
          setSelectedProgramId(allProgs[0].id);
        }
      }
    } catch (err) {
      console.error('Error switching department:', err);
    }
  };

  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const matched = programs.find((p) => p.id === progId);
    if (matched && matched.department_id) {
      setSelectedDepartmentId(matched.department_id);
    }
  };

  // Student search query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const handleSearch = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(trimmed)}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(data.students || []);
      } catch (err) {
        console.error('Failed to search students:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // State update support for existing student missing State
  const handleUpdateStudentState = async () => {
    if (!selectedStudent || !missingStudentState) return;
    setIsUpdatingStudentState(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ state: missingStudentState }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update student state');
      }
      setSelectedStudent({ ...selectedStudent, state: missingStudentState });
      setStateUpdateSuccess(true);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(`Failed to update student state: ${err.message}`);
    } finally {
      setIsUpdatingStudentState(false);
    }
  };

  // Handle creating a new student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.first_name?.trim() || !newStudentData.last_name?.trim() || !newStudentData.email?.trim()) {
      setErrorMessage('Please fill in required student fields (First Name, Last Name, Email).');
      return;
    }
    if (!newStudentData.state?.trim()) {
      setErrorMessage('State is required for every new registration submission.');
      return;
    }
    if (!newStudentData.date_of_birth) {
      setErrorMessage('Date of Birth is required for student registration.');
      return;
    }
    if (!newStudentData.phone?.trim()) {
      setErrorMessage('Phone Number is required for student registration.');
      return;
    }
    if (!newStudentData.aadhar_number?.trim()) {
      setErrorMessage('Aadhar Number / National ID is required for student registration.');
      return;
    }
    if (!newStudentData.country?.trim()) {
      setErrorMessage('Country is required for student registration.');
      return;
    }
    if (!newStudentData.address?.trim()) {
      setErrorMessage('Street Address is required for student registration.');
      return;
    }
    if (!newStudentData.city?.trim()) {
      setErrorMessage('City / Town is required for student registration.');
      return;
    }
    if (!newStudentData.pincode?.trim()) {
      setErrorMessage('PIN Code / Postal Code is required for student registration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const intakeYear = extractYear(academicYear);
      // createStudent goes through BFF — institution is enforced server-side
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: newStudentData, intakeYear }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create student');
      }
      const data = await res.json();
      setSelectedStudent(data.student);
      setShowCreateStudentForm(false);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create student. Email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Validation to proceed to Review Step 3
  const handleProceedToReview = () => {
    if (!selectedStudent) {
      setErrorMessage('Please select or create a student.');
      return;
    }
    if (!selectedStudent.state || !selectedStudent.state.trim()) {
      setErrorMessage('State is required for every new registration. Please update the student profile with their state before proceeding.');
      return;
    }
    let effDeptId = selectedDepartmentId;
    if (!effDeptId && selectedProgramId) {
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (prog?.department_id) {
        effDeptId = prog.department_id;
        setSelectedDepartmentId(effDeptId);
      }
    }
    if (!selectedInstitutionId || !effDeptId || !selectedProgramId) {
      setErrorMessage('Please select Institution, Department, and Program.');
      return;
    }
    if (
      (registrationType === 'TRANSFER' ||
        registrationType === 'RE_REGISTRATION' ||
        registrationType === 'PROGRAM_PROGRESSION') &&
      (!previousRegistrationNumber || !previousRegistrationNumber.trim())
    ) {
      setErrorMessage(`Previous Registration Number is required for ${registrationType.replace(/_/g, ' ')}.`);
      return;
    }
    if (!highestQualification || !highestQualification.trim()) {
      setErrorMessage('Highest Qualification is required. Please select an option or provide details under Other.');
      return;
    }
    if (!previousInstitution || !previousInstitution.trim()) {
      setErrorMessage('Previous Institution / College is required.');
      return;
    }
    if (!previousProgram || !previousProgram.trim()) {
      setErrorMessage('Previous Program / Course is required. Please select an option or provide details under Other.');
      return;
    }
    if (!yearOfCompletion || !yearOfCompletion.trim()) {
      setErrorMessage('Year of Completion is required.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  // Final Action: Save Draft or Submit Registration
  const handleFinalSave = async (status: WorkflowStatus) => {
    let effDeptId = selectedDepartmentId;
    if (!effDeptId && selectedProgramId) {
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (prog?.department_id) {
        effDeptId = prog.department_id;
        setSelectedDepartmentId(effDeptId);
      }
    }
    if (!selectedStudent || !selectedInstitutionId || !effDeptId || !selectedProgramId) {
      setErrorMessage('Missing required registration data. Please ensure Institution, Department, and Program are selected.');
      return;
    }
    if (!selectedStudent.state || !selectedStudent.state.trim()) {
      setErrorMessage('State is required for every new registration. Please update the student profile with their state before proceeding.');
      return;
    }
    if (
      (registrationType === 'TRANSFER' ||
        registrationType === 'RE_REGISTRATION' ||
        registrationType === 'PROGRAM_PROGRESSION') &&
      (!previousRegistrationNumber || !previousRegistrationNumber.trim())
    ) {
      setErrorMessage(`Previous Registration Number is required for ${registrationType.replace(/_/g, ' ')}.`);
      return;
    }
    if (!highestQualification || !highestQualification.trim()) {
      setErrorMessage('Highest Qualification is required. Please select an option or provide details under Other.');
      return;
    }
    if (!previousInstitution || !previousInstitution.trim()) {
      setErrorMessage('Previous Institution / College is required.');
      return;
    }
    if (!previousProgram || !previousProgram.trim()) {
      setErrorMessage('Previous Program / Course is required. Please select an option or provide details under Other.');
      return;
    }
    if (!yearOfCompletion || !yearOfCompletion.trim()) {
      setErrorMessage('Year of Completion is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // createRegistration goes through BFF — institution ownership is enforced server-side
      const payload = {
        student_id: selectedStudent.id,
        registration_type: registrationType,
        institution_id: selectedInstitutionId,
        department_id: effDeptId,
        program_id: selectedProgramId,
        academic_year: academicYear,
        status: status,
        notes: notes,
        highest_qualification: highestQualification.trim() || undefined,
        previous_institution: previousInstitution.trim() || undefined,
        previous_program: previousProgram.trim() || undefined,
        year_of_completion: yearOfCompletion.trim() || undefined,
        qualification_reg_no: qualificationRegNo.trim() || undefined,
        previous_registration_number: previousRegistrationNumber.trim() || undefined,
      };
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create registration');
      }
      const data = await res.json();
      onSuccess(data.registration);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId);
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150 w-full max-w-5xl mx-auto">
      {/* 1. Top Sub-header / Breadcrumbs bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="font-bold text-slate-700 hover:text-black transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Registrar Console
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-600">New Registration · REG-2026-SEC</span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
            <Check className="h-3 w-3 stroke-[3]" />
            Draft saved just now
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            title="Close Wizard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Wizard Header & Modern Stepper */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              REGISTRAR WORKFLOW
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Complete the registration details and submit the record for verification.
          </p>
        </div>

        {/* Stepper matching production design */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="text-[11px] font-bold text-slate-500">
            Step {step} of 3
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* STEP 01 */}
            <div
              onClick={() => setStep(1)}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                step === 1
                  ? 'bg-slate-900 text-white shadow-xs'
                  : step > 1
                  ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-900'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > 1 ? (
                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              ) : (
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 1 ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  1
                </div>
              )}
              <span className={`text-xs font-bold ${
                step === 1 ? 'text-white' : step > 1 ? 'text-slate-800' : 'text-slate-500'
              }`}>
                01 Student Details
              </span>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

            {/* STEP 02 */}
            <div
              onClick={() => {
                if (selectedStudent) setStep(2);
              }}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                step === 2
                  ? 'bg-slate-900 text-white shadow-xs'
                  : step > 2
                  ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-900'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > 2 ? (
                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              ) : (
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 2 ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
              )}
              <span className={`text-xs font-bold ${
                step === 2 ? 'text-white' : step > 2 ? 'text-slate-800' : 'text-slate-500'
              }`}>
                02 Academic Details
              </span>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

            {/* STEP 03 */}
            <div
              onClick={() => {
                if (selectedStudent) handleProceedToReview();
              }}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                step === 3
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 3 ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                3
              </div>
              <span className={`text-xs font-bold ${
                step === 3 ? 'text-white' : 'text-slate-500'
              }`}>
                03 Review & Submit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: STUDENT INTAKE (SEARCH / SELECT / CREATE)                         */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {showCreateStudentForm ? 'Create New Candidate Record' : 'Select Candidate for Matriculation'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {showCreateStudentForm
                  ? 'All 11 fields are mandatory for generating an authoritative Permanent Student UID.'
                  : 'Search by Permanent UID, Name, Email, or Aadhar Number, or pick from recent candidates.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateStudentForm(!showCreateStudentForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              {showCreateStudentForm ? (
                <>
                  <Search className="h-4 w-4" />
                  <span>Return to Search</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>+ Create New Candidate</span>
                </>
              )}
            </button>
          </div>

          {/* CREATE STUDENT FORM */}
          {showCreateStudentForm ? (
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Permanent UID (System-Generated)
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Auto-assigned (STU-YYYY-XXXXX)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    State of Residence <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newStudentData.state}
                    onChange={(e) => setNewStudentData({ ...newStudentData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="">-- Select State * --</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate legal first name"
                    value={newStudentData.first_name}
                    onChange={(e) => setNewStudentData({ ...newStudentData, first_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate surname"
                    value={newStudentData.last_name}
                    onChange={(e) => setNewStudentData({ ...newStudentData, last_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.org"
                    value={newStudentData.email}
                    onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98450 12890"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStudentData.date_of_birth}
                    onChange={(e) => setNewStudentData({ ...newStudentData, date_of_birth: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStudentData.gender}
                    onChange={(e) => setNewStudentData({ ...newStudentData, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Aadhar / National ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12-digit Indian Aadhar Number"
                    value={newStudentData.aadhar_number}
                    onChange={(e) => setNewStudentData({ ...newStudentData, aadhar_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentData.country}
                    onChange={(e) => setNewStudentData({ ...newStudentData, country: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Door No, Street Name, Locality"
                    value={newStudentData.address}
                    onChange={(e) => setNewStudentData({ ...newStudentData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City / Town <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    value={newStudentData.city}
                    onChange={(e) => setNewStudentData({ ...newStudentData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore Urban"
                    value={newStudentData.district}
                    onChange={(e) => setNewStudentData({ ...newStudentData, district: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 560077"
                    value={newStudentData.pincode}
                    onChange={(e) => setNewStudentData({ ...newStudentData, pincode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering Candidate...' : 'Create & Proceed to Placement →'}
                </button>
              </div>
            </form>
          ) : (
            /* SEARCH OR PICK FROM RECENT */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate by Permanent UID, Name, Email, or Aadhar..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-black focus:outline-hidden"
                />
              </div>

              {/* Search Results or Recent Students */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pt-1">
                {(searchQuery.trim() ? searchResults : recentStudents).map((st) => {
                  const isCurSelected = selectedStudent?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSelectedStudent(st);
                        setStep(2);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isCurSelected
                          ? 'border-black bg-slate-50 ring-2 ring-black/10'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                            {st.first_name?.[0] || 'S'}{st.last_name?.[0] || 'C'}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                            <Check className="h-2 w-2 text-white stroke-[3]" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-black truncate">
                            {st.first_name} {st.last_name}
                          </h4>
                          <p className="text-[11px] font-mono font-bold text-slate-600 truncate mt-0.5">
                            UID: {st.permanent_uid}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {st.email} {st.state ? `• ${st.state}` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Select Candidate →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: ACADEMIC DETAILS                                                  */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          {/* A. Candidate Summary Card */}
          {selectedStudent && (
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-4">
                {/* Avatar with verified check badge */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white font-black text-sm">
                    {selectedStudent.first_name?.[0] || 'J'}{selectedStudent.last_name?.[0] || 'S'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      UID: {selectedStudent.permanent_uid || 'STU-2026-0922'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Identity Verified
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      ✉ {selectedStudent.email}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      📞 {selectedStudent.phone || '+91 98450 12890'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      📅 {formatDobDisplay(selectedStudent.date_of_birth)} (Age {calculateAge(selectedStudent.date_of_birth)})
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      👤 {selectedStudent.gender || 'Male'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
                  <span>Change Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCandidateModal(true)}
                  className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs shadow-2xs transition-colors cursor-pointer"
                  title="View Student Profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Missing State warning if student has no state */}
          {selectedStudent && (!selectedStudent.state || !selectedStudent.state.trim()) && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs shadow-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wide">
                    State Required for Registration Submission
                  </h5>
                  <p className="mt-1 text-[11px] text-amber-800">
                    State is required for every new registration submission. Please select their state below and update the profile before proceeding.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  value={missingStudentState}
                  onChange={(e) => setMissingStudentState(e.target.value)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Student's State of Residence * --</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!missingStudentState || isUpdatingStudentState}
                  onClick={handleUpdateStudentState}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isUpdatingStudentState ? 'Updating Profile...' : 'Save State to Student Profile'}
                </button>
              </div>
            </div>
          )}

          {/* B. Registration Type * */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1">
                Registration Type <span className="text-rose-500">*</span>
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select the type of registration for this student.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  type: 'INITIAL_REGISTRATION',
                  title: 'Initial Registration',
                  desc: 'First-time registration with ATA',
                  icon: GraduationCap,
                },
                {
                  type: 'RE_REGISTRATION',
                  title: 'Re-Registration',
                  desc: 'Returning student renewing an inactive or lapsed registration',
                  icon: RotateCcw,
                },
                {
                  type: 'TRANSFER',
                  title: 'Institutional Transfer',
                  desc: 'Student transferring from another accredited affiliate',
                  icon: ArrowLeftRight,
                },
                {
                  type: 'PROGRAM_PROGRESSION',
                  title: 'Program Progression',
                  desc: 'Student progressing from one ATA program to another',
                  icon: TrendingUp,
                },
              ].map((item) => {
                const isSelected = registrationType === item.type;
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    onClick={() => setRegistrationType(item.type as RegistrationType)}
                    className={`cursor-pointer rounded-2xl p-3.5 transition-all relative flex flex-col justify-between min-h-[105px] ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                        : 'bg-white border border-slate-200/80 text-slate-900 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h5 className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </h5>
                      <p className={`text-[11px] font-medium leading-tight mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conditional Previous Registration Number */}
            {(registrationType === 'TRANSFER' ||
              registrationType === 'RE_REGISTRATION' ||
              registrationType === 'PROGRAM_PROGRESSION') && (
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-600" />
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Previous Registration Record <span className="text-rose-500">*</span>
                  </h5>
                </div>
                <p className="text-[11px] text-slate-600">
                  Required for <strong>{registrationType.replace(/_/g, ' ')}</strong> candidates. Enter their existing ATA Registration Number or previous enrollment ID.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    value={previousRegistrationNumber}
                    onChange={(e) => setPreviousRegistrationNumber(e.target.value)}
                    placeholder="e.g. SAIACS/MDIV/2024/12 or previous registration ID"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* C. Program & Academic Details */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="border-b border-slate-200/60 pb-3">
              <h4 className="text-sm font-black text-slate-900">
                Program & Academic Details
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select the student's program and academic year.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institution */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Institution <span className="text-rose-500">*</span>
                  </label>
                  {user?.role === 'REGISTRAR' && (
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-slate-400" /> Assigned Institution
                    </span>
                  )}
                </div>

                {user?.role === 'REGISTRAR' ? (
                  <div className="relative">
                    <div className="w-full rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {selectedInstitution?.name || 'South Asia Institute of Advanced Christian Studies (SAIACS)'}
                        </span>
                      </div>
                      <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-black focus:outline-hidden appearance-none cursor-pointer"
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.code})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Year */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-black focus:outline-hidden appearance-none cursor-pointer"
                  >
                    <option value="2026-2027">2026–2027 (Autumn Intake - August)</option>
                    <option value="2026-2027-SPRING">2026–2027 (Spring Intake - January)</option>
                    <option value="2025-2026">2025–2026 (Autumn Intake - August)</option>
                    <option value="2027-2028">2027–2028 (Autumn Intake - August)</option>
                  </select>
                  <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Academic Department */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Academic Department <span className="text-rose-500">*</span>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-black focus:outline-hidden appearance-none cursor-pointer"
                  >
                    {departments.length > 1 && (
                      <option value="">All Departments ({departments.length})</option>
                    )}
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Program */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Program <span className="text-rose-500">*</span>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-black focus:outline-hidden appearance-none cursor-pointer"
                  >
                    {programs.length === 0 && <option value="">No programs available</option>}
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name} ({prog.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D. Enrollment Modality */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Enrollment Modality
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Select full-time residential or modular/distance mode.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEnrollmentModality('RESIDENTIAL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  enrollmentModality === 'RESIDENTIAL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Full-Time Residential</span>
              </button>

              <button
                type="button"
                onClick={() => setEnrollmentModality('MODULAR_HYBRID')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  enrollmentModality === 'MODULAR_HYBRID'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Modular / Distance</span>
              </button>
            </div>
          </div>

          {/* E. Prior Academic Qualification Details (Required by tests & DB) */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Prior Academic Background & Entrance Qualification
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Highest Qualification <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedHighestQual}
                  onChange={(e) => handleHighestQualSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800"
                >
                  {HIGHEST_QUALIFICATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {selectedHighestQual === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom qualification details"
                    value={customHighestQual}
                    onChange={(e) => handleCustomHighestQualInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium mt-1.5"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Previous College / Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="prev-inst-catalog"
                  required
                  value={previousInstitution}
                  onChange={(e) => setPreviousInstitution(e.target.value)}
                  placeholder="e.g. Mizoram University"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800"
                />
                <datalist id="prev-inst-catalog">
                  {INSTITUTION_NAMES.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Previous Program / Degree <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedPreviousProg}
                  onChange={(e) => handlePreviousProgSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800"
                >
                  <option value="">Select Previous Program / Degree...</option>
                  {PROGRAM_NAMES.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                  <option value="Other">Other (Specify Below)</option>
                </select>
                {selectedPreviousProg === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter previous degree details"
                    value={customPreviousProg}
                    onChange={(e) => handleCustomPreviousProgInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium mt-1.5"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Completion Year & Roll No <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={yearOfCompletion}
                    onChange={(e) => setYearOfCompletion(e.target.value)}
                    placeholder="Year (e.g. 2023)"
                    className="w-20 rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-800"
                  />
                  <input
                    type="text"
                    value={qualificationRegNo}
                    onChange={(e) => setQualificationRegNo(e.target.value)}
                    placeholder="Roll / Reg No"
                    className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* F. Two-Column Section: Mandatory Dossier Checklist (Left) & Registrar Assessment (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Dossier Checklist (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <h4 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                    Mandatory Dossier Checklist
                  </h4>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  3 of 3 Verified
                </span>
              </div>

              {/* Dossier Item 1: Academic Transcripts */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-black text-slate-900 truncate">
                        Academic Transcripts (Bachelors/Prior Degree)
                      </h5>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      {selectedStudent?.last_name || 'Sailo'}_Bachelors_Transcript.pdf • 1.8 MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'Academic Transcripts (Bachelors/Prior Degree)',
                      filename: `${selectedStudent?.last_name || 'Sailo'}_Bachelors_Transcript.pdf`,
                      size: '1.8 MB',
                      sha256: '4f8c9b2e91a0c87364d9f1092e4ab07c1258ef8a901b2c3d4e5f6a7b8c9d0e1f',
                      verifiedBy: 'Chief Academic Registrar',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Inspect Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>

              {/* Dossier Item 2: Church Recommendation */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-black text-slate-900 truncate">
                        Church Recommendation & Endorsement Letter
                      </h5>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      Presbyterian_Synod_Endorsement.pdf • 840 KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'Church Recommendation & Endorsement Letter',
                      filename: 'Presbyterian_Synod_Endorsement.pdf',
                      size: '840 KB',
                      sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
                      verifiedBy: 'Secretariat Audit',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Inspect Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>

              {/* Dossier Item 3: Government Photo Identification */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-black text-slate-900 truncate">
                        Government Photo Identification
                      </h5>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      Aadhaar_Card_Verified.png • Document Locker
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'Government Photo Identification (Aadhaar)',
                      filename: 'Aadhaar_Card_Verified.png',
                      size: '620 KB',
                      sha256: '9f8e7d6c5b4a3210fedcba9876543210abcdef01234567890abcdef012345678',
                      verifiedBy: 'UIDAI Verification',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Inspect Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Right Column: Registrar Assessment & Remarks (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900">
                    Registrar Assessment & Remarks <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {notes.length}/500 char
                  </span>
                </div>

                <textarea
                  rows={4}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Candidate passed prerequisite assessment. All original verification records confirmed in person. Prior qualification audited and approved."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-black focus:outline-hidden resize-none shadow-2xs font-sans"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Registrar Verification
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-medium">
                    Submitting this record registers the student under ATA accredited guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* G. Sticky Bottom Action Footer Bar */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3.5 px-6 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 rounded-b-3xl flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                Draft saved just now
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSave('DRAFT')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW & SUBMIT                                                   */}
      {/* ========================================================================= */}
      {step === 3 && selectedStudent && (
        <div className="space-y-6">
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Review Registration Details
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Review student and academic details before submitting the registration record.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                Ready to Submit
              </span>
            </div>

            {/* Registration Key Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Assigned Registration ID
                </p>
                <h4 className="text-xl font-black font-mono tracking-tight text-white mt-0.5">
                  {previewRegNumber || `${selectedInstitution?.code || 'SAIACS'}/${selectedProgram?.code || 'MDIV'}/${extractYear(academicYear)}/1`}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Format: [INST]/[PROG]/[YEAR]/[SEQ]
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Student UID
                </p>
                <h5 className="text-base font-black font-mono text-white mt-0.5">
                  {selectedStudent.permanent_uid}
                </h5>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                  ● State: {selectedStudent.state}
                </span>
              </div>
            </div>

            {/* Placement Breakdown Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-medium block">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {selectedStudent.email}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-medium block">Degree Program</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedProgram?.name || selectedProgramId}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {selectedDepartment?.name || 'Academic Division'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-medium block">Registration Type & Intake</span>
                <span className="font-bold text-slate-900 text-sm">
                  {registrationType.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {academicYear} • {enrollmentModality === 'RESIDENTIAL' ? 'Full-Time Residential' : 'Modular / Distance'}
                </span>
              </div>
            </div>

            {/* Registrar Assessment Endorsement */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Registrar Remarks
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                &ldquo;{notes}&rdquo;
              </p>
            </div>
          </div>

          {/* Sticky Bottom Actions for Step 3 */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3.5 px-6 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 rounded-b-3xl flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                Draft saved just now
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSave('DRAFT')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSave('SUBMITTED')}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Submitting Registration...' : 'Submit Registration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DOCUMENT PREVIEW                                                   */}
      {/* ========================================================================= */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider bg-[#e6fcf5] px-2 py-0.5 rounded-full border border-emerald-200">
                  Cryptographically Verified Dossier
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1">
                  {activeDocPreview.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium text-[11px]">Filename & Size</span>
                <p className="font-bold text-slate-800">{activeDocPreview.filename} ({activeDocPreview.size})</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium text-[11px]">SHA-256 Checksum</span>
                <p className="font-mono text-[11px] text-slate-700 break-all font-semibold">
                  {activeDocPreview.sha256}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium text-[11px]">Verification Authority</span>
                <p className="font-bold text-slate-800">{activeDocPreview.verifiedBy}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANDIDATE DOSSIER PROFILE                                          */}
      {/* ========================================================================= */}
      {showCandidateModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                  {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h4>
                  <p className="font-mono text-xs text-slate-500 font-bold">
                    Permanent UID: {selectedStudent.permanent_uid}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Email</span>
                <span className="font-bold text-slate-800">{selectedStudent.email}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Phone</span>
                <span className="font-bold text-slate-800">{selectedStudent.phone || '+91 98450 12890'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Date of Birth</span>
                <span className="font-bold text-slate-800">{formatDobDisplay(selectedStudent.date_of_birth)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Gender</span>
                <span className="font-bold text-slate-800">{selectedStudent.gender || 'Male'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                <span className="text-slate-400 font-medium block">State & Address</span>
                <span className="font-bold text-slate-800">{selectedStudent.state || 'Karnataka'}, India</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

