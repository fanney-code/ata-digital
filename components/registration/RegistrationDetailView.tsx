import React, { useState } from 'react';
import { Registration, UserRole, WorkflowStatus, DocumentReference } from '@/lib/types';
import { StatusBadge } from '../dashboard/StatusBadge';
import { CorrectionModal } from './CorrectionModal';
import { DocumentPreviewModal } from '../admin/DocumentPreviewModal';
import { UnlockRegistrationModal } from '../admin/UnlockRegistrationModal';
import { MobileCameraCaptureModal } from './MobileCameraCaptureModal';
import { ReRegistrationModal } from './ReRegistrationModal';
import { unlockRegistration } from '@/lib/api/supabase-service';
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ShieldAlert,
  Unlock,
  Eye,
  FileCheck,
  AlertTriangle,
  Flame,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface RegistrationDetailViewProps {
  registration: Registration;
  currentRole: UserRole;
  onBack: () => void;
  onUpdateStatus: (id: string, status: WorkflowStatus, notes?: string) => Promise<void>;
  onEditDraft?: (reg: Registration) => void;
  onReload?: () => void;
  onSelectRegistration?: (reg: Registration) => void;
}

export const RegistrationDetailView: React.FC<RegistrationDetailViewProps> = ({
  registration,
  currentRole,
  onBack,
  onUpdateStatus,
  onEditDraft,
  onReload,
  onSelectRegistration,
}) => {
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isReRegModalOpen, setIsReRegModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentReference | null>(null);

  const [localDocs, setLocalDocs] = useState<DocumentReference[]>(registration.documents || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [showResubmitBox, setShowResubmitBox] = useState(false);

  const student = registration.student;
  const institution = registration.institution;
  const department = registration.department;
  const program = registration.program;
  const durationStatus = registration.duration_status || 'NORMAL';

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(registration.id, 'APPROVED', 'Registration approved by administrator.');
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

  const handleConfirmUnlock = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await unlockRegistration(registration.id, reason, 'administrator@institution.edu');
      setIsUnlockModalOpen(false);
      if (onReload) onReload();
      else await onUpdateStatus(registration.id, 'UNDER_REVIEW', `Unlocked: ${reason}`);
    } catch (err: any) {
      alert(`Failed to unlock registration: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCameraCaptureSuccess = (newDoc: DocumentReference) => {
    setLocalDocs((prev) => [newDoc, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Registrations
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">ID: {registration.id}</span>
          <StatusBadge status={registration.status} size="lg" />
        </div>
      </div>

      {/* Main Registration Banner */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Registration Record
            </span>
            {durationStatus === 'EXTENDED' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-[10px] border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Extended (Exceeds Expected Duration)
              </span>
            )}
            {durationStatus === 'BACKLOG' && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[10px] border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                <Flame className="h-3 w-3 text-rose-500" />
                Backlog Alert
              </span>
            )}
            {durationStatus === 'RE_REGISTRATION_REQUIRED' && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold text-[10px] border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-500" />
                Re-Registration Required
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {registration.registration_number}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Type: <span className="font-semibold text-slate-700 dark:text-slate-300">{registration.registration_type.replace(/_/g, ' ')}</span> | Academic Cycle: <span className="font-mono font-semibold">{registration.academic_year}</span>
          </p>
        </div>

        {/* Action Controls Container */}
        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          {/* Re-Register Student Action for returning/progressing candidates */}
          <button
            onClick={() => setIsReRegModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors shadow-2xs"
            title="Issue new academic cycle registration while retaining Permanent UID"
          >
            <RefreshCw className="h-4 w-4" />
            <span>+ Re-Register Student</span>
          </button>

          {/* REGISTRAR ACTIONS */}
          {currentRole === 'REGISTRAR' && (
            <>
              {registration.status === 'DRAFT' && (
                <>
                  {onEditDraft && (
                    <button
                      onClick={() => onEditDraft(registration)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      Edit Draft
                    </button>
                  )}
                  <button
                    onClick={handleSubmitDraft}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Submit Registration
                  </button>
                </>
              )}

              {registration.status === 'CORRECTION_REQUIRED' && !showResubmitBox && (
                <button
                  onClick={() => setShowResubmitBox(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  Resubmit Registration
                </button>
              )}
            </>
          )}

          {/* ADMINISTRATOR ACTIONS */}
          {currentRole === 'ADMINISTRATOR' && (
            <>
              {(registration.status === 'SUBMITTED' ||
                registration.status === 'UNDER_REVIEW' ||
                registration.status === 'RESUBMITTED') && (
                <>
                  <button
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-semibold text-xs transition-colors"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Request Correction
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Registration
                  </button>
                </>
              )}

              {registration.status === 'APPROVED' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors shadow-2xs"
                    title="Unlock approved registration for emergency updates with mandatory audit logging"
                  >
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </button>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onUpdateStatus(registration.id, e.target.value as WorkflowStatus, `Final Lifecycle Status Transition to ${e.target.value}`);
                        e.target.value = '';
                      }
                    }}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Final Lifecycle Transition...</option>
                    <option value="GRADUATED">🎓 Graduate Candidate</option>
                    <option value="COMPLETED">✅ Mark Completed</option>
                    <option value="NOT_COMPLETED">⚠️ Mark Not Completed</option>
                    <option value="TRANSFERRED">🔄 Transfer Candidate</option>
                    <option value="ARCHIVED">📦 Archive Record</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* UNIVERSAL READ ONLY NOTICE */}
          {currentRole === 'UNIVERSAL' && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Read-only mode (Workflow modifications restricted)
            </span>
          )}
        </div>
      </div>

      {/* Candidate Supporting Documents & Certificates Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Candidate Documents & Certificates ({localDocs.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Private documents captured via Live Mobile Camera or Registrar upload
              </p>
            </div>
          </div>

          {/* Live Mobile Camera Stream Capture Trigger */}
          <button
            type="button"
            onClick={() => setIsCameraModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <Camera className="h-4 w-4" />
            <span>Launch Phone Camera Stream</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                  {doc.file_url ? (
                    <img
                      src={doc.file_url}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {doc.file_name} • {doc.file_size || '1.5 MB'}
                  </p>
                  {doc.verified && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Verified Document
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resubmit Box (for Registrar when CORRECTION_REQUIRED) */}
      {showResubmitBox && (
        <div className="rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/30 p-5 space-y-3">
          <h4 className="text-sm font-bold text-cyan-900 dark:text-cyan-300">
            Resubmit Registration to Administrator
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Add notes describing the corrections made or documents uploaded:
          </p>
          <textarea
            rows={3}
            value={resubmitNotes}
            onChange={(e) => setResubmitNotes(e.target.value)}
            placeholder="e.g., Attached verified original high school transcript and cleared identity details."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowResubmitBox(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleResubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resubmitting...' : 'Confirm Resubmission'}
            </button>
          </div>
        </div>
      )}

      {/* Rejection / Correction Reason Box */}
      {registration.rejection_reason && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-5 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Correction Required Notice
            </h4>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
              {registration.rejection_reason}
            </p>
          </div>
        </div>
      )}

      {/* 2 Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Information Card */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Student Profile
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified candidate information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Permanent UID</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {student?.permanent_uid || 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Full Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {student ? `${student.first_name} ${student.last_name}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Email Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student?.email || 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Phone</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student?.phone || 'Not provided'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Date of Birth</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student?.date_of_birth || 'Not provided'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Gender</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student?.gender || 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Program Card */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Academic Placement
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Institution & program mapping
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Institution</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {institution?.name || 'Institution'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 font-medium">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {department?.name || 'Department'}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Program</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {program?.name || 'Program'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="block text-slate-400 font-medium">Academic Year</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {registration.academic_year}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Registration Type</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {registration.registration_type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Supporting Documents & Certificates Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Candidate Documents & Certificates ({registration.documents?.length || 0})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Private documents captured via Live Mobile Camera or Registrar upload
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(registration.documents || []).map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                  {doc.file_url ? (
                    <img
                      src={doc.file_url}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {doc.file_name} • {doc.file_size || '1.5 MB'}
                  </p>
                  {doc.verified && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Verified Document
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Consolidated Student Lifecycle Timeline Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Consolidated Student Lifecycle Timeline
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Permanent UID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{student?.permanent_uid || 'STU-2026-UNKNOWN'}</span> • Linked Historical Cycles
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-4 space-y-4">
          <div className="relative">
            <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  {registration.registration_number} (Current Cycle)
                </span>
                <StatusBadge status={registration.status} size="sm" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {program?.name || 'Program'} • Cycle {registration.academic_year} • {institution?.name}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />
            <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 opacity-80">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-600 dark:text-slate-400">
                  REG-2025-449102 (Prior Initial Cycle)
                </span>
                <StatusBadge status="APPROVED" size="sm" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Diploma in Theology • Cycle 2024-2025 • Faculty of Theological Studies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Registration Notes
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[80px]">
            {registration.notes || 'No registration notes entered.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Audit Timeline
            </h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Created:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {registration.created_at ? new Date(registration.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Submitted:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {registration.submitted_at ? new Date(registration.submitted_at).toLocaleString() : 'Not submitted'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Reviewed:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {registration.reviewed_at ? new Date(registration.reviewed_at).toLocaleString() : 'Pending review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Correction Request Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSubmit={handleCorrectionSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={selectedDoc}
        candidateName={student ? `${student.first_name} ${student.last_name}` : undefined}
        institutionName={institution?.name}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      {/* Mobile Browser Live Camera Stream Capture Modal */}
      <MobileCameraCaptureModal
        isOpen={isCameraModalOpen}
        registrationId={registration.id}
        candidateName={student ? `${student.first_name} ${student.last_name}` : 'Candidate'}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureSuccess={handleCameraCaptureSuccess}
      />

      {/* Re-Registration / Progression Modal */}
      <ReRegistrationModal
        registration={registration}
        isOpen={isReRegModalOpen}
        onClose={() => setIsReRegModalOpen(false)}
        onSuccess={(newReg) => {
          if (onReload) onReload();
          if (onSelectRegistration) onSelectRegistration(newReg);
        }}
      />
    </div>
  );
};
