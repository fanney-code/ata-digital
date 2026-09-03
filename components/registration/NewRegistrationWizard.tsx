import React, { useState, useEffect } from 'react';
import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  RegistrationType,
  WorkflowStatus,
} from '@/lib/types';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  fetchStudents,
  createStudent,
  createRegistration,
} from '@/lib/api/supabase-service';
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
} from 'lucide-react';

interface NewRegistrationWizardProps {
  onCancel: () => void;
  onSuccess: (reg: Registration) => void;
}

export const NewRegistrationWizard: React.FC<NewRegistrationWizardProps> = ({
  onCancel,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 State: Student
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateStudentForm, setShowCreateStudentForm] = useState(false);

  const [newStudentData, setNewStudentData] = useState({
    permanent_uid: `STU-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Female',
  });

  // Step 2 State: Registration Details
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [registrationType, setRegistrationType] = useState<RegistrationType>('INITIAL_REGISTRATION');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [notes, setNotes] = useState('');

  // Load cascading dropdown options
  useEffect(() => {
    fetchInstitutions().then((data) => {
      setInstitutions(data);
      if (data.length > 0) setSelectedInstitutionId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedInstitutionId) {
      fetchDepartments(selectedInstitutionId).then((data) => {
        setDepartments(data);
        if (data.length > 0) setSelectedDepartmentId(data[0].id);
        else setSelectedDepartmentId('');
      });
    } else {
      setDepartments([]);
      setSelectedDepartmentId('');
    }
  }, [selectedInstitutionId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchPrograms(selectedDepartmentId).then((data) => {
        setPrograms(data);
        if (data.length > 0) setSelectedProgramId(data[0].id);
        else setSelectedProgramId('');
      });
    } else {
      setPrograms([]);
      setSelectedProgramId('');
    }
  }, [selectedDepartmentId]);

  // Initial student query on search input change
  useEffect(() => {
    const handleSearch = async () => {
      setIsSearching(true);
      try {
        const results = await fetchStudents(searchQuery);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle creating a new student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.first_name || !newStudentData.last_name || !newStudentData.email) {
      setErrorMessage('Please fill in required student fields (First Name, Last Name, Email).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const created = await createStudent(newStudentData);
      setSelectedStudent(created);
      setShowCreateStudentForm(false);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create student. Permanent UID or Email may already exist.');
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
    if (!selectedInstitutionId || !selectedDepartmentId || !selectedProgramId) {
      setErrorMessage('Please select Institution, Department, and Program.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  // Final Action: Save Draft or Submit Registration
  const handleFinalSave = async (status: WorkflowStatus) => {
    if (!selectedStudent || !selectedInstitutionId || !selectedDepartmentId || !selectedProgramId) {
      setErrorMessage('Missing required registration data.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newRegistration = await createRegistration({
        student_id: selectedStudent.id,
        registration_type: registrationType,
        institution_id: selectedInstitutionId,
        department_id: selectedDepartmentId,
        program_id: selectedProgramId,
        academic_year: academicYear,
        status: status,
        notes: notes,
      });

      onSuccess(newRegistration);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist registration to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Wizard Header Progress Bar */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 1 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Find Student
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 2 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Registration Details
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 3 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Review & Submit
            </span>
          </div>
        </div>
      </div>

      {/* Form Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="p-6">
        {/* ======================================================== */}
        {/* STEP 1 — FIND OR CREATE STUDENT                           */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Step 1: Select Student Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search for an existing student by Permanent UID, Name, or Email
                </p>
              </div>

              {!showCreateStudentForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateStudentForm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  + Create New Student
                </button>
              )}
            </div>

            {/* Selected Student Highlight Card */}
            {selectedStudent && !showCreateStudentForm && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                      Selected Candidate
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      UID: {selectedStudent.permanent_uid} | {selectedStudent.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Change Student
                </button>
              </div>
            )}

            {/* CREATE NEW STUDENT FORM */}
            {showCreateStudentForm ? (
              <form onSubmit={handleCreateStudent} className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    New Student Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateStudentForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel & Return to Search
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Permanent Student UID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.permanent_uid}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, permanent_uid: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.first_name}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, first_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.last_name}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, last_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newStudentData.email}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newStudentData.phone}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={newStudentData.date_of_birth}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, date_of_birth: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving Student...' : 'Save & Select Student'}
                  </button>
                </div>
              </form>
            ) : (
              /* SEARCH EXISTING STUDENTS LIST */
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Permanent UID (e.g. STU-2026-00421), First/Last Name, or Email..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Searching student directory...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      No matching student records found.
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateStudentForm(true)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          + Click here to create a new student record
                        </button>
                      </div>
                    </div>
                  ) : (
                    searchResults.map((st) => {
                      const isSelected = selectedStudent?.id === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudent(st)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {st.first_name} {st.last_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono">
                                UID: {st.permanent_uid} | {st.email}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(st);
                            }}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Bottom Navigation Step 1 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedStudent}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
              >
                Next: Registration Details
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2 — REGISTRATION DETAILS                             */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 2: Registration & Academic Placement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify registration classification and institutional hierarchy
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Registration Type */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { type: 'INITIAL_REGISTRATION', label: 'Initial Registration' },
                    { type: 'RE_REGISTRATION', label: 'Re-Registration' },
                    { type: 'TRANSFER', label: 'Transfer' },
                    { type: 'PROGRAM_PROGRESSION', label: 'Program Progression' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setRegistrationType(item.type as RegistrationType)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                        registrationType === item.type
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institution <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown (Cascading) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Dropdown (Cascading) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name} ({prog.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Registration Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter initial registration details or applicant observations..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Bottom Navigation Step 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Student Selection
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Proceed to Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3 — REVIEW SUMMARY & SAVE DRAFT / SUBMIT             */}
        {/* ======================================================== */}
        {step === 3 && selectedStudent && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 3: Review & Finalize Registration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify all candidate and academic placement details before persisting
              </p>
            </div>

            {/* Candidate & Placement Summary Card */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student Info
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h4>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  Permanent UID: {selectedStudent.permanent_uid} | {selectedStudent.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium">Registration Type</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {registrationType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Academic Year</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {academicYear}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Institution</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {institutions.find((i) => i.id === selectedInstitutionId)?.name}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {departments.find((d) => d.id === selectedDepartmentId)?.name}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-400 font-medium">Program</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {programs.find((p) => p.id === selectedProgramId)?.name}
                  </span>
                </div>
                {notes && (
                  <div className="col-span-2">
                    <span className="block text-slate-400 font-medium">Notes</span>
                    <span className="text-slate-600 dark:text-slate-400 italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Save Draft vs Submit */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Edit Details
              </button>

              <div className="flex items-center gap-3">
                {/* SAVE DRAFT */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSave('DRAFT')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Save className="h-4 w-4 text-slate-500" />
                  SAVE DRAFT
                </button>

                {/* SUBMIT REGISTRATION */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSave('SUBMITTED')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Persisting to Supabase...' : 'SUBMIT REGISTRATION'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
