'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardMetrics, Registration, WorkflowStatus } from '@/lib/types';
import { createAuditLog } from '@/lib/api/supabase-service';
// Status updates go through BFF route — actor resolved server-side from session cookie

async function bffUpdateStatus(id: string, status: string, notes?: string): Promise<void> {
  const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update status');
  }
}
import { CreateRegistrarModal } from '../admin/CreateRegistrarModal';
import { AssignDashboardNoticeModal } from '../admin/AssignDashboardNoticeModal';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  Clock,
  Landmark,
  FileCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Users,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Send,
  MessageSquare,
  Sparkles,
  Search,
  Check,
  X,
  FileText,
  Building,
  GraduationCap,
  Scale,
  QrCode,
  ShieldCheck,
  Loader2,
  Bell,
  ArrowRight,
} from 'lucide-react';

function getInitials(first?: string, last?: string): string {
  const f = first?.[0] || '';
  const l = last?.[0] || '';
  return (f + l).toUpperCase() || 'ST';
}

interface AdministratorDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
  onViewAllRegistrations?: () => void;
  searchQuery?: string;
}

export const AdministratorDashboard: React.FC<AdministratorDashboardProps> = ({
  metrics,
  registrations,
  onSelectRegistration,
  onViewAllRegistrations,
  searchQuery = '',
}) => {
  const router = useRouter();


  // Modals & Action States
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ping / Reminder Modal State
  const [pingModal, setPingModal] = useState<{
    open: boolean;
    candidateName: string;
    regNum: string;
    institution: string;
    deficiency: string;
    recipient: string;
  } | null>(null);
  const [pingSending, setPingSending] = useState(false);

  // Flag Correction Modal State
  const [flagModal, setFlagModal] = useState<{
    open: boolean;
    registration: Registration;
    reason: string;
  } | null>(null);
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // Direct Approve Confirmation State
  const [approveConfirmReg, setApproveConfirmReg] = useState<Registration | null>(null);
  const [approvingSingle, setApprovingSingle] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Active Filter Tab & Queue Pagination State
  const [activeTab, setActiveTab] = useState<'ALL' | 'RESUBMISSIONS' | 'DOCTORAL'>('ALL');
  const [queuePage, setQueuePage] = useState(1);
  const ITEMS_PER_PAGE = 2;

  const handleTabChange = (tab: 'ALL' | 'RESUBMISSIONS' | 'DOCTORAL') => {
    setActiveTab(tab);
    setQueuePage(1);
  };

  // Dynamic filter queues from registrations prop
  const pendingDossiers = useMemo(() => {
    return registrations.filter(
      (r) =>
        r.status === 'SUBMITTED' ||
        r.status === 'RESUBMITTED' ||
        r.status === 'UNDER_REVIEW'
    );
  }, [registrations]);

  const resubmissionDossiers = useMemo(() => {
    return pendingDossiers.filter((r) => r.status === 'RESUBMITTED');
  }, [pendingDossiers]);

  const doctoralDossiers = useMemo(() => {
    return pendingDossiers.filter((r) => {
      const progCode = (r.program?.code || '').toUpperCase();
      const progName = (r.program?.name || '').toLowerCase();
      return (
        progCode.includes('PHD') ||
        progCode.includes('MTH') ||
        progCode.includes('DMIN') ||
        progName.includes('doctor') ||
        progName.includes('master') ||
        progName.includes('m.th') ||
        progName.includes('ph.d')
      );
    });
  }, [pendingDossiers]);

  const attentionRequiredDossiers = useMemo(() => {
    return registrations.filter((r) => r.status === 'CORRECTION_REQUIRED');
  }, [registrations]);

  const filteredPendingDossiers = useMemo(() => {
    if (activeTab === 'RESUBMISSIONS') return resubmissionDossiers;
    if (activeTab === 'DOCTORAL') return doctoralDossiers;
    return pendingDossiers;
  }, [activeTab, resubmissionDossiers, doctoralDossiers, pendingDossiers]);

  const totalQueuePages = useMemo(() => {
    return Math.ceil(filteredPendingDossiers.length / ITEMS_PER_PAGE) || 1;
  }, [filteredPendingDossiers.length]);

  const displayedPendingDossiers = useMemo(() => {
    const startIndex = (queuePage - 1) * ITEMS_PER_PAGE;
    return filteredPendingDossiers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPendingDossiers, queuePage]);

  // Direct Approve Handler
  const handleDirectApprove = async (reg: Registration) => {
    setApprovingSingle(true);
    try {
      await bffUpdateStatus(
        reg.id,
        'APPROVED',
        'Direct accreditation approval verified by Executive Secretariat.'
      );
      await createAuditLog({
        action: 'DOSSIER_APPROVED',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'Chief Academic Administrator / Council Director',
        entity_type: 'REGISTRATION',
        entity_id: reg.registration_number,
        target_name: reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : reg.registration_number,
        target_ref: `Reg #${reg.registration_number}`,
        target_program: reg.program?.name || 'Theological Degree',
        mutation_from: reg.status,
        mutation_to: 'APPROVED',
        details: 'Candidate dossier direct approved under Executive Council live quorum authority.',
      });
      showToast(`Dossier #${reg.registration_number} cleared and approved successfully.`);
      setApproveConfirmReg(null);
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`);
    } finally {
      setApprovingSingle(false);
    }
  };

  // Batch Approve Handler
  const handleBatchApprove = async () => {
    setBatchLoading(true);
    try {
      const candidatesToApprove = displayedPendingDossiers;
      for (const reg of candidatesToApprove) {
        await bffUpdateStatus(
          reg.id,
          'APPROVED',
          'Batch approved under live quorum governance protocol.'
        );
        await createAuditLog({
          action: 'DOSSIER_APPROVED',
          actor_name: 'Dr. Grace Chen',
          actor_role: 'Chief Academic Administrator / Council Director',
          entity_type: 'REGISTRATION',
          entity_id: reg.registration_number,
          target_name: reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : reg.registration_number,
          target_ref: `Reg #${reg.registration_number}`,
          target_program: reg.program?.name || 'Theological Degree',
          mutation_from: reg.status,
          mutation_to: 'APPROVED',
          details: 'Candidate dossier batch approved during Executive Council session.',
        });
      }
      showToast(`Successfully batch approved ${candidatesToApprove.length} candidate dossiers.`);
      setBatchModalOpen(false);
    } catch (err: any) {
      showToast(`Batch approval failed: ${err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  // Flag Correction Handler
  const handleFlagCorrectionSubmit = async () => {
    if (!flagModal?.registration) return;
    setFlagSubmitting(true);
    try {
      const reg = flagModal.registration;
      const note = flagModal.reason || 'Dossier flagged for institutional correction awaiting registrar resolution.';
      await bffUpdateStatus(reg.id, 'CORRECTION_REQUIRED', note);
      await createAuditLog({
        action: 'CORRECTION_REQUESTED',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'Chief Academic Administrator / Council Director',
        entity_type: 'REGISTRATION',
        entity_id: reg.registration_number,
        target_name: reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : reg.registration_number,
        target_ref: `Reg #${reg.registration_number}`,
        target_program: reg.program?.name || 'Theological Degree',
        mutation_from: reg.status,
        mutation_to: 'CORRECTION_REQUIRED',
        details: note,
      });
      showToast(`Dossier #${reg.registration_number} flagged for correction. Institutional notification dispatched.`);
      setFlagModal(null);
    } catch (err: any) {
      showToast(`Flagging failed: ${err.message}`);
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Ping Registrar Dispatch Handler
  const handleSendPing = async () => {
    if (!pingModal) return;
    setPingSending(true);
    setTimeout(async () => {
      await createAuditLog({
        action: 'REGISTRAR_PING',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'Chief Academic Administrator / Council Director',
        entity_type: 'REGISTRATION',
        entity_id: pingModal.regNum,
        target_name: pingModal.candidateName,
        target_ref: `Reg #${pingModal.regNum}`,
        target_program: 'Theological Degree',
        details: `Dispatched urgent reminder to ${pingModal.recipient} regarding deficiency: ${pingModal.deficiency}`,
      });
      setPingSending(false);
      showToast(`Urgent dispatch sent to ${pingModal.recipient} (${pingModal.institution}).`);
      setPingModal(null);
    }, 600);
  };

  // Download Regional Audit Spreadsheet (.xlsx)
  const handleDownloadAuditXlsx = () => {
    const queueData = registrations.map((r) => ({
      'Registration Number': r.registration_number,
      'Student Name': r.student ? `${r.student.first_name} ${r.student.last_name}` : 'N/A',
      'Institution': r.institution?.name || 'N/A',
      'Program': r.program?.name || 'N/A',
      'Status': r.status,
      'Academic Year': r.academic_year || '2026-2027',
      'Notes': r.notes || '',
      'Updated At': r.updated_at || r.created_at,
    }));

    const regionalData = [
      {
        'Regional Hub': 'South Asia Hub',
        'Jurisdiction': 'India, Sri Lanka, Nepal',
        'Total Candidates': 840,
        'Quota Allocation': '67%',
        'Approved Seminaries': 92,
        'Max Ceiling': 1250,
      },
      {
        'Regional Hub': 'Southeast Asia Hub',
        'Jurisdiction': 'Philippines, Indonesia, Singapore, Thailand',
        'Total Candidates': 310,
        'Quota Allocation': '78%',
        'Approved Seminaries': 34,
        'Max Ceiling': 400,
      },
      {
        'Regional Hub': 'East Asia Hub',
        'Jurisdiction': 'Korea, Japan, Taiwan, Hong Kong',
        'Total Candidates': 180,
        'Quota Allocation': '82%',
        'Approved Seminaries': 16,
        'Max Ceiling': 220,
      },
    ];

    const distributionData = [
      { 'Degree Level': 'Master of Divinity (M.Div)', 'Share': '54%', 'Candidate Count': 718 },
      { 'Degree Level': 'Master of Theology (M.Th)', 'Share': '24%', 'Candidate Count': 319 },
      { 'Degree Level': 'Bachelor of Theology (B.Th)', 'Share': '14%', 'Candidate Count': 186 },
      { 'Degree Level': 'Doctor of Philosophy (Ph.D)', 'Share': '8%', 'Candidate Count': 107 },
    ];

    const wb = XLSX.utils.book_new();
    const wsQueue = XLSX.utils.json_to_sheet(queueData);
    const wsRegional = XLSX.utils.json_to_sheet(regionalData);
    const wsDistribution = XLSX.utils.json_to_sheet(distributionData);

    XLSX.utils.book_append_sheet(wb, wsQueue, 'Candidate Verification Queue');
    XLSX.utils.book_append_sheet(wb, wsRegional, 'Regional Hubs & Quotas');
    XLSX.utils.book_append_sheet(wb, wsDistribution, 'Accreditation Distribution');

    XLSX.writeFile(wb, 'ATA_Executive_Regional_Audit_AY2026-2027.xlsx');
    showToast('Executive Regional Audit (.xlsx) generated and downloaded.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="h-4 w-4 text-[#2dd4bf] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}



      {/* Title & Action Buttons Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Executive Governance Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Download Regional Audit (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadAuditXlsx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#006f67]" />
            <span>Regional Audit (.xlsx)</span>
          </button>

          {/* Assign / Manage Dashboard Notice */}
          <button
            type="button"
            onClick={() => setIsNoticeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[#006f67] hover:bg-teal-100/70 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileCheck className="h-3.5 w-3.5 text-[#006f67]" />
            <span>Notice &amp; Checklist</span>
          </button>

          {/* Batch Approve Verified Queue */}
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Batch Approve Queue</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Review Queue Pending */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              REVIEW QUEUE PENDING
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              42
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Initial &amp; resubmitted dossiers
            </div>
          </div>
        </div>

        {/* Card 2: Flagged For Review */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              FLAGGED FOR REVIEW
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              19
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Requires attention
            </div>
          </div>
        </div>

        {/* Card 3: Accreditation Pass Rate */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ACCREDITATION PASS RATE
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              94.2%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Cleared candidates
            </div>
          </div>
        </div>

        {/* Card 4: Active Seminaries */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ACTIVE SEMINARIES
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              142
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Across all institutions
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: High-Priority Review Queue */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header with Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    High-Priority Review Queue
                  </h2>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleTabChange('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  All Pending ({pendingDossiers.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('RESUBMISSIONS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'RESUBMISSIONS'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Resubmissions ({resubmissionDossiers.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('DOCTORAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'DOCTORAL'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Doctoral/M.Th ({doctoralDossiers.length})
                </button>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4">
              {displayedPendingDossiers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No pending dossiers found in this category.</p>
                </div>
              ) : (
                displayedPendingDossiers.map((reg) => {
                  const stu = reg.student;
                  const candidateName = stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate';
                  const initials = getInitials(stu?.first_name, stu?.last_name);
                  const instName = reg.institution?.name || 'Accredited Seminary';
                  const progName = reg.program?.name || 'Academic Degree';
                  const status = reg.status;
                  const isResubmitted = status === 'RESUBMITTED';
                  const isUnderReview = status === 'UNDER_REVIEW';

                  return (
                    <div
                      key={reg.id}
                      className="group relative p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-teal-200/80 hover:shadow-md transition-all duration-200 space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white">
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 leading-none">
                                {candidateName}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold tracking-tight ${isResubmitted
                                  ? 'bg-[#99efe5] text-[#006f67]'
                                  : isUnderReview
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-700'
                                  }`}
                              >
                                ● {status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                              <span className="font-mono font-bold text-[#006f67]">{reg.registration_number}</span> • {progName}
                            </p>

                            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 font-medium">
                              <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{instName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                            {reg.academic_year || 'AY 2026–2027'}
                          </span>

                          {/* Neat Notes Badge & Popover */}
                          {reg.notes && (
                            <div className="relative group/note">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#006f67] border border-teal-100 text-[10.5px] font-bold cursor-help transition-colors hover:bg-teal-100">
                                <FileText className="h-3 w-3" />
                                <span>Notes</span>
                              </span>

                              {/* Hover Tooltip Popover */}
                              <div className="opacity-0 group-hover/note:opacity-100 pointer-events-none group-hover/note:pointer-events-auto transition-all duration-150 transform -translate-y-1 group-hover/note:translate-y-0 absolute right-0 top-full mt-1.5 z-30 w-72 p-3 rounded-xl bg-white border border-slate-200 shadow-xl space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                                  <FileText className="h-3.5 w-3.5 text-[#006f67]" />
                                  <span>Dossier Verification Notes</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed pt-1 text-[11.5px]">
                                  {reg.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span>UID: <strong className="font-mono text-slate-700">{stu?.permanent_uid || 'N/A'}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectRegistration(reg)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          >
                            Review Dossier
                          </button>

                          <button
                            type="button"
                            onClick={() => setApproveConfirmReg(reg)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#006f67] hover:bg-[#005852] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Direct Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls Footer */}
            {filteredPendingDossiers.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing <strong className="text-slate-800 font-semibold">{Math.min((queuePage - 1) * ITEMS_PER_PAGE + 1, filteredPendingDossiers.length)}–{Math.min(queuePage * ITEMS_PER_PAGE, filteredPendingDossiers.length)}</strong> of <strong className="text-slate-800 font-semibold">{filteredPendingDossiers.length}</strong> dossiers
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={queuePage === 1}
                    onClick={() => setQueuePage((prev) => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="font-semibold text-slate-700">
                    {queuePage} / {totalQueuePages}
                  </span>

                  <button
                    type="button"
                    disabled={queuePage >= totalQueuePages}
                    onClick={() => setQueuePage((prev) => Math.min(prev + 1, totalQueuePages))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Regional Enrollment & Institutional Quotas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Regional Enrollment &amp; Institutional Quotas
                </h2>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#99efe5] text-[#006f67] text-xs font-extrabold tracking-tight self-start sm:self-auto">
                1,330 Total Intake
              </span>
            </div>

            {/* Regional Hubs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { id: 'south-asia', name: 'South Asia Hub', candidates: 840, quotaPct: 67, seminaries: 92, color: '#006f67' },
                { id: 'se-asia', name: 'SE Asia Hub', candidates: 310, quotaPct: 78, seminaries: 34, color: '#0d9488' },
                { id: 'east-asia', name: 'East Asia Hub', candidates: 180, quotaPct: 82, seminaries: 16, color: '#2563eb' },
              ].map((hub) => (
                <div key={hub.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-xs gap-1">
                    <span className="font-bold text-slate-900 truncate">{hub.name}</span>
                    <span className="font-extrabold text-xs shrink-0" style={{ color: hub.color }}>{hub.quotaPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${hub.quotaPct}%`, backgroundColor: hub.color }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium gap-1">
                    <span className="whitespace-nowrap">{hub.candidates} candidates</span>
                    <span className="whitespace-nowrap">{hub.seminaries} Seminaries</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (4 cols): Attention Required + Controlled Unlock + Registrar Pulse */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Attention Required */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                  Attention Required
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10.5px] font-semibold shrink-0 whitespace-nowrap">
                &gt; 7 Days Idle
              </span>
            </div>

            {/* Attention Required Items */}
            {attentionRequiredDossiers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1 font-medium">
                No dossiers currently flagged for attention.
              </p>
            ) : (
              attentionRequiredDossiers.map((reg) => {
                const stu = reg.student;
                const candidateName = stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate';
                const instName = reg.institution?.name || 'Accredited Seminary';
                const deficiency = reg.notes || 'Institutional correction requested.';

                return (
                  <div key={reg.id} className="pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{candidateName}</h4>
                      <span className="font-mono text-[11px] font-bold text-[#006f67] shrink-0">
                        {reg.registration_number}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-snug line-clamp-2 bg-rose-50/50 p-2 rounded-lg border border-rose-100/60">
                      <span className="font-bold text-rose-700">Deficiency:</span> {deficiency}
                    </p>

                    <div className="flex items-center justify-between pt-0.5 gap-2">
                      <span className="text-[11px] text-slate-400 font-medium truncate min-w-0" title={instName}>
                        {instName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPingModal({
                            open: true,
                            candidateName,
                            regNum: reg.registration_number,
                            institution: instName,
                            deficiency,
                            recipient: 'Registrar Office',
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-teal-200/80 bg-teal-50/60 hover:bg-teal-100/70 text-[#006f67] text-[11.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Ping Registrar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Card 2: Controlled Unlock Protocol */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                Controlled Unlock Protocol
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Executive Override</span>
                <span className="text-slate-400 text-[10.5px] font-medium">Feb 28</span>
              </div>
              <p className="text-[11.5px] text-slate-600 truncate">
                <span className="font-semibold text-slate-700">Authorizer:</span> Dr. Grace Chen
              </p>
              <p className="text-[11.5px] text-slate-600 truncate">
                <span className="font-semibold text-slate-700">Reason:</span> Title correction
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/audit-logs')}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="h-3.5 w-3.5 text-[#006f67]" />
              <span>Inspect Unlock Log</span>
            </button>
          </div>

          {/* Card 3: Registrar Operations Pulse */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                  Registrar Operations Pulse
                </h3>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registrars
                </span>
                <span className="text-xl font-black text-slate-900 tracking-tight block my-0.5">
                  184
                </span>
                <span className="text-[10.5px] text-slate-500 font-medium truncate block">
                  142 institutes
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Verifications
                </span>
                <span className="text-xl font-black text-[#006f67] tracking-tight block my-0.5">
                  3 New
                </span>
                <span className="text-[10.5px] text-slate-500 font-medium truncate block">
                  Pending proof
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRegistrarModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-[#006f67] hover:bg-[#005852] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 text-white" />
              <span>Manage Registrars</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Approve Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Batch Approve Verified Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live Quorum Executive Clearance Authority
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to clear and officially approve the following verified dossiers under <strong>ATA Accreditation Commission Quorum</strong>:
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
              {displayedPendingDossiers.map((reg) => (
                <div key={reg.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">
                      {reg.student?.first_name} {reg.student?.last_name}
                    </span>
                    <span className="text-slate-400 ml-2 font-mono text-[11px]">
                      #{reg.registration_number}
                    </span>
                    <p className="text-[11px] text-slate-500">{reg.institution?.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Approval generates immutable cryptographic hash entries into the official Governance Audit Log.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                disabled={batchLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={batchLoading}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {batchLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authorizing Clearance...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Approve All Verified Dossiers</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Single Approve Confirmation Modal */}
      {approveConfirmReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Direct Approval
              </h3>
              <button
                onClick={() => setApproveConfirmReg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm official ATA accreditation approval for candidate{' '}
              <strong>
                {approveConfirmReg.student?.first_name} {approveConfirmReg.student?.last_name}
              </strong>{' '}
              (Reg #{approveConfirmReg.registration_number}).
            </p>

            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs text-[#006f67]">
              All submitted transcripts and identity attestations have been verified by institutional registrar.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveConfirmReg(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDirectApprove(approveConfirmReg)}
                disabled={approvingSingle}
                className="px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005852] text-white text-xs font-bold flex items-center gap-1.5"
              >
                {approvingSingle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 stroke-[3]" />
                )}
                <span>Authorize Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Correction Modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Flag Dossier for Correction
                </h3>
              </div>
              <button
                onClick={() => setFlagModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Candidate: <strong>{flagModal.registration.student?.first_name} {flagModal.registration.student?.last_name}</strong>
              </p>
              <p>
                Reg: <span className="font-mono">{flagModal.registration.registration_number}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Deficiency / Correction Instructions
              </label>
              <textarea
                value={flagModal.reason}
                onChange={(e) => setFlagModal({ ...flagModal, reason: e.target.value })}
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder="Specify precise missing document or accreditation deficiency..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFlagModal(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlagCorrectionSubmit}
                disabled={flagSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {flagSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>Dispatch Flag Notification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ping Registrar Modal */}
      {pingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Secretariat Registrar Notice
                </h3>
              </div>
              <button
                onClick={() => setPingModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-200/80">
              <p><strong>Candidate:</strong> {pingModal.candidateName} (#{pingModal.regNum})</p>
              <p><strong>Seminary:</strong> {pingModal.institution}</p>
              <p><strong>Addressee:</strong> {pingModal.recipient}</p>
              <p className="text-rose-700 pt-1"><strong>Outstanding Deficiency:</strong> {pingModal.deficiency}</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This will trigger an expedited electronic dispatch from the Executive Secretariat directing the institution to clear the pending defect.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPingModal(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPing}
                disabled={pingSending}
                className="px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005852] text-white text-xs font-bold flex items-center gap-1.5"
              >
                {pingSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Expedited Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Registrar Modal */}
      <CreateRegistrarModal
        isOpen={isRegistrarModalOpen}
        onClose={() => setIsRegistrarModalOpen(false)}
      />

      {/* Assign Dashboard Notice Modal */}
      {isNoticeModalOpen && (
        <AssignDashboardNoticeModal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          onSuccess={(notice) => {
            showToast(`Assigned notice "${notice.title}" to ${notice.recipient_role}.`);
          }}
        />
      )}
    </div>
  );
};
