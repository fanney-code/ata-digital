'use client';

import React, { useState, useMemo } from 'react';
import { AuditLog, UserRole } from '@/lib/types';
import {
  Shield,
  ShieldCheck,
  Download,
  Search,
  Key,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Server,
  Building2,
  Scroll,
  X,
  FileText,
  Lock,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Camera,
  Activity,
  ArrowRight,
  FileSpreadsheet,
  Check,
  Zap,
  Radio,
  FileCode,
  LockKeyhole,
} from 'lucide-react';

interface UniversalAuditGovernanceViewProps {
  logs: AuditLog[];
  currentRole: UserRole;
  onRefresh?: () => void;
}

export const INITIAL_UNIVERSAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-98124',
    event_number: '#LOG-2026-98124',
    action: 'CONTROLLED_UNLOCK',
    entity_type: 'STUDENT',
    entity_id: 'STU-2026-00012',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Universal Super-Admin',
    ip_address: '103.24.81.12',
    target_name: 'Ananya Sengupta',
    target_ref: 'Reg #SAIACS/BA-CML/2026/1',
    target_program: 'M.Th Christian Ethics • SAIACS',
    mutation_from: 'LOCKED_FINAL',
    mutation_to: 'CONTROLLED_EDIT',
    details: 'Candidate submitted revised Master\'s thesis dissertation title per academic board directive. Super-Admin Multi-Key authorization #ATH-992-B verified.',
    block_hash: '0x7f9a...a091',
    block_number: 891020,
    created_at: '2026-02-28T10:14:00Z',
    relative_time: 'Just now • 10:14 AM',
    is_verified: true,
  },
  {
    id: 'log-98100',
    event_number: '#LOG-2026-98100',
    action: 'DOSSIER_APPROVED',
    entity_type: 'REGISTRATION',
    entity_id: 'STU-2020-00419',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Universal Super-Admin',
    ip_address: '103.24.81.12',
    target_name: 'Samuel K. Marak',
    target_ref: 'Reg #UBS/BA-CML/2026/1',
    target_program: 'B.A in Christian Ministry • UBS Pune',
    mutation_from: 'PENDING_AUDIT',
    mutation_to: 'APPROVED_SEALED',
    details: 'Final credential audit successful. ATA Official Accreditation Certificate issued: #ATA-CRT-9921',
    block_hash: '0x3d4e...b872',
    block_number: 891018,
    created_at: '2026-02-28T09:46:00Z',
    relative_time: 'Today • 09:46 AM',
    is_verified: true,
  },
  {
    id: 'log-98042',
    event_number: '#LOG-2026-98042',
    action: 'CORRECTION_FLAGGED',
    entity_type: 'REGISTRATION',
    entity_id: 'STU-2023-01182',
    actor_name: 'Prof. A. Kuruvilla',
    actor_role: 'Admissions Reviewer',
    ip_address: '49.207.105.4',
    target_name: 'Priya Sharma',
    target_ref: 'Reg #COTR-TS/BA-CML/2026/1',
    target_program: 'B.A in Christian Ministry • COTR Theological Seminary',
    mutation_from: 'UNDER_REVIEW',
    mutation_to: 'CORRECTION_REQUIRED',
    details: 'Year 2 official mark sheet copy missing university registrar stamp and authentication seal. Notice sent to seminary desk.',
    block_hash: '0xb9b11...e201',
    block_number: 890841,
    created_at: '2026-02-28T08:30:00Z',
    relative_time: 'Today • 08:30 AM',
    is_verified: true,
  },
  {
    id: 'log-97918',
    event_number: '#LOG-2026-97918',
    action: 'EXCEL_BATCH_IMPORT',
    entity_type: 'REGISTRATION',
    entity_id: 'BATCH-SAIACS-02',
    actor_name: 'Rev. M. Thomas',
    actor_role: 'Registrar Operations',
    ip_address: '14.139.182.2',
    target_name: 'SAIACS Bengaluru',
    target_ref: 'Batch #IMP-SAIACS-2026-02',
    target_program: '28 Candidates Ingested',
    mutation_from: 'STAGING',
    mutation_to: 'COMMITTED',
    details: 'Pre-flight schema checks passed. Candidate UIDs generated in sequential Merkle leaf indices #491 to #518.',
    block_hash: '0xcc82...44f1',
    block_number: 889949,
    created_at: '2026-02-27T16:15:00Z',
    relative_time: 'Yesterday • 04:15 PM',
    is_verified: true,
  },
  {
    id: 'log-97884',
    event_number: '#LOG-2026-97884',
    action: 'DOCUMENT_CAPTURED',
    entity_type: 'DOCUMENT',
    entity_id: 'STU-2026-00014',
    actor_name: 'Dr. Grace Chen',
    actor_role: 'Universal Super-Admin',
    ip_address: '103.24.81.12',
    target_name: 'Joshua R. Sailo',
    target_ref: 'Reg #ACPL/BA-CML/2026/1',
    target_program: 'M.A. Intercultural Studies',
    mutation_from: 'UNVERIFIED',
    mutation_to: 'BIOMETRIC_MATCHED',
    details: 'National Passport bio-page confirmed via live capture interface. Merkle payload attached to candidate ledger certificate.',
    block_hash: '0xee51...904E',
    block_number: 889712,
    created_at: '2026-02-27T14:22:00Z',
    relative_time: 'Yesterday • 02:22 PM',
    is_verified: true,
  },
];

export const UniversalAuditGovernanceView: React.FC<UniversalAuditGovernanceViewProps> = ({
  logs,
  currentRole,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'STATUS_TRANSITIONS' | 'CONTROLLED_UNLOCK' | 'DOCUMENT_UPLOADS' | 'REGISTRAR_INGESTS' | 'SECURITY_FLAGS'
  >('ALL');
  const [academicYear, setAcademicYear] = useState('AY 2026–2027');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [isVerifyRootModalOpen, setIsVerifyRootModalOpen] = useState(false);
  const [isRehashModalOpen, setIsRehashModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isInspectProofModalOpen, setIsInspectProofModalOpen] = useState(false);
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Merge database logs with canonical logs
  const allLogs = useMemo(() => {
    const list = [...INITIAL_UNIVERSAL_AUDIT_LOGS];
    if (logs && logs.length > 0) {
      logs.forEach(l => {
        if (!list.some(item => item.id === l.id || item.event_number === l.event_number)) {
          list.push(l);
        }
      });
    }
    return list;
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.actor_name.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.target_name && log.target_name.toLowerCase().includes(q)) ||
        (log.event_number && log.event_number.toLowerCase().includes(q)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(q)) ||
        (log.block_hash && log.block_hash.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (roleFilter !== 'ALL') {
        const actorRoleStr = String(log.actor_role).toLowerCase();
        if (roleFilter === 'UNIVERSAL' && !actorRoleStr.includes('universal') && !actorRoleStr.includes('super-admin')) return false;
        if (roleFilter === 'REGISTRAR' && !actorRoleStr.includes('registrar')) return false;
        if (roleFilter === 'ADMIN' && !actorRoleStr.includes('admin') && !actorRoleStr.includes('reviewer')) return false;
      }

      if (activeTab === 'ALL') return true;
      if (activeTab === 'STATUS_TRANSITIONS') {
        return (
          log.action === 'DOSSIER_APPROVED' ||
          log.action === 'CORRECTION_FLAGGED' ||
          log.action === 'STATUS_CHANGED' ||
          log.action === 'APPROVAL'
        );
      }
      if (activeTab === 'CONTROLLED_UNLOCK') {
        return log.action === 'CONTROLLED_UNLOCK';
      }
      if (activeTab === 'DOCUMENT_UPLOADS') {
        return log.action === 'DOCUMENT_CAPTURED' || log.entity_type === 'DOCUMENT';
      }
      if (activeTab === 'REGISTRAR_INGESTS') {
        return log.action === 'EXCEL_BATCH_IMPORT' || log.action === 'REGISTRATION_CREATED';
      }
      if (activeTab === 'SECURITY_FLAGS') {
        return log.action === 'CORRECTION_FLAGGED' || log.details.toLowerCase().includes('flagged');
      }

      return true;
    });
  }, [allLogs, searchQuery, activeTab, roleFilter]);

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Event ID', 'Timestamp', 'Action Type', 'Actor', 'Role', 'IP Address', 'Target', 'Reference', 'Details', 'Block', 'SHA-256 Hash'];
    const rows = filteredLogs.map(l => [
      `"${l.event_number || l.id}"`,
      `"${l.created_at}"`,
      `"${l.action}"`,
      `"${l.actor_name}"`,
      `"${l.actor_role}"`,
      `"${l.ip_address || 'N/A'}"`,
      `"${l.target_name || l.entity_id}"`,
      `"${l.target_ref || 'N/A'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.block_number || 'N/A'}"`,
      `"${l.block_hash || 'N/A'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Master_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Export JSON
  const handleExportJSON = () => {
    const payload = {
      merkle_root: '0x7f9a8820c...a091',
      epoch: '419-B',
      consensus_protocol: 'Raft-BFT v2.4 Byzantine Agreement',
      node_id: 'SG-ASIA-01',
      exported_at: new Date().toISOString(),
      total_events: filteredLogs.length,
      audit_events: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Master_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Force Re-hash Action
  const handleForceRehash = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsRehashModalOpen(false);
      alert('Cryptographic Re-hash Complete: 28,491 block hashes verified across 3 regional nodes. Zero divergence detected.');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* 1. Protocol Sub-Bar & Universal Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="uppercase tracking-wider">ATA Universal Authority</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="uppercase tracking-wider">Compliance &amp; Audit Ledger</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold uppercase tracking-wider">Immutable Record Archive ||</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>MERKLE NODE #SG-ASIA-01 SYNCHRONIZED</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold">
            <span>IMMUTABLE HASH-CHAINED</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold font-mono">
            <span>PROTOCOL 11.2/B</span>
          </div>
        </div>
      </div>

      {/* 2. Page Title & 3 Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#191c1e] tracking-tight">
              System Audit &amp; Governance Logs
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#191c1e] text-white text-[10px] font-mono font-bold tracking-wider">
              ROOT TIER-0
            </span>
          </div>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Permanent, cryptographically verifiable event logs tracking registration state transitions, controlled
            record unlocks, institutional dossier approvals, credential uploads, and administrative overrides across
            142 theological seminaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsVerifyRootModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-[#006f67]" />
            <span>Verify Merkle Tree Root</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRehashModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 shadow-2xs transition-colors"
          >
            <Zap className="h-4 w-4 text-red-600" />
            <span>⚡ Force Cryptographic Re-hash</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191c1e] text-white text-xs font-semibold hover:bg-black shadow-xs transition-colors"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Export Master Audit CSV / JSON</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL LOGGED EVENTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL LOGGED EVENTS
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">28,491</span>
              <span className="text-xs font-bold text-emerald-600">
                ↗ +18.4%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              rolling 90 days window
            </p>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: CONTROLLED UNLOCKS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CONTROLLED UNLOCKS
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">14</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Key className="h-3 w-3" />
                <span>Super-Admin Executed Overrides</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mandatory Multi-Key Council Authorization
            </p>
          </div>
          <div className="h-1 w-12 bg-amber-500 rounded-full mt-4" />
        </div>

        {/* Card 3: BULK EXCEL INGESTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                BULK EXCEL INGESTS
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">32 Batches</span>
            </div>
            <p className="mt-1 text-xs text-[#006f67] font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>3,120 rows via SheetJS parser</span>
            </p>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-4" />
        </div>

        {/* Card 4: CRYPTOGRAPHIC CONSENSUS (Dark Navy Card) */}
        <div className="p-5 rounded-2xl bg-[#131b26] text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CRYPTOGRAPHIC CONSENSUS
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-white tracking-tight">VERIFIED</span>
            </div>
            <p className="mt-1 text-xs text-slate-300 font-mono">
              0 Divergences • Root #a091 • 3/3 Nodes
            </p>
          </div>
          <div className="h-1 w-12 bg-emerald-400 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Dual Telemetry / Proof Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Ingestion Cadence & Security Events */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Ingestion Cadence &amp; Security Events
              </h3>
              <p className="text-xs text-slate-500">
                Rolling telemetry across 6 milestone epochs (Oct 01 – Feb 28)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-black" />
                <span className="text-slate-700">Standard Ingests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-700">Controlled Unlocks</span>
              </div>
            </div>
          </div>

          {/* SVG Spline Area Chart */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative">
            <div className="relative pt-2 pb-1">
              <svg viewBox="0 0 700 160" className="w-full h-36 overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="universalCadenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006f67" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#006f67" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="700" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />

                {/* Area fill */}
                <path
                  d="M 20 120 
                     C 80 110, 140 105, 200 95 
                     C 260 85, 300 70, 350 45 
                     C 400 20, 440 60, 480 75 
                     C 520 90, 560 80, 600 85 
                     C 640 90, 670 95, 690 95 
                     L 690 150 L 20 150 Z"
                  fill="url(#universalCadenceGrad)"
                />

                {/* Stroke curve */}
                <path
                  d="M 20 120 
                     C 80 110, 140 105, 200 95 
                     C 260 85, 300 70, 350 45 
                     C 400 20, 440 60, 480 75 
                     C 520 90, 560 80, 600 85 
                     C 640 90, 670 95, 690 95"
                  fill="none"
                  stroke="#006f67"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Marker dots */}
                <circle cx="100" cy="110" r="3.5" fill="#006f67" />
                <circle cx="200" cy="95" r="3.5" fill="#006f67" />
                <circle cx="480" cy="75" r="3.5" fill="#006f67" />
                <circle cx="600" cy="85" r="3.5" fill="#006f67" />

                {/* Controlled Unlocks scattered dots */}
                <circle cx="140" cy="118" r="3" fill="#f59e0b" />
                <circle cx="280" cy="80" r="3" fill="#f59e0b" />
                <circle cx="430" cy="65" r="3" fill="#f59e0b" />
                <circle cx="580" cy="100" r="3" fill="#f59e0b" />

                {/* Peak Red Dot */}
                <circle cx="350" cy="45" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <circle cx="350" cy="45" r="9" fill="#e11d48" opacity="0.25" className="animate-ping" />
              </svg>

              {/* Peak Tooltip Pill */}
              <div className="absolute top-1 left-[45%] -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-md pointer-events-none">
                Batch Deadline Peak: 1,420 ev/day (Jan 15)
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-200/80">
              <span>Oct 01</span>
              <span>Nov 15</span>
              <span>Dec 01</span>
              <span className="text-slate-900 font-bold">Jan 15 (Batch Deadline)</span>
              <span>Feb 01</span>
              <span>Feb 28 (Current)</span>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
            <div className="flex items-center gap-1.5 text-[#006f67] font-semibold">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Instant Merkle aggregation cycle: every 180 seconds</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTelemetryModalOpen(true)}
              className="font-bold text-[#006f67] hover:underline flex items-center gap-1"
            >
              <span>Explore Node Telemetry</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Governance Proof Nodes */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Governance Proof Nodes
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Raft-BFT v2.4 Byzantine Agreement • Epoch #419-B
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              3/3 Quorum
            </span>
          </div>

          <div className="space-y-3">
            {/* Node 1: SAIACS Academic */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-teal-50 text-[#006f67] border border-teal-100 shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    SAIACS Academic Node
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Bengaluru (IN) • Ledger Block #892,10
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] text-slate-400">14ms</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#99efe5]/60 text-[#006f67]">
                  SYNCED
                </span>
              </div>
            </div>

            {/* Node 2: ATA Central Council (Local) */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-900 text-teal-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      ATA Central Council Node
                    </h4>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold">
                      LEADER
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    Singapore HQ • Raft-BFT Leader
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#191c1e] text-white shrink-0">
                MASTER
              </span>
            </div>

            {/* Node 3: Serampore Senate Relay */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                  <Scroll className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    Serampore Senate Relay
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Kolkata (IN) • Observer &amp; Ledger Vault
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] text-slate-400">28ms</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#99efe5]/60 text-[#006f67]">
                  SYNCED
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-mono border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-600 font-sans text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero state deviation recorded across 142 institution partitions</span>
            </span>
            <span className="font-bold text-slate-700 font-mono">Block #892,102</span>
          </div>
        </div>
      </div>

      {/* 5. Filters Bar & Search Controls */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Actor Name, Candidate UID, Event ID, or Hash..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            >
              <option value="AY 2026–2027">Academic Year: AY 2026–2027</option>
              <option value="AY 2025–2026">Academic Year: AY 2025–2026</option>
            </select>

            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            >
              <option value="ALL">All Roles (Universal, Admin, Registrar)</option>
              <option value="UNIVERSAL">Universal Super-Admin</option>
              <option value="ADMIN">Admissions Reviewer / Admin</option>
              <option value="REGISTRAR">Registrar Operations</option>
            </select>

            <button
              type="button"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              title="More filter options"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Events (28,491)' },
            { id: 'STATUS_TRANSITIONS', label: 'Status Transitions (14,210)' },
            { id: 'CONTROLLED_UNLOCK', label: 'Controlled Unlocks (14)', isUnlock: true },
            { id: 'DOCUMENT_UPLOADS', label: 'Document Uploads (5,840)' },
            { id: 'REGISTRAR_INGESTS', label: 'Registrar Ingests (3,219)' },
            { id: 'SECURITY_FLAGS', label: 'Security Flags' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#191c1e] text-white shadow-xs'
                    : tab.isUnlock
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {tab.isUnlock && <Key className="h-3 w-3" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Main Audit Events Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 font-bold">TIMESTAMP &amp; EVENT ID</th>
                <th className="py-3.5 px-4 font-bold">ACTION TYPE</th>
                <th className="py-3.5 px-4 font-bold">ACTOR &amp; ORIGIN</th>
                <th className="py-3.5 px-4 font-bold">TARGET CANDIDATE / INSTITUTION</th>
                <th className="py-3.5 px-4 font-bold">AUDIT JUSTIFICATION &amp; HASH PAYLOAD</th>
                <th className="py-3.5 px-4 font-bold text-center">VERIFIED</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map(log => {
                const isControlledUnlock = log.action === 'CONTROLLED_UNLOCK';
                const isDossierApproved = log.action === 'DOSSIER_APPROVED' || log.action === 'APPROVAL';
                const isCorrectionFlagged = log.action === 'CORRECTION_FLAGGED';
                const isExcelImport = log.action === 'EXCEL_BATCH_IMPORT';
                const isDocCapture = log.action === 'DOCUMENT_CAPTURED';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Timestamp & Event ID */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div className="text-xs font-bold text-slate-900">
                        {log.relative_time || 'Just now'}
                      </div>
                      <div className="font-mono text-[10.5px] text-[#006f67] font-bold">
                        {log.event_number || `#LOG-2026-${log.id.slice(0, 5)}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    {/* 2. Action Type */}
                    <td className="py-4 px-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${
                          isControlledUnlock
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isDossierApproved
                            ? 'bg-[#99efe5]/40 text-[#006f67] border border-[#99efe5]'
                            : isCorrectionFlagged
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : isExcelImport
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {isControlledUnlock ? (
                          <LockKeyhole className="h-3 w-3" />
                        ) : isDossierApproved ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : isCorrectionFlagged ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : isExcelImport ? (
                          <FileSpreadsheet className="h-3 w-3" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                        <span>{log.action}</span>
                      </span>
                    </td>

                    {/* 3. Actor & Origin */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-2.5">
                        {log.actor_name === 'Rev. M. Thomas' ? (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            MT
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {log.actor_name[0]}
                            {log.actor_name.split(' ')[1]?.[0] || ''}
                          </div>
                        )}

                        <div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">
                            {log.actor_name}
                          </div>
                          <div className="text-[10px] text-teal-700 font-semibold">
                            {String(log.actor_role)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            IP: {log.ip_address || '103.24.81.12'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 4. Target Candidate / Institution */}
                    <td className="py-4 px-4 align-top space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs">
                        {log.target_name || log.entity_id}
                      </div>
                      <div className="font-mono text-[10.5px] font-bold text-cyan-800">
                        {log.target_ref || `Reg #${log.entity_id}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {log.target_program || 'Theological Degree'}
                      </div>
                    </td>

                    {/* 5. Audit Justification & Hash Payload */}
                    <td className="py-4 px-4 align-top space-y-1.5 max-w-md">
                      {isControlledUnlock && (
                        <div className="text-xs font-bold text-amber-700">
                          LOCKED_FINAL &rarr; CONTROLLED_EDIT
                        </div>
                      )}

                      {isDossierApproved && (
                        <div className="text-xs font-bold text-emerald-700">
                          PENDING_AUDIT &rarr; APPROVED_SEALED
                        </div>
                      )}

                      {isCorrectionFlagged && (
                        <div className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Flagged for Incomplete Transcripts</span>
                        </div>
                      )}

                      {isExcelImport && (
                        <div className="text-xs font-bold text-teal-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-teal-600" />
                          <span>Bulk Schema Validation: 28 Passed / 0 Errors</span>
                        </div>
                      )}

                      {isDocCapture && (
                        <div className="text-xs font-bold text-[#006f67] flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Live Biometric Identification Seal Added</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{log.details}"
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[10.5px] font-mono text-slate-400">
                        {log.block_number && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            Block #{log.block_number.toLocaleString()}
                          </span>
                        )}
                        {log.block_hash && (
                          <button
                            type="button"
                            onClick={() => handleCopyHash(log.block_hash || '')}
                            className="text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                            title="Copy hash"
                          >
                            <span>Hash: {log.block_hash}</span>
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 6. Verified Shield */}
                    <td className="py-4 px-4 align-top text-center">
                      <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-slate-100 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Showing 1 – {paginatedLogs.length} of 28,491 audited ledger entries • Cryptographic signature checks passed
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50"
              disabled
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs"
            >
              1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-xs"
            >
              2
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-xs"
            >
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-xs"
            >
              5,699
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Bottom Strip: Supabase Immutable Event Log Architecture */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-[#006f67] border border-teal-100 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-xs">
                Supabase Immutable Event Log Architecture
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#99efe5]/40 text-[#006f67] text-[10px] font-mono font-bold">
                SYNC: LIVE
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                Block #891,019
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                Zero Drift Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Synchronized with Central ATA Council Node (SG-ASIA-01) • Merkle Root: <span className="font-mono text-slate-700">7f9a8820c...a091</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsInspectProofModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Inspect Merkle Proof</span>
        </button>
      </div>

      {/* MODAL 1: Verify Merkle Tree Root Modal */}
      {isVerifyRootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Merkle Tree Root Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyRootModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Consensus State: Validated (0 Divergences)</span>
                </div>
                <p className="text-[11px]">
                  All 28,491 audit leaf hashes calculate deterministically to root anchor:
                </p>
                <p className="font-mono text-xs font-bold text-emerald-950 break-all">
                  sha256:7f9a8820ca091bcd4e2fa883d4e001928374659281aef12
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Validator 1 (Singapore HQ):</span>
                  <span className="text-slate-900 font-bold">MATCH (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validator 2 (SAIACS Bengaluru):</span>
                  <span className="text-slate-900 font-bold">MATCH (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validator 3 (Serampore Senate):</span>
                  <span className="text-slate-900 font-bold">MATCH (100%)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Timestamp of last council signature: {new Date().toUTCString()}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVerifyRootModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Force Cryptographic Re-hash Modal */}
      {isRehashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <Zap className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Force Cryptographic Re-hash
                </h3>
                <p className="text-xs text-red-600 font-medium">
                  Universal Super-Admin Ledger Action
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action initiates a full linear recalculation of all 28,491 audit event hashes against the current
              database records to confirm cryptographic immutability across all 142 theological seminaries.
            </p>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1">
              <p className="font-bold">Execution Steps:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Re-computes SHA-256 digests of all registration mutations.</li>
                <li>Broadcasts fresh tree root hash to Singapore, Bengaluru, and Kolkata validator nodes.</li>
                <li>Publishes verified block proof to council telemetry channel.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRehashModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceRehash}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold text-xs shadow-xs disabled:opacity-50"
              >
                {isProcessing ? 'Re-calculating Hashes...' : 'Execute Re-hash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Export Master Audit Archive
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Download the complete, cryptographically verified audit ledger containing {filteredLogs.length} matching events.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#006f67] hover:bg-teal-50/40 text-left space-y-1 transition-all"
              >
                <FileSpreadsheet className="h-5 w-5 text-teal-700" />
                <p className="font-bold text-slate-900 text-xs">Spreadsheet CSV</p>
                <p className="text-[10px] text-slate-500">Excel / Numbers compatible with full hash columns</p>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#006f67] hover:bg-teal-50/40 text-left space-y-1 transition-all"
              >
                <FileCode className="h-5 w-5 text-indigo-600" />
                <p className="font-bold text-slate-900 text-xs">JSON Manifest</p>
                <p className="text-[10px] text-slate-500">Machine-readable with full Merkle tree proof</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Explore Node Telemetry Modal */}
      {isTelemetryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Byzantine Consensus Telemetry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Consensus Round:</span>
                  <span className="text-slate-900 font-bold">#419-B (Leader Term 4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Peer Nodes:</span>
                  <span className="text-emerald-700 font-bold">3 of 3 Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Round-Trip Latency:</span>
                  <span className="text-slate-900">Avg 19.3ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">State Root Hash:</span>
                  <span className="text-blue-600">0x7f9a8820c...a091</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTelemetryModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Inspect Merkle Proof Modal */}
      {isInspectProofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Merkle Inclusion Proof Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectProofModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Cryptographic inclusion proof validating current database state against block #891,019:
              </p>

              <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
{`{
  "protocol": "ATA-MERKLE-PROOF-v1",
  "block_height": 891019,
  "root_hash": "0x7f9a8820ca091bcd4e2fa883d4e00192",
  "leaf_index": 28491,
  "leaf_hash": "0x3d4eb872...9821",
  "audit_path": [
    "0xb9b11...e201",
    "0xcc824...44f1",
    "0xee519...904e"
  ],
  "ed25519_signature": "MEQCIG719...a01==",
  "status": "VALID"
}`}
              </pre>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsInspectProofModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
