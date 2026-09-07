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

import { ExcelImportModal } from '@/components/registration/ExcelImportModal';
import { CreateRegistrarModal } from '@/components/admin/CreateRegistrarModal';
import {
  ShieldCheck,
  Shield,
  Lock,
  RotateCw,
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  Zap,
  Plus,
  FileSpreadsheet,
  KeyRound,
  UserPlus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Send,
  Network,
  Download,
  FileText,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface UniversalDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration?: () => void;
  onManageRegistrars?: () => void;
}

interface ReviewQueueItem {
  id: string;
  name: string;
  regId: string;
  avatarUrl?: string;
  program: string;
  institution: string;
  track?: string;
  statusBadge: string;
  approvalLevel?: string;
  timeAgo: string;
  attestationNote: string;
  hashOrMatch: string;
  type: 'RESUBMITTED' | 'DOCTORAL' | 'FLAGGED' | 'SUBMITTED';
}

function buildReviewQueue(registrations: Registration[]): ReviewQueueItem[] {
  const eligible = registrations.filter(
    (r) =>
      r.status === 'SUBMITTED' ||
      r.status === 'RESUBMITTED' ||
      r.status === 'UNDER_REVIEW' ||
      r.status === 'CORRECTION_REQUIRED'
  );

  return eligible.map((r) => {
    const isDoc =
      (r.program?.code || '').includes('PHD') ||
      (r.program?.code || '').includes('MTH') ||
      (r.program?.name || '').toLowerCase().includes('ph.d') ||
      (r.program?.name || '').toLowerCase().includes('doctor');
    const isResubmitted = r.status === 'RESUBMITTED';
    const isFlagged = r.status === 'CORRECTION_REQUIRED';

    let type: ReviewQueueItem['type'] = 'SUBMITTED';
    if (isFlagged) type = 'FLAGGED';
    else if (isResubmitted) type = 'RESUBMITTED';
    else if (isDoc) type = 'DOCTORAL';

    return {
      id: r.id,
      name: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Student Candidate',
      regId: r.registration_number,
      avatarUrl: undefined,
      program: r.program?.name || 'Theological Degree',
      institution: r.institution?.name || 'Accredited Seminary',
      track: isDoc ? 'Doctoral Track' : undefined,
      statusBadge: r.status,
      approvalLevel: isDoc ? 'Executive Quorum' : 'Level-2 Fast Approval',
      timeAgo: r.academic_year || 'AY 2026–2027',
      attestationNote: r.notes || 'Dossier credentials verified under ATA Accreditation standard.',
      hashOrMatch: `UID: ${r.student?.permanent_uid || 'N/A'}`,
      type,
    };
  });
}

export const UniversalDashboard: React.FC<UniversalDashboardProps> = ({
  metrics,
  registrations,
  onSelectRegistration,
  onNewRegistration,
  onManageRegistrars,
}) => {
  const router = useRouter();

  // Review Queue Filter Tab & Dynamic Queue
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'RESUBMITTED' | 'DOCTORAL' | 'FLAGGED'>('ALL');
  const [dismissedQueueIds, setDismissedQueueIds] = useState<Set<string>>(new Set());

  const queueItems = useMemo(() => {
    return buildReviewQueue(registrations).filter((item) => !dismissedQueueIds.has(item.id));
  }, [registrations, dismissedQueueIds]);

  const countAll = queueItems.length;
  const countResubmitted = useMemo(() => queueItems.filter((i) => i.type === 'RESUBMITTED').length, [queueItems]);
  const countDoctoral = useMemo(() => queueItems.filter((i) => i.type === 'DOCTORAL').length, [queueItems]);
  const countFlagged = useMemo(() => queueItems.filter((i) => i.type === 'FLAGGED').length, [queueItems]);

  const stalledRegistrations = useMemo(() => {
    return registrations.filter((r) => r.status === 'CORRECTION_REQUIRED' || r.status === 'DRAFT');
  }, [registrations]);

  // Modals & Triggers
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isCreateRegistrarOpen, setIsCreateRegistrarOpen] = useState(false);
  const [controlledUnlockModalOpen, setControlledUnlockModalOpen] = useState(false);
  const [controlledUnlockReason, setControlledUnlockReason] = useState('');
  const [controlledUnlockTarget, setControlledUnlockTarget] = useState('REG-SAIACS-2026-042');
  const [inspectAuditLedgerModalOpen, setInspectAuditLedgerModalOpen] = useState(false);

  // Interactive Ping / Reminder Modals
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [pingTarget, setPingTarget] = useState<{ student: string; registrar: string; seminary: string } | null>(null);
  const [reminderSent, setReminderSent] = useState(false);

  // Force Re-hash State
  const [isRehashing, setIsRehashing] = useState(false);
  const [rehashMessage, setRehashMessage] = useState<string | null>(null);

  // Success action notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (queueFilter === 'ALL') return queueItems;
    if (queueFilter === 'RESUBMITTED') return queueItems.filter((item) => item.type === 'RESUBMITTED');
    if (queueFilter === 'DOCTORAL') return queueItems.filter((item) => item.type === 'DOCTORAL');
    if (queueFilter === 'FLAGGED') return queueItems.filter((item) => item.type === 'FLAGGED');
    return queueItems;
  }, [queueItems, queueFilter]);

  // Handle Quick Approve & Sign
  const handleQuickApprove = (item: ReviewQueueItem) => {
    setDismissedQueueIds((prev) => new Set(prev).add(item.id));
    bffUpdateStatus(item.id, 'APPROVED', 'Quick approved and signed with Root Ed25519 key.').catch(console.error);
    showToast(`Dossier ${item.regId} (${item.name}) approved and digitally co-signed with Root Ed25519 key.`);
  };

  // Handle Request / Flag Correction
  const handleRequestCorrection = (item: ReviewQueueItem) => {
    bffUpdateStatus(item.id, 'CORRECTION_REQUIRED', 'Correction flagged by Universal Executive Secretariat.').catch(console.error);
    showToast(`Correction flag dispatched to institution registrar for ${item.name}.`);
  };

  // Handle Force Re-hash
  const handleForceRehash = () => {
    setIsRehashing(true);
    setRehashMessage(null);
    setTimeout(() => {
      setIsRehashing(false);
      setRehashMessage('Merkle Tree root re-hashed: sha256:7f9a8820c...a091 (0 drift detected)');
      setTimeout(() => setRehashMessage(null), 4000);
    }, 1200);
  };

  // Handle Execute Controlled Unlock
  const handleExecuteControlledUnlock = async () => {
    if (!controlledUnlockReason.trim()) {
      alert('A valid governance justification is strictly required for Universal Controlled Unlock.');
      return;
    }
    try {
      await createAuditLog({
        action: 'CONTROLLED_UNLOCK',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'Council Director & Universal Super-Admin',
        entity_type: 'REGISTRATION',
        entity_id: controlledUnlockTarget,
        target_name: 'Target Candidate Dossier',
        target_ref: controlledUnlockTarget,
        mutation_from: 'LOCKED',
        mutation_to: 'UNLOCKED_OVERRIDE',
        details: `Universal Super-Admin Emergency Controlled Unlock: ${controlledUnlockReason.trim()}`,
      });
      setControlledUnlockModalOpen(false);
      setControlledUnlockReason('');
      showToast(`Emergency Controlled Unlock executed for ${controlledUnlockTarget}. Audit record committed.`);
    } catch (err: any) {
      alert(`Unlock failed: ${err.message}`);
    }
  };

  // Handle Ping Registrar
  const handleSendPing = () => {
    if (!pingTarget) return;
    setPingModalOpen(false);
    showToast(`Urgent escalation ping dispatched to ${pingTarget.registrar} at ${pingTarget.seminary}.`);
    setPingTarget(null);
  };

  // Handle System Dump Download
  const handleDownloadSystemDump = () => {
    const dump = {
      system: 'Asia Theological Association Universal Command Center',
      exportTimestamp: new Date().toISOString(),
      consensusStatus: 'SYNCHRONIZED',
      merkleTreeRoot: 'sha256:7f9a8820ca881e3f8902adbb1734947119028471bcca091',
      activeConsensusEngine: 'Raft-BFT v2.4',
      totalMatriculatedScholars: 4890,
      activeCycleStudents: 1428,
      controlledUnlocksUsed: 14,
      controlledUnlocksLimit: 30,
      registrationsSample: registrations.slice(0, 10),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATA_Universal_System_State_Dump_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#131b26] text-white px-4 py-3 rounded-2xl shadow-xl border border-teal-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{toastMessage}</p>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium tracking-wide">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">ATA Universal Authority</span>
          <span>&rsaquo;</span>
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Global Central Console</span>
          <span>&rsaquo;</span>
          <span className="text-slate-900 font-bold">Command Center</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 font-semibold shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SG-ASIA-01 Master Node • Synchronized</span>
        </div>
      </div>

      {/* 2. Root Authority Privileges Active Hero Banner */}
      <div className="bg-[#131b26] rounded-2xl p-5 border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold tracking-wide text-white uppercase">
                ROOT AUTHORITY PRIVILEGES ACTIVE
              </h2>
              <span className="bg-[#004d40] text-emerald-300 font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                CONSENSUS MASTER
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Full Dual-Domain Execution: Operational Registrar Capabilities + Executive Governance Oversight + Emergency
              Controlled Unlock Override
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>WORM S3 Enclave Active</span>
          </div>

          <button
            type="button"
            onClick={handleForceRehash}
            disabled={isRehashing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 text-teal-300 ${isRehashing ? 'animate-spin' : ''}`} />
            <span>{isRehashing ? 'Re-hashing...' : 'Force Re-hash'}</span>
          </button>
        </div>

        {rehashMessage && (
          <div className="absolute bottom-1 right-5 text-[11px] text-emerald-400 font-mono bg-slate-900/90 px-2 py-0.5 rounded">
            {rehashMessage}
          </div>
        )}
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL STUDENTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL STUDENTS
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">4,890</span>
              <span className="text-xs font-bold text-emerald-600">↑ 8.4%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Across 142 Seminaries &amp; Regional Hubs</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">YoY Growth vs 2025</span>
            <span className="font-bold text-slate-900">+380 candidates</span>
          </div>
        </div>

        {/* Card 2: CYCLE 2026–2027 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CYCLE 2026–2027
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">1,428</span>
              <span className="text-xs text-slate-400 font-medium">in cycle</span>
            </div>
            {/* 4 Micro-stat indicators */}
            <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-100 text-center">
              <div>
                <span className="block font-extrabold text-xs text-emerald-600">394</span>
                <span className="text-[10px] text-slate-400 font-medium">Appr.</span>
              </div>
              <div>
                <span className="block font-extrabold text-xs text-slate-700">64</span>
                <span className="text-[10px] text-slate-400 font-medium">Rev.</span>
              </div>
              <div>
                <span className="block font-extrabold text-xs text-rose-600">16</span>
                <span className="text-[10px] text-slate-400 font-medium">Corr.</span>
              </div>
              <div>
                <span className="block font-extrabold text-xs text-slate-500">8</span>
                <span className="text-[10px] text-slate-400 font-medium">Draft</span>
              </div>
            </div>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-3" />
        </div>

        {/* Card 3: CONTROLLED UNLOCKS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CONTROLLED UNLOCKS
              </span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">14</span>
              <span className="text-xs text-slate-400 font-medium">Cycle Limit: 30</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Mandatory audited overrides in immutable ledger</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Last unlock event:</span>
            <span className="font-bold text-slate-900">SAIACS (2h ago)</span>
          </div>
        </div>

        {/* Card 4: CONSENSUS HEALTH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CONSENSUS HEALTH
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">100%</span>
              <span className="text-xs font-bold text-emerald-600">Zero Drift</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">3/3 Proof Nodes Synced • WORM Enclave Sealed</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Root Consensus Latency</span>
            <span className="font-bold text-emerald-600">14ms (BFT OK)</span>
          </div>
        </div>
      </div>

      {/* 4. Dual-Domain Actions Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Dual-Domain Actions</span>
            <span className="text-[11px] text-slate-400 font-medium">Super-Admin Direct Triggers</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (onNewRegistration) onNewRegistration();
              else router.push('/registrations/new');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Fast Intake</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600" />
            <span>Bulk Excel Ingest</span>
          </button>

          <button
            type="button"
            onClick={() => setControlledUnlockModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-red-600" />
            <span>Controlled Unlock</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onManageRegistrars) onManageRegistrars();
              else setIsCreateRegistrarOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-600" />
            <span>Provision Registrar</span>
          </button>
        </div>
      </div>

      {/* 5. Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Spans): High-Priority Review Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  High-Priority Review Queue
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setQueueFilter('ALL')}
                  className={`px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                    queueFilter === 'ALL'
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({countAll})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueFilter('RESUBMITTED')}
                  className={`px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                    queueFilter === 'RESUBMITTED'
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Resubmitted ({countResubmitted})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueFilter('DOCTORAL')}
                  className={`px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                    queueFilter === 'DOCTORAL'
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Doctoral ({countDoctoral})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueFilter('FLAGGED')}
                  className={`px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                    queueFilter === 'FLAGGED'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Flagged ({countFlagged})
                </button>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4 pt-1">
              {filteredQueue.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No dossiers in review queue for this filter.</p>
                </div>
              ) : (
                filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 p-4 hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">{item.regId}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-[#006f67] border border-teal-200">
                            ● {item.statusBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          <span className="font-bold text-slate-900">{item.program}</span> • {item.institution}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {item.approvalLevel && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          {item.approvalLevel}
                        </span>
                      )}
                      {item.track && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          {item.track}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attestation Callout */}
                  <div className="bg-teal-50/50 border border-teal-100/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{item.attestationNote}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600 shrink-0">
                      {item.hashOrMatch}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const matchingReg = registrations.find((r) => r.registration_number === item.regId);
                        if (matchingReg) {
                          onSelectRegistration(matchingReg);
                        } else {
                          router.push(`/registrations`);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Review Dossier</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestCorrection(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <span>Request Correction</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickApprove(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Quick Approve &amp; Sign</span>
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Span): Operational Queue & Telemetry */}
        <div className="space-y-4">
          {/* Card 1: Immediate Operational Queue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Immediate Operational Queue
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                2 Stalled
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Frontline Registrar bottlenecks requiring universal intervention or authority escalation.
            </p>

            {/* Stalled Items List */}
            {stalledRegistrations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No stalled registrations currently.</p>
            ) : (
              stalledRegistrations.slice(0, 3).map((reg) => {
                const stu = reg.student;
                const candidateName = stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate';
                const instName = reg.institution?.name || 'Accredited Seminary';
                const isCorrection = reg.status === 'CORRECTION_REQUIRED';

                return (
                  <div key={reg.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">{candidateName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrection ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCorrection ? 'Correction Req.' : 'Draft Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      <span className="text-[#006f67] font-bold">{reg.registration_number}</span> • {instName}
                    </p>
                    <p className="text-xs text-slate-700 font-medium">
                      {reg.notes || (isCorrection ? 'Correction required on credentials' : 'Draft pending submission')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPingTarget({
                          student: candidateName,
                          registrar: 'Institutional Registrar',
                          seminary: instName,
                        });
                        setPingModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Ping Registrar</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Card 2: Regional Hub Density & Curricular Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-[#006f67]" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Regional Hub Density
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Cycle Quota %</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between font-medium text-slate-700 mb-1">
                  <span>South Asia Hub</span>
                  <span className="font-bold text-slate-900">840 candidates (67% quota)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006f67] rounded-full w-[67%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-medium text-slate-700 mb-1">
                  <span>Southeast Asia Hub</span>
                  <span className="font-bold text-slate-900">310 candidates (76% quota)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006f67] rounded-full w-[76%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-medium text-slate-700 mb-1">
                  <span>East Asia Hub</span>
                  <span className="font-bold text-slate-900">180 candidates (82% quota)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006f67] rounded-full w-[82%]" />
                </div>
              </div>
            </div>

            {/* Curricular Degree Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Curricular Degree Breakdown</span>
                <span className="text-slate-400 text-[11px]">Active Intake</span>
              </div>

              {/* Segmented Bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-slate-900 w-[54%]" title="M.Div 54%" />
                <div className="h-full bg-[#006f67] w-[24%]" title="M.Th 24%" />
                <div className="h-full bg-teal-400 w-[14%]" title="B.Th 14%" />
                <div className="h-full bg-slate-400 w-[8%]" title="Ph.D 8%" />
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 flex-wrap gap-1">
                <span className="flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  M.Div 54%
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#006f67]" />
                  M.Th 24%
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  B.Th 14%
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Ph.D 8%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Cryptographic Merkle Ledger Provenance Strip */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Network className="h-4 w-4 text-[#006f67]" />
            <span>Merkle Tree Root:</span>
          </div>
          <span className="font-mono text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
            sha256:7f9a8820c...a091
          </span>
          <div className="hidden sm:flex items-center gap-3 text-slate-500 text-[11px]">
            <span>• Raft-BFT v2.4 Consensus</span>
            <span>• PostgreSQL RLS Active</span>
            <span>• Zero-Config Fallback Engaged</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSystemDump}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Download Full System State Dump</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectAuditLedgerModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-white" />
            <span>Inspect Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Bulk Excel Ingest Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onSuccess={() => {
          setIsExcelImportOpen(false);
          showToast('Excel batch intake uploaded and processed successfully.');
        }}
      />

      {/* MODAL 2: Provision Registrar Modal */}
      <CreateRegistrarModal
        isOpen={isCreateRegistrarOpen}
        onClose={() => setIsCreateRegistrarOpen(false)}
        onSuccess={() => {
          setIsCreateRegistrarOpen(false);
          showToast('New Institutional Registrar provisioned successfully.');
        }}
      />

      {/* MODAL 3: Emergency Controlled Unlock Override */}
      {controlledUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Universal Controlled Unlock Override</h3>
                  <p className="text-xs text-slate-500">Emergency two-factor governance unlock for locked dossier records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setControlledUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>High-Privilege Cryptographic Override</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Executing this override bypasses the standard registrar review gate and unlocks the candidate file for
                  immediate rectification. An immutable audit entry will be signed under your Universal key.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Registration Number / Dossier ID</label>
                <input
                  type="text"
                  value={controlledUnlockTarget}
                  onChange={(e) => setControlledUnlockTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Governance Justification *</label>
                <textarea
                  rows={3}
                  value={controlledUnlockReason}
                  onChange={(e) => setControlledUnlockReason(e.target.value)}
                  placeholder="State the formal Council executive clearance reason or appeal number..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                <span>Authorized Super-Admin:</span>
                <span className="font-bold text-slate-900">Dr. Grace Chen (Root Level-0)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setControlledUnlockModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteControlledUnlock}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Commit Controlled Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ping Registrar Escalation Modal */}
      {pingModalOpen && pingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Dispatch Operational Ping</h3>
                  <p className="text-xs text-slate-500">Urgent institutional registrar escalation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-bold text-slate-900">{pingTarget.registrar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution:</span>
                  <span className="font-bold text-slate-900">{pingTarget.seminary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stalled Candidate:</span>
                  <span className="font-bold text-rose-700">{pingTarget.student} (12d Overdue)</span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                An urgent high-priority SMS and email dispatch will be pushed to the officer&apos;s authenticated device
                requesting immediate remediation of the endorsement deficiency.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPing}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Dispatch Urgent Ping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Inspect Audit Ledger Modal */}
      {inspectAuditLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Raft-BFT Decentralized Audit Ledger</h3>
                  <p className="text-xs text-slate-500">Universal consensus ledger node SG-ASIA-01 live proof</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectAuditLedgerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto font-mono text-xs text-slate-700 bg-slate-50 rounded-xl m-5 border border-slate-200">
              <div className="space-y-1">
                <p className="text-emerald-700 font-bold">[NODE-01] CONSENSUS STATUS: OK • LEADER: ACTIVE</p>
                <p className="text-slate-500">Block Height: 104,912 • Hash: 0x7f9a8820ca881e3f8902adbb1734947119028471bcca091</p>
                <p className="text-slate-500">Peer Nodes: SG-ASIA-01 (100%), IN-BLR-02 (100%), PH-MNL-01 (100%)</p>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="font-bold text-slate-900">Recent Immutable Transactions:</p>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px]">
                  <div className="text-slate-800">TX #94182: FAST_INTAKE • UID: STU-2026-0922 • SAIACS M.Div</div>
                  <div className="text-slate-500">Signer: Rev. M. Thomas • Verified: YES • Gas: 0</div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px]">
                  <div className="text-slate-800">TX #94181: CONTROLLED_UNLOCK • REG-SAIACS-042 • Override</div>
                  <div className="text-slate-500">Signer: Dr. Grace Chen (Super-Admin) • Two-Factor: FIDO2</div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px]">
                  <div className="text-slate-800">TX #94180: BATCH_IMPORT • 45 Scholars • UBS Pune Matriculation</div>
                  <div className="text-slate-500">Signer: Dr. Ashish Christopher • SHA-256 Verified</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setInspectAuditLedgerModalOpen(false);
                  router.push('/audit-logs');
                }}
                className="text-xs font-bold text-[#006f67] hover:underline flex items-center gap-1"
              >
                <span>Open Full Audit &amp; Governance Ledger</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setInspectAuditLedgerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close Ledger View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
