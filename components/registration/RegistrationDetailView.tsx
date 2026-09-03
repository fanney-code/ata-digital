import React, { useState } from 'react';
import { Registration, UserRole, WorkflowStatus } from '@/lib/types';
import { StatusBadge } from '../dashboard/StatusBadge';
import { CorrectionModal } from './CorrectionModal';
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
} from 'lucide-react';

interface RegistrationDetailViewProps {
  registration: Registration;
  currentRole: UserRole;
  onBack: () => void;
  onUpdateStatus: (id: string, status: WorkflowStatus, notes?: string) => Promise<void>;
  onEditDraft?: (reg: Registration) => void;
}

export const RegistrationDetailView: React.FC<RegistrationDetailViewProps> = ({
  registration,
  currentRole,
  onBack,
  onUpdateStatus,
  onEditDraft,
}) => {
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [showResubmitBox, setShowResubmitBox] = useState(false);

  const student = registration.student;
  const institution = registration.institution;
  const department = registration.department;
  const program = registration.program;

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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Registration Record
          </span>
          <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {registration.registration_number}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Type: <span className="font-semibold text-slate-700 dark:text-slate-300">{registration.registration_type.replace(/_/g, ' ')}</span> | Academic Cycle: <span className="font-mono font-semibold">{registration.academic_year}</span>
          </p>
        </div>

        {/* Action Controls Container */}
        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
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

      {/* Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSubmit={handleCorrectionSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
