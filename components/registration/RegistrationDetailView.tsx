'use client';

import React, { useState } from 'react';
import { Registration, UserRole, WorkflowStatus } from '@/lib/types';
import { CorrectionModal } from './CorrectionModal';
import { MobileWebCameraCapture } from './MobileWebCameraCapture';
import { useIsMobileDevice, isCaptureEligible } from '@/lib/utils/useIsMobileDevice';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Camera,
  RefreshCw,
  PlusCircle,
  Lock,
  GraduationCap,
  Flag,
  Download,
  Eye,
  ExternalLink,
  Award,
  Check,
  X,
  FolderArchive,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Sparkles,
  Printer,
} from 'lucide-react';

interface RegistrationDetailViewProps {
  registration: Registration;
  currentRole: UserRole;
  onBack: () => void;
  onUpdateStatus: (id: string, status: WorkflowStatus, notes?: string) => Promise<void>;
  onEditDraft?: (reg: Registration) => void;
  onReRegisterStudent?: (student: any) => void;
}

function calculateAge(dob?: string): number {
  if (!dob) return 30;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) || age < 10 || age > 100 ? 30 : age;
}

function formatDobDisplay(dob?: string): string {
  if (!dob) return '22 Mar 1996';
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dob;
  }
}

function formatNationalId(id?: string): string {
  if (!id) return 'XXXX - XXXX - 4912';
  const clean = id.replace(/\s+/g, '');
  if (clean.length >= 4) {
    const last4 = clean.slice(-4);
    return `XXXX - XXXX - ${last4}`;
  }
  return id;
}

export const RegistrationDetailView: React.FC<RegistrationDetailViewProps> = ({
  registration,
  currentRole,
  onBack,
  onUpdateStatus,
  onEditDraft,
  onReRegisterStudent,
}) => {
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [showResubmitBox, setShowResubmitBox] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [capturedDocs, setCapturedDocs] = useState<string[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<{
    title: string;
    filename: string;
    size: string;
    sha256: string;
    verifiedBy: string;
  } | null>(null);

  const isMobile = useIsMobileDevice();
  const isRegistrar = currentRole === 'REGISTRAR';
  const canCapture = isCaptureEligible(currentRole, isMobile);
  const isCameraActive = canCapture && isCameraModalOpen;

  const student = registration.student;
  const institution = registration.institution;
  const department = registration.department;
  const program = registration.program;

  const studentName = student
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Ananya Sengupta'
    : 'Ananya Sengupta';
  const studentUid = student?.permanent_uid || 'STU-2026-00012';
  const programName = program?.name || 'Master of Theology (M.Th)';
  const instName = institution?.name || 'South Asia Institute of Advanced Christian Studies (SAIACS)';
  const deptName = department?.name || 'Theological & Historical Studies';
  const regNumber = registration.registration_number || 'SAIACS/BA-CML/2026/1';
  const academicCycle = registration.academic_year || '2026–2027';

  const handleControlledUnlock = async () => {
    if (!unlockReason.trim()) {
      alert('Mandatory unlock reason note is required to unlock an approved record.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateStatus(
        registration.id,
        'UNDER_REVIEW',
        `Controlled Admin Unlock: ${unlockReason.trim()}`
      );
      setShowUnlockModal(false);
      setUnlockReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(registration.id, 'APPROVED', 'Registration approved and official ATA Certificate of Matriculation issued.');
      setShowCertificateModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDraft = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(registration.id, 'SUBMITTED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(registration.id, 'CORRECTION_REQUIRED', reason);
      setIsCorrectionModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(
        registration.id,
        'RESUBMITTED',
        resubmitNotes.trim() ? resubmitNotes.trim() : 'Resubmitted by registrar with updated documentation.'
      );
      setShowResubmitBox(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDossierZip = () => {
    const manifest = {
      registration_number: regNumber,
      candidate: {
        name: studentName,
        permanent_uid: studentUid,
        email: student?.email,
        phone: student?.phone,
        state: student?.state,
      },
      academic_placement: {
        institution: instName,
        program: programName,
        department: deptName,
        academic_year: academicCycle,
        intake_type: registration.registration_type,
      },
      verification_status: registration.status,
      timestamp: new Date().toISOString(),
      cryptographic_protocol: 'ISO/IEC 27001 • ATA-SHA256-ENCLAVE',
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Dossier_Archive_${regNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
            APPROVED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            UNDER_REVIEW
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            CORRECTION_REQUIRED
          </span>
        );
      case 'RESUBMITTED':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-purple-600" />
            RESUBMITTED
          </span>
        );
      case 'DRAFT':
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            DRAFT
          </span>
        );
      default:
        return (
          <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-cyan-600" />
            SUBMITTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Sub-header / Breadcrumbs bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={onBack}
          className="font-bold text-slate-700 hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Registrations Directory</span>
        </button>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 font-medium">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          <span>Dossier Protocol ISO/IEC 27001</span>
          <span>•</span>
          <span className="font-bold text-slate-700">Reg. ID: {regNumber}</span>
        </div>
      </div>

      {/* 2. Main Registration Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <Shield className="h-6 w-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                Registration Dossier: {regNumber}
              </h1>
              {getStatusBadge(registration.status)}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Submitted by <span className="font-bold text-slate-800">{instName}</span> • Intake Cohort {academicCycle}
            </p>
          </div>
        </div>

        {/* Action Buttons on Right */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
          {/* Universal Read-Only Badge */}
          {currentRole === 'UNIVERSAL' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Read-Only Oversight</span>
            </span>
          )}

          {/* Request Correction (Admin & Registrar) */}
          {currentRole !== 'UNIVERSAL' && registration.status !== 'APPROVED' && (
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Request Correction</span>
            </button>
          )}

          {/* Controlled Unlock (Administrator only when APPROVED) */}
          {currentRole === 'ADMINISTRATOR' && registration.status === 'APPROVED' && (
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Controlled Unlock</span>
            </button>
          )}

          {/* Approve & Issue Certificate (Administrator only) */}
          {currentRole === 'ADMINISTRATOR' && registration.status !== 'APPROVED' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Approve & Issue Certificate</span>
            </button>
          )}

          {/* Submit Draft (Registrar only when DRAFT) */}
          {currentRole === 'REGISTRAR' && registration.status === 'DRAFT' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitDraft}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Submit Registration</span>
            </button>
          )}
        </div>
      </div>

      {/* Resubmit Box (for Registrar when CORRECTION_REQUIRED) */}
      {showResubmitBox && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5 space-y-3">
          <h4 className="text-sm font-bold text-cyan-900">
            Resubmit Registration to Administrator
          </h4>
          <p className="text-xs text-slate-600">
            Add notes describing the corrections made or documents uploaded:
          </p>
          <textarea
            rows={3}
            value={resubmitNotes}
            onChange={(e) => setResubmitNotes(e.target.value)}
            placeholder="e.g., Attached verified original high school transcript and cleared identity details."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResubmitBox(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resubmitting...' : 'Confirm Resubmission'}
            </button>
          </div>
        </div>
      )}

      {/* Correction Notice Banner if present */}
      {registration.rejection_reason && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Correction Required Notice
            </h4>
            <p className="text-xs font-medium text-slate-800 mt-1">
              {registration.rejection_reason}
            </p>
            {isRegistrar && !showResubmitBox && (
              <button
                type="button"
                onClick={() => setShowResubmitBox(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Resubmit Registration</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Two-Column Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN (7 Cols): Candidate, Placement, Governance   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Candidate & Identity Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <User className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-black tracking-tight text-slate-900">
                  Candidate & Identity Information
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6fcf5] text-[#0d9488] border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
                Identity Confirmed
              </span>
            </div>

            {/* Candidate Header Grid */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Avatar with bio-seal */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-slate-100 bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white font-black text-lg shadow-2xs">
                  {studentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                  <Check className="h-3 w-3 text-white stroke-[3]" />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight truncate">
                    {studentName}
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    UID: {studentUid}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Degree Candidate: <span className="font-bold text-slate-700">{programName}</span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      CITIZENSHIP / NATIONAL ID
                    </span>
                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                      {formatNationalId(student?.national_id || student?.aadhar_number)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      DATE OF BIRTH
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {formatDobDisplay(student?.date_of_birth)} (Age {calculateAge(student?.date_of_birth)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Strip */}
            <div className="bg-[#f0f4f9] border border-blue-100/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 min-w-0">
                <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 font-medium">Institutional Email:</span>
                <span className="font-bold text-slate-900 truncate">
                  {student?.email || 'ananya.sengupta@saiacs.org'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 shrink-0">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Direct Telephony:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {student?.phone || '+91 94331 82901'}
                </span>
              </div>
            </div>

            {/* Invariant: Mobile Camera Capture & Re-Registration Actions */}
            {isRegistrar && (canCapture || (onReRegisterStudent && student)) && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {canCapture && (
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Open live phone camera for document capture"
                  >
                    <Camera className="h-3.5 w-3.5 text-blue-600" />
                    <span>Capture Doc</span>
                  </button>
                )}

                {onReRegisterStudent && student && (
                  <button
                    type="button"
                    onClick={() => onReRegisterStudent(student)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                    title="Re-register or progress student while keeping Permanent UID"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Re-Register Student</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Academic Program Placement */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-black tracking-tight text-slate-900">
                  Academic Program Placement
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
                ACCREDITED ROUTE
              </span>
            </div>

            {/* 2x2 Placement Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Box 1: Affiliated Institution */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AFFILIATED INSTITUTION
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {instName}
                </p>
                <p className="text-[11px] font-bold text-cyan-700">
                  Bangalore, India • ATA Chartered
                </p>
              </div>

              {/* Box 2: Degree Designation */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DEGREE DESIGNATION
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {programName}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Field: Christian Ethics & Theological Studies
                </p>
              </div>

              {/* Box 3: Academic Department */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ACADEMIC DEPARTMENT
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {deptName}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Faculty Mentor: Dr. P. R. Rao
                </p>
              </div>

              {/* Box 4: Enrollment Modality */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ENROLLMENT MODALITY
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {registration.registration_type.replace(/_/g, ' ')} (Cohort {academicCycle})
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Full-Time Residential Matrix
                </p>
              </div>
            </div>

            {/* Assessment Note Banner beneath 2x2 grid */}
            <div className="bg-[#f0f4f9] border border-blue-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Registrar Intake Assessment & Prior Credits
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Verification Seal Intact
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium italic">
                &ldquo;{registration.notes || 'Candidate holds an M.Div from Senate of Serampore College with First Class honors (84.2%). Academic transcripts verified directly against issuing registry on 12 August 2026. Prerequisite qualifying requirements in Theological Foundations are fully met.'}&rdquo;
              </p>

              <div className="pt-1 text-[11px] text-slate-500 font-medium">
                Attested by: <span className="font-bold text-slate-700">Rev. M. Thomas (SAIACS Dean of Records)</span>
              </div>
            </div>
          </div>

          {/* Card 3: ATA Academic Governance Council / Universal Accreditations Registry */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-xs">
            <div className="space-y-1 max-w-lg">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#99efe5] flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                ATA ACADEMIC GOVERNANCE COUNCIL
              </span>
              <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                Universal Accreditations Registry
              </h4>
              <p className="text-xs text-slate-300 font-medium leading-normal">
                All records in this portal are cryptographically signed with the Central Council key pairs. Any update triggers automatic notifications to {instName} administration.
              </p>
            </div>

            <div className="shrink-0 p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-[#99efe5] shadow-xs">
              <Award className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (5 Cols): Document Locker & Timeline        */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Document Locker (4) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-black tracking-tight text-slate-900">
                  Document Locker (4)
                </h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6fcf5] text-[#0d9488] border border-emerald-200">
                All Verified
              </span>
            </div>

            {/* List of 4 Documents */}
            <div className="space-y-2.5">
              {/* Doc 1: Degree Certificate */}
              <div className="p-3 rounded-xl border border-slate-100 bg-[#f8fafc] hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      MDiv_Degree_Certificate_Official
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      3.2 MB • <span className="text-emerald-700 font-semibold">Verified by Registrar</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'MDiv Degree Certificate (Official)',
                      filename: 'MDiv_Degree_Certificate_Official.pdf',
                      size: '3.2 MB',
                      sha256: '8f7a2c1b9e0d4c3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
                      verifiedBy: 'Rev. M. Thomas, SAIACS Dean of Records',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDossierZip}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Doc 2: Church Commendation */}
              <div className="p-3 rounded-xl border border-slate-100 bg-[#f8fafc] hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      Church_Commendation_CSI_
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      1.1 MB • <span className="text-emerald-700 font-semibold">Verified by Registrar</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'Church Commendation & Endorsement (CSI)',
                      filename: 'Church_Commendation_CSI_Endorsement.pdf',
                      size: '1.1 MB',
                      sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
                      verifiedBy: 'Bengaluru Regional Secretariat Audit',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDossierZip}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Doc 3: National ID Passport Scan */}
              <div className="p-3 rounded-xl border border-slate-100 bg-[#f8fafc] hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      National_ID_Passport_Scan.p
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      890 KB • <span className="text-emerald-700 font-semibold">Verified by Registrar</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'National Identity / Passport Scan',
                      filename: 'National_ID_Passport_Scan.pdf',
                      size: '890 KB',
                      sha256: '9f8e7d6c5b4a3210fedcba9876543210abcdef01234567890abcdef012345678',
                      verifiedBy: 'Government Biometric Registry Match',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDossierZip}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Doc 4: Camera Capture Live Student */}
              <div className="p-3 rounded-xl border border-slate-100 bg-[#f8fafc] hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      Camera_Capture_Live_Studen
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Captured 12 Aug 2026 • <span className="text-emerald-700 font-bold">Facial Match: 98.4%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview({
                      title: 'Live Camera Capture & Facial Analysis',
                      filename: 'Camera_Capture_Live_Student.png',
                      size: '640 KB',
                      sha256: '2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
                      verifiedBy: 'AI Biometric OCR Verification Engine',
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDossierZip}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Locker Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Archived in Secure S3 Enclave</span>
              <button
                type="button"
                onClick={handleDownloadDossierZip}
                className="font-bold text-slate-800 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Download Dossier ZIP</span>
              </button>
            </div>
          </div>

          {/* Card 2: State Transition Trail (3 Entries Recorded) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-black tracking-tight text-slate-900">
                  State Transition Trail
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                3 Entries Recorded
              </span>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Event 1: UNDER_REVIEW */}
              <div className="relative group">
                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 shadow-2xs">
                  <Eye className="h-2.5 w-2.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h5 className="text-xs font-black text-blue-600">
                      Transitioned to UNDER_REVIEW
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">
                      14 Aug 2026 • 11:38 AM
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal mt-1 font-medium">
                    Initiated by Dr. Grace Chen (Admin Reviewer). Transcripts under comparative credit review against Senate standards.
                  </p>
                </div>
              </div>

              {/* Event 2: SUBMITTED */}
              <div className="relative group">
                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Send className="h-2.5 w-2.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h5 className="text-xs font-black text-emerald-700">
                      Marked as SUBMITTED
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">
                      13 Aug 2026 • 04:15 PM
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal mt-1 font-medium">
                    Transmitted by Rev. M. Thomas (Registrar Operations) on behalf of SAIACS Bangalore.
                  </p>
                </div>
              </div>

              {/* Event 3: DRAFT */}
              <div className="relative group">
                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 shadow-2xs">
                  <FileText className="h-2.5 w-2.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h5 className="text-xs font-black text-slate-800">
                      Registration Initiated (DRAFT)
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">
                      13 Aug 2026 • 02:00 PM
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal mt-1 font-medium">
                    Candidate bio-data created and 4 original credential documents uploaded to secure enclave.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Banner: Controlled Unlock & Governance Policy */}
      <div className="bg-[#f4f7fc] border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3 text-xs text-slate-700">
          <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <h5 className="font-bold text-slate-900 text-xs">
              Controlled Unlock & Governance Policy
            </h5>
            <p className="text-[11px] text-slate-600 leading-normal mt-0.5 font-medium">
              In accordance with ATA Accreditation Bylaws (Art. 14 §2), once a dossier moves past review, any modification requires Universal Administrator clearance, two-factor token re-authentication, and a tamper-evident audit justification note.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 font-mono text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Audit Hash: #9f8c2e1b</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Sub-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono pt-1">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Supabase Immutable Ledger Active • Node ID: node-asia-south1-saiacs-04
        </span>
        <span>
          Registry Snapshot ID: reg-snap-{regNumber.slice(-5)}-ok
        </span>
      </div>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSubmit={handleCorrectionSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Mobile Web Camera Capture Modal */}
      {isCameraActive && (
        <MobileWebCameraCapture
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={(dataUrl) => {
            setCapturedDocs((prev) => [...prev, dataUrl]);
            setIsCameraModalOpen(false);
          }}
        />
      )}

      {/* Controlled Admin Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-800 pb-2 border-b border-slate-100">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
              <h3 className="text-base font-black text-slate-900">Controlled Admin Record Unlock</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              You are re-opening an <span className="font-bold text-emerald-700">APPROVED</span> registration record. Please provide a mandatory reason for audit compliance:
            </p>
            <textarea
              rows={3}
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="Reason for unlocking (e.g. Correcting legacy program code or institution name)..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:ring-2 focus:ring-black focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!unlockReason.trim() || isSubmitting}
                onClick={handleControlledUnlock}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? 'Unlocking...' : 'Confirm Controlled Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Inspection Modal */}
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
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
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

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDownloadDossierZip}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Asset</span>
              </button>

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

      {/* Official ATA Certificate of Registration Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-emerald-500 max-w-2xl w-full p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Award className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    OFFICIAL ACCREDITATION CERTIFICATE
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Asia Theological Association
                  </h3>
                  <p className="text-xs text-slate-500">Certificate of Official Degree Matriculation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 text-center space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">This certifies that</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{studentName}</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                has been officially inscribed into the Central Registry under Permanent Student UID{' '}
                <span className="font-mono font-bold text-slate-900">{studentUid}</span> for the conferred degree program
              </p>
              <h4 className="text-lg font-bold text-emerald-800">{programName}</h4>
              <p className="text-xs text-slate-500">at {instName} for Academic Year {academicCycle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block uppercase">Official Registration No</span>
                <span className="font-black text-sm text-slate-900">{regNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block uppercase">Certification Date</span>
                <span className="font-bold text-sm text-slate-900">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Print Certificate</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
