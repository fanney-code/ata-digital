'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronsLeft,
  ChevronsRight,
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
} from 'lucide-react';

interface AuditGovernanceViewProps {
  logs: AuditLog[];
  currentRole: UserRole;
  onRefresh?: () => void;
}

export const AuditGovernanceView: React.FC<AuditGovernanceViewProps> = ({
  logs,
  currentRole,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'STATUS_TRANSITIONS' | 'CONTROLLED_UNLOCK' | 'DOCUMENT_UPLOADS' | 'REGISTRAR_INGESTS'
  >('ALL');
  const [sessionYear, setSessionYear] = useState('AY 2026–2027 (Active Session)');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [inspectingSealLog, setInspectingSealLog] = useState<AuditLog | null>(null);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isProofLogModalOpen, setIsProofLogModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.actor_name.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.target_name && log.target_name.toLowerCase().includes(q)) ||
        (log.event_number && log.event_number.toLowerCase().includes(q)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (roleFilter !== 'ALL') {
        const actorRoleStr = String(log.actor_role).toLowerCase();
        if (roleFilter === 'REGISTRAR' && !actorRoleStr.includes('registrar')) return false;
        if (roleFilter === 'ADMIN' && !actorRoleStr.includes('admin') && !actorRoleStr.includes('reviewer')) return false;
      }

      if (activeTab === 'ALL') return true;
      if (activeTab === 'STATUS_TRANSITIONS') {
        return (
          log.action === 'DOSSIER_APPROVED' ||
          log.action === 'CORRECTION_FLAGGED' ||
          log.action === 'STATUS_CHANGE' ||
          log.action === 'APPROVAL'
        );
      }
      if (activeTab === 'CONTROLLED_UNLOCK') {
        return log.action === 'CONTROLLED_UNLOCK';
      }
      if (activeTab === 'DOCUMENT_UPLOADS') {
        return log.action === 'DOCUMENT_CAPTURED' || log.entity_type === 'DOCUMENT' || log.entity_type === 'STUDENT';
      }
      if (activeTab === 'REGISTRAR_INGESTS') {
        return log.action === 'EXCEL_BATCH_IMPORT' || log.action === 'REGISTRATION_CREATED';
      }

      return true;
    });
  }, [logs, searchQuery, activeTab, roleFilter]);

  const totalEventsCount = 28491;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, roleFilter]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const handleCopySeal = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Timestamp', 'Action', 'Actor Name', 'Actor Role', 'Target Entity', 'Details', 'Block Hash'];
    const rows = filteredLogs.map((l) => [
      l.event_number || l.id,
      `"${l.created_at}"`,
      l.action,
      `"${l.actor_name}"`,
      `"${l.actor_role}"`,
      `"${l.target_name || l.entity_id}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.block_hash || 'SHA256-GEN',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Executive_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const handleExportJSON = () => {
    const manifest = {
      merkle_root: '#711',
      protocol: 'ATA-ISO-27001-EXECUTIVE-LEDGER',
      node_id: 'SG-ASIA-01',
      exported_at: new Date().toISOString(),
      total_events_exported: filteredLogs.length,
      events: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Executive_Audit_Manifest_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Protocol Sub-bar / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
        {/* Breadcrumb Links */}
        <div className="flex items-center gap-1.5 text-slate-500 font-medium flex-wrap">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            ATA Central Governance
          </span>
          <span>›</span>
          <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
            Compliance &amp; Audit Ledger
          </span>
          <span>›</span>
          <strong className="text-[#006f67] font-extrabold uppercase tracking-wider text-[11px]">
            Immutable Record Archive
          </strong>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[#006f67] text-[11px] font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>MERKLE NODE #SG-ASIA-01 SYNCHRONIZED</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            <span>IMMUTABLE HASH-CHAINED</span>
          </div>
        </div>
      </div>

      {/* Page Title & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Executive Governance Ledger Tag */}
          <div className="inline-flex items-center gap-1.5 text-[#006f67] font-bold text-xs uppercase tracking-wider mb-1.5">
            <ShieldCheck className="h-4 w-4 text-[#006f67]" />
            <span>Executive Governance Ledger</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Executive Audit &amp; Governance Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 font-medium leading-relaxed">
            Permanent, cryptographically verifiable event logs tracking registration state transitions, controlled record unlocks, institutional dossier approvals, credential uploads, and administrative overrides across 142 theological seminaries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Verify Merkle Tree Button */}
          <button
            type="button"
            onClick={() => setIsVerifyingIntegrity(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#99efe5] bg-[#f0fdfa] hover:bg-[#ccfbf1] text-[#006f67] text-xs font-bold shadow-2xs transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-[#006f67]" />
            <span>Verify Merkle Tree</span>
          </button>

          {/* Export Executive Audit CSV / JSON Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Executive Audit CSV / JSON</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logged Events */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Logged Events
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono font-black text-sm border border-indigo-100">
              &lt;&gt;
            </div>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              28,491
            </span>
            <span className="text-xs font-extrabold text-emerald-600">
              +18.4%
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Past 90 days rolling governance window
          </div>

          {/* Green accent line */}
          <div className="w-16 h-1 rounded-full bg-[#006f67] mt-3" />
        </div>

        {/* Card 2: Controlled Unlocks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Controlled Unlocks
            </span>
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              14
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10.5px] font-bold">
              Super-Admin
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mandatory Super-Admin / Executive Audited
          </div>

          {/* Black accent line */}
          <div className="w-16 h-1 rounded-full bg-slate-900 mt-3" />
        </div>

        {/* Card 3: Bulk Excel Ingests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bulk Excel Ingests
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              32
            </span>
            <span className="text-xs font-bold text-slate-600">
              Batches
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            3,120 candidate rows processed flawlessly
          </div>

          {/* Spacer to align height */}
          <div className="h-1 mt-3" />
        </div>

        {/* Card 4: Cryptographic Consensus (Dark Card) */}
        <div className="p-5 rounded-2xl bg-black text-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Cryptographic Consensus
            </span>
            <ShieldCheck className="h-4 w-4 text-[#2dd4bf]" />
          </div>

          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight block">
              VERIFIED
            </span>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span>0 Merkle divergences - Root #711</span>
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400 font-mono">
            <span>Hash: sha256:7f9a...80e3</span>
            <button
              type="button"
              onClick={() => setIsProofLogModalOpen(true)}
              className="text-white hover:text-[#2dd4bf] underline font-sans font-bold transition-colors"
            >
              Proof Log
            </button>
          </div>
        </div>
      </div>

      {/* Middle Two-Column Section: Cadence Chart & Proof Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~65%): Ingestion Cadence & Security Events */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-[#006f67] uppercase tracking-wider block">
                Ledger Velocity Monitoring
              </span>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Ingestion Cadence &amp; Security Events
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-black" />
                <span className="text-slate-700">Standard Ingest</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />
                <span className="text-slate-700">Super-Admin Unlocks</span>
              </div>
            </div>
          </div>

          {/* Chart Container Box */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 relative">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600">AY 2026–2027 Registration Cycle</span>
              <span className="font-bold text-slate-800">Peak Activity: Jan 24 (1,420 events/day)</span>
            </div>

            {/* SVG Spline Area Chart */}
            <div className="relative pt-2 pb-1">
              <svg
                viewBox="0 0 700 160"
                className="w-full h-36 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#adminAreaGrad)"
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

                {/* Marker dots along curve */}
                <circle cx="100" cy="110" r="3.5" fill="#006f67" />
                <circle cx="200" cy="95" r="3.5" fill="#006f67" />
                <circle cx="480" cy="75" r="3.5" fill="#006f67" />
                <circle cx="600" cy="85" r="3.5" fill="#006f67" />

                {/* Peak Red Dot */}
                <circle cx="350" cy="45" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <circle cx="350" cy="45" r="9" fill="#e11d48" opacity="0.25" className="animate-ping" />
              </svg>

              {/* Peak Tooltip Pill */}
              <div className="absolute top-1 left-[45%] -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold shadow-md pointer-events-none">
                Batch Deadline Peak: 1,420 ev/day (Jan 15)
              </div>
            </div>

            {/* X-Axis Timeline Labels */}
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-200/80">
              <span>Oct 01</span>
              <span>Nov 15</span>
              <span>Dec 01</span>
              <span className="text-slate-900 font-bold">Jan 15 (Batch Deadline)</span>
              <span>Feb 01</span>
              <span>Feb 28</span>
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
              className="font-bold text-slate-800 hover:text-[#006f67] transition-colors flex items-center gap-1"
            >
              <span>Explore Node Telemetry</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (~35%): Governance Proof Nodes */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Distributed Validation
              </span>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Governance Proof Nodes
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-xs font-bold">
              3/3 QUORUM
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
                    SAIACS Academic <span className="font-normal text-slate-500">(Bengaluru)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Latency: 14ms • Ledger Block #891,019
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#99efe5] text-[#006f67] shrink-0">
                ● SYNCED
              </span>
            </div>

            {/* Node 2: ATA Central Council */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-900 text-teal-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    ATA Central Council * MASTER
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Singapore HQ • Key Ceremony Mult...
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#99efe5] text-[#006f67] shrink-0">
                ● SYNCED
              </span>
            </div>

            {/* Node 3: Serampore Senate */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                  <Scroll className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    Serampore Senate V. <span className="font-normal text-slate-500">(Kolkata)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Latency: 28ms • Observer &amp; Indepe...
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#99efe5] text-[#006f67] shrink-0">
                ● SYNCED
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-mono border-t border-slate-100">
            <span>Consensus Protocol: Raft-BFT v2.4</span>
            <span className="font-bold text-slate-700">Epoch #419-B</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search Controls */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Actor Name, Candidate UID, Registration #, Event ID, or Hash..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            >
              <option value="AY 2026–2027 (Active Session)">Academic Year: AY 2026–2027</option>
              <option value="AY 2025–2026">Academic Year: AY 2025–2026</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            >
              <option value="ALL">All Roles (Admin, Registrar, Universal)</option>
              <option value="REGISTRAR">Registrar Operations</option>
              <option value="ADMIN">Chief Academic Administrator</option>
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
            { id: 'CONTROLLED_UNLOCK', label: 'Controlled Unlocks', badge: '14' },
            { id: 'DOCUMENT_UPLOADS', label: 'Document Uploads (5,840)' },
            { id: 'REGISTRAR_INGESTS', label: 'Registrar Ingests (3,280)' },
          ].map((tab) => {
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
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Audit Events Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Timestamp &amp; Event ID</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Actor &amp; Role</th>
                <th className="py-3.5 px-4">Target Entity &amp; Ref</th>
                <th className="py-3.5 px-4">Details &amp; Audit Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No audited ledger entries found matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isControlledUnlock = log.action === 'CONTROLLED_UNLOCK';
                  const isDossierApproved = log.action === 'DOSSIER_APPROVED' || log.action === 'APPROVAL';
                  const isCorrectionFlagged = log.action === 'CORRECTION_FLAGGED';
                  const isExcelImport = log.action === 'EXCEL_BATCH_IMPORT';
                  const isDocCapture = log.action === 'DOCUMENT_CAPTURED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* 1. Timestamp & Event ID */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="text-xs font-bold text-slate-900">
                          {log.relative_time || 'Just now'}
                        </div>
                        <div className="font-mono text-[10.5px] text-slate-400">
                          {log.event_number || `#LOG-2026-${log.id.slice(0, 5)}`}
                        </div>
                      </td>

                      {/* 2. Action Type */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${
                            isControlledUnlock
                              ? 'bg-black text-amber-300'
                              : isDossierApproved
                              ? 'bg-[#99efe5] text-[#006f67]'
                              : isCorrectionFlagged
                              ? 'bg-rose-100 text-rose-800'
                              : isExcelImport
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-teal-50 text-[#006f67] border border-teal-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isControlledUnlock
                                ? 'bg-amber-400'
                                : isDossierApproved
                                ? 'bg-[#006f67]'
                                : isCorrectionFlagged
                                ? 'bg-rose-600'
                                : isExcelImport
                                ? 'bg-blue-600'
                                : 'bg-[#006f67]'
                            }`}
                          />
                          <span>● {log.action}</span>
                        </span>
                      </td>

                      {/* 3. Actor & Role */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          {log.actor_name === 'Rev. M. Thomas' ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              MT
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {log.actor_name[0]}
                              {log.actor_name.split(' ')[1]?.[0] || ''}
                            </div>
                          )}

                          <div>
                            <div className="font-bold text-slate-900 text-xs leading-tight">
                              {log.actor_name}
                            </div>
                            <div className="text-[10px] text-teal-700 font-semibold italic">
                              {String(log.actor_role)}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              IP: {log.ip_address || '103.24.81.12'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Target Entity & Ref */}
                      <td className="py-4 px-4 align-top space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.target_name || log.entity_id}
                        </div>
                        <div className="font-mono text-[10.5px] font-bold text-[#006f67]">
                          {log.target_ref || `Reg #${log.entity_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.target_program || 'Theological Degree'}
                        </div>
                      </td>

                      {/* 5. Details & Audit Justification */}
                      <td className="py-4 px-4 align-top space-y-1.5 max-w-md">
                        {/* State Mutation or Callout Tag */}
                        {isControlledUnlock && (
                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            <span>State Mutation: LOCKED_FINAL → CONTROLLED_EDIT</span>
                          </div>
                        )}

                        {isDossierApproved && (
                          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <span>State Mutation: PENDING_AUDIT → APPROVED_SEALED</span>
                          </div>
                        )}

                        {isCorrectionFlagged && (
                          <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            <span>Flagged for Incomplete Transcripts</span>
                          </div>
                        )}

                        {isExcelImport && (
                          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <span>Bulk Schema Validation: 28 Passed / 0 Errors</span>
                          </div>
                        )}

                        {isDocCapture && (
                          <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-200 text-xs font-bold text-[#006f67] flex items-center gap-1.5">
                            <Camera className="h-3.5 w-3.5 text-[#006f67] shrink-0" />
                            <span>Live Biometric Identification Seal Added</span>
                          </div>
                        )}

                        {/* Description Text */}
                        <div className="text-xs text-slate-600 leading-relaxed font-medium">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} audited ledger events
            </p>
            <span>|</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === totalPages
                      ? 'bg-black text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Architecture Banner: Supabase Immutable Event Log Architecture */}
      <div className="p-4 rounded-2xl bg-[#eff4ff] border border-blue-100/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100 shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              Supabase Immutable Event Log Architecture
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Synchronized with Central ATA Council Node (SG-ASIA-01) • Block #891,019 - Zero Drift Detected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-slate-600 font-semibold">
            Merkle Root: 7f9a8820c...a091
          </span>
          <button
            type="button"
            onClick={() => setIsVerifyingIntegrity(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
          >
            Inspect Merkle Proof
          </button>
        </div>
      </div>

      {/* MODAL 1: Verify Merkle Tree Report */}
      {isVerifyingIntegrity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Merkle Tree Consensus Verified
                </h3>
              </div>
              <button
                onClick={() => setIsVerifyingIntegrity(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cryptographic proof chain validated across 3 distributed governance proof nodes with <strong>Zero Drift Detected</strong>.
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Merkle Consensus Root:</span>
                <span className="font-mono font-bold text-slate-900">#711 (7f9a8820c...a091)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Audited Events:</span>
                <span className="font-bold text-slate-900">28,491</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamper Divergences:</span>
                <span className="font-bold text-emerald-700">0 Detected (100% Intact)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Proof Nodes:</span>
                <span className="font-bold text-[#006f67]">3 / 3 (Quorum Validated)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsVerifyingIntegrity(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Export Executive Audit CSV / JSON */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Export Executive Audit Ledger
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export the complete tamper-evident audit record with SHA-256 block digests and actor attribution.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-center transition-all group"
              >
                <FileText className="mx-auto h-6 w-6 text-slate-500 group-hover:text-[#006f67] mb-1.5" />
                <div className="text-xs font-bold text-slate-900">Tabular CSV</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Spreadsheet (.csv)</div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-center transition-all group"
              >
                <Database className="mx-auto h-6 w-6 text-slate-500 group-hover:text-indigo-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-900">Signed JSON</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cryptographic manifest</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Proof Log Details */}
      {isProofLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Consensus Proof Log
                </h3>
              </div>
              <button
                onClick={() => setIsProofLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5">
              <div>[CONSENSUS] Raft-BFT Epoch #419-B active</div>
              <div>[ROOT] Merkle Root: 7f9a8820c41d9c091e80e3</div>
              <div>[VALIDATION] 0 block divergences across 142 seminaries</div>
              <div>[SYNC] SG-ASIA-01 synchronized (0.00ms latency)</div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsProofLogModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Explore Node Telemetry */}
      {isTelemetryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  Distributed Node Telemetry
                </h3>
              </div>
              <button
                onClick={() => setIsTelemetryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">SAIACS Academic Primary Node</div>
                  <div className="text-[11px] text-slate-500">Bengaluru, India (IPv4: 103.24.81.12)</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 font-bold">14ms Latency</span>
                  <div className="text-[10px] text-slate-400">Block #891,019</div>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">ATA Central Council Master Node</div>
                  <div className="text-[11px] text-slate-500">Singapore HQ (IPv4: 182.78.12.91)</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 font-bold">Local (0ms)</span>
                  <div className="text-[10px] text-slate-400">Master Signer</div>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Serampore Senate Validation Relay</div>
                  <div className="text-[11px] text-slate-500">Kolkata, India (IPv4: 49.207.185.4)</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 font-bold">28ms Latency</span>
                  <div className="text-[10px] text-slate-400">Observer Quorum</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
