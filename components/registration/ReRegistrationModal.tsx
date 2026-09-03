import React, { useState, useEffect } from 'react';
import { Registration, RegistrationType, Institution, Department, Program } from '@/lib/types';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  createRegistration,
} from '@/lib/api/supabase-service';
import { RefreshCw, UserCheck, CheckCircle2, AlertCircle, X, ArrowRight, Building2, Calendar, Layers } from 'lucide-react';

interface ReRegistrationModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReg: Registration) => void;
}

export const ReRegistrationModal: React.FC<ReRegistrationModalProps> = ({
  registration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgId, setSelectedProgId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [regType, setRegType] = useState<RegistrationType>('RE_REGISTRATION');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const student = registration?.student;

  useEffect(() => {
    if (isOpen) {
      loadReferenceData();
    }
  }, [isOpen]);

  const loadReferenceData = async () => {
    try {
      const insts = await fetchInstitutions();
      setInstitutions(insts);
      if (insts.length > 0) {
        const defaultInstId = registration?.institution_id || insts[0].id;
        setSelectedInstId(defaultInstId);

        const depts = await fetchDepartments(defaultInstId);
        setDepartments(depts);
        if (depts.length > 0) {
          const defaultDeptId = registration?.department_id || depts[0].id;
          setSelectedDeptId(defaultDeptId);

          const progs = await fetchPrograms(defaultDeptId);
          setPrograms(progs);
          if (progs.length > 0) {
            setSelectedProgId(registration?.program_id || progs[0].id);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(`Failed to load institutional reference data: ${err.message}`);
    }
  };

  const handleInstitutionChange = async (instId: string) => {
    setSelectedInstId(instId);
    try {
      const depts = await fetchDepartments(instId);
      setDepartments(depts);
      if (depts.length > 0) {
        setSelectedDeptId(depts[0].id);
        const progs = await fetchPrograms(depts[0].id);
        setPrograms(progs);
        if (progs.length > 0) setSelectedProgId(progs[0].id);
      } else {
        setDepartments([]);
        setPrograms([]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDeptId(deptId);
    try {
      const progs = await fetchPrograms(deptId);
      setPrograms(progs);
      if (progs.length > 0) setSelectedProgId(progs[0].id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !student) return;

    if (!selectedInstId || !selectedDeptId || !selectedProgId) {
      setErrorMsg('Please select institution, department, and program.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newRegPayload: Partial<Registration> = {
        student_id: student.id,
        registration_type: regType,
        institution_id: selectedInstId,
        department_id: selectedDeptId,
        program_id: selectedProgId,
        academic_year: academicYear,
        status: 'SUBMITTED',
        notes: notes.trim()
          ? notes.trim()
          : `Re-registration created from prior cycle (${registration.registration_number}) on ${new Date().toLocaleDateString()}`,
      };

      const created = await createRegistration(newRegPayload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Failed to create re-registration: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !registration || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-purple-500/10 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Re-Register Student Candidate
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                Issue new registration cycle while maintaining existing Permanent UID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Permanent Identity Preserved Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Preserved Student Identity
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold font-sans text-[10px] border border-emerald-300">
                <UserCheck className="h-3 w-3 inline mr-1" /> Single Permanent UID
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 font-medium block">Permanent UID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {student.permanent_uid}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Student Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {student.first_name} {student.last_name}
                </span>
              </div>
            </div>
          </div>

          {/* Registration Type & Cycle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Registration Type
              </label>
              <select
                value={regType}
                onChange={(e: any) => setRegType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="RE_REGISTRATION">Re-Registration (Next Cycle)</option>
                <option value="PROGRAM_PROGRESSION">Program Progression</option>
                <option value="TRANSFER">Institution Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                New Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2028-2029">2028-2029</option>
              </select>
            </div>
          </div>

          {/* Institution, Department, Program Mapping */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Target Institution
              </label>
              <select
                value={selectedInstId}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 font-semibold text-slate-800 dark:text-slate-200"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 font-semibold text-slate-800 dark:text-slate-200"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Program / Course
                </label>
                <select
                  value={selectedProgId}
                  onChange={(e) => setSelectedProgId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 font-semibold text-slate-800 dark:text-slate-200"
                >
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Re-Registration Notes & Justification
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Progressing to Year 2 B.Th cycle after completing prerequisite course credits."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Re-Registration...' : 'Issue New Registration Record'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
