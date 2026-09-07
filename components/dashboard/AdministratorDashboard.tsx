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

  // Active Tab for High-Priority Review Queue
  const [activeTab, setActiveTab] = useState<'ALL' | 'RESUBMISSIONS' | 'DOCTORAL'>('ALL');

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

  const displayedPendingDossiers = useMemo(() => {
    if (activeTab === 'RESUBMISSIONS') return resubmissionDossiers;
    if (activeTab === 'DOCTORAL') return doctoralDossiers;
    return pendingDossiers;
  }, [activeTab, resubmissionDossiers, doctoralDossiers, pendingDossiers]);

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

      {/* Top Sub-Bar: Breadcrumbs & Live Quorum Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-700">ATA Secretariat HQ</span>
          <span>›</span>
          <span className="font-medium text-slate-600">Academic Governance & Accreditation Board</span>
          <span>›</span>
          <span className="font-bold text-slate-900">Executive Overview</span>
        </div>

        {/* Live Session Pills */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/90 text-[#006f67] border border-teal-200/60 text-[11px] font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#006f67] animate-pulse" />
            <span>AY 2026–2027 ACTIVE CYCLE</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/90 text-[#006f67] border border-teal-200/60 text-[11px] font-bold shadow-2xs">
            <Landmark className="h-3.5 w-3.5 text-[#006f67]" />
            <span>Accreditation Commission Live Quorum</span>
          </div>
        </div>
      </div>

      {/* Title & Action Buttons Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Executive Governance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
            Regional quality assurance, candidate dossier verification queue, institutional enrollment analytics, and registrar credential oversight.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Download Regional Audit (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadAuditXlsx}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold shadow-2xs transition-all active:scale-98"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#006f67]" />
            <span>Download Regional Audit (.xlsx)</span>
          </button>

          {/* Assign / Manage Dashboard Notice */}
          <button
            type="button"
            onClick={() => setIsNoticeModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-50 border border-teal-200/90 text-[#006f67] hover:bg-teal-100/70 text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-[#006f67]" />
            <span>Dashboard Notice & Checklist</span>
          </button>

          {/* Batch Approve Verified Queue */}
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all active:scale-98"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            <span>Batch Approve Verified Queue</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Review Queue Pending */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Review Queue Pending
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#99efe5]/70 text-[#006f67] text-[11px] font-bold tracking-tight">
              ~+14 this week
            </span>
          </div>
          <div className="my-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              42
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>28 Initial Dossiers</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-[#006f67]">14 Resubmissions</span>
          </div>
        </div>

        {/* Card 2: Correction Required / Flagged */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Correction Required / Flagged
            </span>
            <div className="h-7 w-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">
              19
            </span>
          </div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 truncate">
            <strong className="text-rose-600 font-bold">6 dossiers</strong> &gt; 7 days awaiting registrar reply
          </div>
        </div>

        {/* Card 3: Accreditation Pass Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Accreditation Pass Rate
            </span>
            <div className="h-7 w-7 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              94.2%
            </span>
            <span className="text-xs font-extrabold text-[#006f67]">
              +2.1% YoY
            </span>
          </div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 truncate">
            1,248 student dossiers cleared across 142 seminaries
          </div>
        </div>

        {/* Card 4: Active Registered Seminaries (Dark Card) */}
        <div className="p-5 rounded-2xl bg-[#0f172a] text-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Active Registered Seminaries
            </span>
            <div className="h-7 w-7 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center border border-slate-700">
              <Landmark className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                142
              </span>
              <span className="text-slate-400 font-medium text-lg">/ 150</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-[#2dd4bf] h-full rounded-full w-[94.6%]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
            <span>94.6% Affiliate Quota</span>
            <span className="text-teal-300 font-semibold">8 Reviews Due Q3</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): High-Priority Review Queue + Regional Enrollment Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: High-Priority Review Queue */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header with Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    High-Priority Review Queue
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dossiers awaiting ATA Administrative Secretariat verification
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'ALL'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Pending ({pendingDossiers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('RESUBMISSIONS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'RESUBMISSIONS'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Resubmissions ({resubmissionDossiers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('DOCTORAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'DOCTORAL'
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
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-teal-200/80 hover:shadow-md transition-all duration-200 space-y-3.5"
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
                                className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold tracking-tight ${
                                  isResubmitted
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

                        <span className="text-xs font-semibold text-slate-400 shrink-0 whitespace-nowrap">
                          {reg.academic_year || 'AY 2026–2027'}
                        </span>
                      </div>

                      {/* Dossier Notes Callout Box */}
                      {reg.notes && (
                        <div className="p-3 rounded-xl bg-[#eff4ff] border border-blue-100/70 flex items-start gap-2.5 text-xs text-slate-700">
                          <QrCode className="h-4 w-4 text-[#006f67] shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong>Dossier notes:</strong> {reg.notes}
                          </p>
                        </div>
                      )}

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
          </div>

          {/* Section 2: Regional Enrollment & Institutional Quotas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Regional Enrollment &amp; Institutional Quotas
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated cross-hub matriculation analytics for AY 2026–2027
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#99efe5] text-[#006f67] text-xs font-extrabold tracking-tight self-start sm:self-auto">
                1,330 Total Intake
              </span>
            </div>

            {/* Hub 1: South Asia Hub */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-900">
                  South Asia Hub <span className="font-normal text-slate-500">(India, Sri Lanka, Nepal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">840 candidates</span>
                  <span className="font-extrabold text-[#006f67]">67% Quota</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#006f67] h-full rounded-full w-[67%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>92 Approved Seminaries</span>
                <span>Max Ceiling: 1,250</span>
              </div>
            </div>

            {/* Hub 2: Southeast Asia Hub */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-900">
                  Southeast Asia Hub <span className="font-normal text-slate-500">(Philippines, Indonesia, Singapore, Thailand)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">310 candidates</span>
                  <span className="font-extrabold text-[#0d9488]">78% Quota</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0d9488] h-full rounded-full w-[78%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>34 Approved Seminaries</span>
                <span>Max Ceiling: 400</span>
              </div>
            </div>

            {/* Hub 3: East Asia Hub */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-900">
                  East Asia Hub <span className="font-normal text-slate-500">(Korea, Japan, Taiwan, Hong Kong)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">180 candidates</span>
                  <span className="font-extrabold text-blue-600">82% Quota</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-[82%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>16 Approved Seminaries</span>
                <span>Max Ceiling: 220</span>
              </div>
            </div>

            {/* ACCREDITATION LEVEL DISTRIBUTION */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Accreditation Level Distribution
              </span>

              {/* Stacked segmented bar */}
              <div className="w-full h-3 rounded-full flex overflow-hidden">
                <div className="bg-slate-900 h-full w-[54%]" title="M.Div (54%)" />
                <div className="bg-[#006f67] h-full w-[24%]" title="M.Th (24%)" />
                <div className="bg-[#38bdf8] h-full w-[14%]" title="B.Th (14%)" />
                <div className="bg-slate-700 h-full w-[8%]" title="Ph.D (8%)" />
              </div>

              {/* Legend row */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                  <span>M.Div (54%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#006f67]" />
                  <span>M.Th (24%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" />
                  <span>B.Th (14%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span>Ph.D (8%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Attention Required + Controlled Unlock + Registrar Pulse */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Attention Required */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Attention Required
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                &gt; 7 Days Idle
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Dossiers flagged for institutional correction awaiting registrar resolution before session cutoff.
            </p>

            {/* Attention Required Items */}
            {attentionRequiredDossiers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No dossiers currently flagged for institutional correction.
              </p>
            ) : (
              attentionRequiredDossiers.map((reg) => {
                const stu = reg.student;
                const candidateName = stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate';
                const instName = reg.institution?.name || 'Accredited Seminary';
                const deficiency = reg.notes || 'Institutional correction requested before council signoff.';

                return (
                  <div key={reg.id} className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{candidateName}</h4>
                        <p className="text-[11px] text-slate-500 font-medium font-mono">
                          <span className="text-[#006f67] font-bold">{reg.registration_number}</span> • {instName}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-rose-600 shrink-0">
                        Correction Req.
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-700 font-medium leading-relaxed">
                      <strong>Deficiency:</strong> {deficiency}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        UID: <strong className="font-mono text-slate-700">{stu?.permanent_uid || 'N/A'}</strong>
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
                        className="px-2.5 py-1 rounded-lg border border-teal-200 text-[#006f67] hover:bg-teal-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Controlled Unlock Protocol
              </h3>
            </div>

            {/* Policy Info Notice */}
            <div className="p-3 rounded-xl bg-[#eff4ff] border border-blue-100/70 flex items-start gap-2.5 text-xs text-slate-700">
              <ShieldAlert className="h-4 w-4 text-[#006f67] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Under <strong>ATA Accreditation Bylaws Art 14 §2</strong>, modifying approved dossiers requires recorded executive justification and cryptographic hash stamping.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                Recent Executive Override
              </span>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Controlled Unlock Protocol Active</span>
                  <span className="text-slate-500 font-medium">Feb 28, 2026</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong>Authorizer:</strong> Dr. Grace Chen (Council Director)
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Reason:</strong> M.Th thesis title typographical correction{' '}
                  <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                    (Hash: #9f0c2e1b)
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/audit-logs')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <FileCheck className="h-4 w-4 text-[#006f67]" />
              <span>Inspect Controlled Unlock Log</span>
            </button>
          </div>

          {/* Card 3: Registrar Operations Pulse */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Registrar Operations Pulse
                </h3>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Registrars
                </span>
                <span className="text-2xl font-black text-slate-900 block my-1">
                  184
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Across 142 institutes
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Key Verifications
                </span>
                <span className="text-2xl font-black text-[#006f67] block my-1">
                  3 New
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Pending signature proof
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRegistrarModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4 text-[#006f67]" />
              <span>Manage &amp; Provision Registrars</span>
              <ArrowRight className="h-3.5 w-3.5" />
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
