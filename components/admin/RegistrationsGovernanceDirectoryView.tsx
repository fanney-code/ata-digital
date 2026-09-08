'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Registration, WorkflowStatus } from '@/lib/types';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
import { useAuth } from '@/lib/context/AuthContext';
import { createAuditLog } from '@/lib/api/supabase-service';
import {
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Flag,
  Award,
  SlidersHorizontal,
  FileCheck,
  ArrowRight,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

export interface GovernanceCandidateRow {
  id: string;
  regNumber: string;
  submittedAtFormatted: string;
  isResubmitted?: boolean;
  timeNote: string;
  candidate: {
    name: string;
    uid: string;
    avatarUrl?: string;
  };
  academic: {
    degreeProgram: string;
    institution: string;
  };
  dossier: {
    verifiedCount: number;
    subNote?: string;
    badgeVariant?: 'mint' | 'blue';
  };
  status: 'RESUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'APPROVED' | 'SUBMITTED' | 'ARCHIVED';
  statusNote?: string;
  certificateNumber?: string;
  notes?: string;
}

interface RegistrationsGovernanceDirectoryViewProps {
  registrations: Registration[];
  currentRole: string;
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration?: () => void;
  onReRegisterStudent?: (student: any) => void;
  onReload?: () => void;
  externalSearchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export const INITIAL_GOVERNANCE_ROWS: GovernanceCandidateRow[] = [];

export const RegistrationsGovernanceDirectoryView: React.FC<RegistrationsGovernanceDirectoryViewProps> = ({
  registrations,
  currentRole,
  onSelectRegistration,
  onNewRegistration,
  onReRegisterStudent,
  onReload,
  externalSearchQuery = '',
  onSearchQueryChange,
}) => {
  const { user } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [academicYearFilter, setAcademicYearFilter] = useState('2026-2027');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [curriculaFilter, setCurriculaFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['gov-01', 'gov-02']));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [controlledUnlockModalOpen, setControlledUnlockModalOpen] = useState(false);
  const [targetUnlockRow, setTargetUnlockRow] = useState<GovernanceCandidateRow | null>(null);
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [notesModalRow, setNotesModalRow] = useState<GovernanceCandidateRow | null>(null);
  const [auditModalRow, setAuditModalRow] = useState<GovernanceCandidateRow | null>(null);
  const [requestCorrectionRow, setRequestCorrectionRow] = useState<GovernanceCandidateRow | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Map database registrations directly into candidate rows
  const allRows = useMemo<GovernanceCandidateRow[]>(() => {
    if (!registrations || registrations.length === 0) return [];

    return registrations.map((r) => {
      return {
        id: r.id,
        regNumber: r.registration_number,
        submittedAtFormatted: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'Recent',
        timeNote: `Submitted ${r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'Recent'}`,
        isResubmitted: r.status === 'RESUBMITTED',
        candidate: {
          name: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Candidate Student',
          uid: r.student?.permanent_uid || 'N/A',
        },
        academic: {
          degreeProgram: r.program?.name || 'Theology Program',
          institution: r.institution?.name || 'Member Seminary',
        },
        dossier: {
          verifiedCount: 4,
          badgeVariant: 'mint' as 'mint' | 'blue' | undefined,
        },
        status: r.status as any,
        statusNote: r.status === 'CORRECTION_REQUIRED' ? 'Correction Pending' : undefined,
        notes: r.notes || undefined,
        certificateNumber: r.status === 'APPROVED' ? `ATA-CRT-${r.registration_number.replace(/\//g, '-')}` : undefined,
      };
    });
  }, [registrations]);

  // Dynamic Tab counts
  const counts = useMemo(() => {
    return {
      all: allRows.length,
      underReview: allRows.filter((r) => r.status === 'UNDER_REVIEW').length,
      resubmitted: allRows.filter((r) => r.status === 'RESUBMITTED').length,
      correctionRequired: allRows.filter((r) => r.status === 'CORRECTION_REQUIRED').length,
      submitted: allRows.filter((r) => r.status === 'SUBMITTED').length,
      approved: allRows.filter((r) => r.status === 'APPROVED').length,
      archived: allRows.filter((r) => r.status === 'ARCHIVED').length,
    };
  }, [allRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      // Tab filter
      if (activeTab === 'UNDER_REVIEW' && row.status !== 'UNDER_REVIEW') return false;
      if (activeTab === 'RESUBMITTED' && row.status !== 'RESUBMITTED') return false;
      if (activeTab === 'CORRECTION_REQUIRED' && row.status !== 'CORRECTION_REQUIRED') return false;
      if (activeTab === 'SUBMITTED' && row.status !== 'SUBMITTED') return false;
      if (activeTab === 'APPROVED' && row.status !== 'APPROVED') return false;
      if (activeTab === 'ARCHIVED' && row.status !== 'ARCHIVED') return false;

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = row.candidate.name.toLowerCase().includes(q);
        const matchesUid = row.candidate.uid.toLowerCase().includes(q);
        const matchesReg = row.regNumber.toLowerCase().includes(q);
        const matchesInst = row.academic.institution.toLowerCase().includes(q);
        const matchesProg = row.academic.degreeProgram.toLowerCase().includes(q);
        if (!matchesName && !matchesUid && !matchesReg && !matchesInst && !matchesProg) {
          return false;
        }
      }

      // Curricula / Program filter
      if (curriculaFilter !== 'ALL') {
        const progLower = row.academic.degreeProgram.toLowerCase();
        if (curriculaFilter === 'DOC') {
          if (!progLower.includes('doctor') && !progLower.includes('ph.d') && !progLower.includes('phd')) return false;
        } else if (curriculaFilter === 'MASTERS') {
          if (!progLower.includes('master') && !progLower.includes('m.th') && !progLower.includes('m.div') && !progLower.includes('ma ')) return false;
        } else if (curriculaFilter === 'BACHELORS') {
          if (!progLower.includes('bachelor') && !progLower.includes('b.a') && !progLower.includes('b.th')) return false;
        } else {
          if (progLower !== curriculaFilter.toLowerCase()) return false;
        }
      }

      // Institution filter
      if (institutionFilter !== 'ALL') {
        const instLower = row.academic.institution.toLowerCase();
        const selLower = institutionFilter.toLowerCase();
        if (!instLower.includes(selLower) && !selLower.includes(instLower)) return false;
      }

      return true;
    });
  }, [allRows, activeTab, searchQuery, curriculaFilter, institutionFilter, academicYearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, academicYearFilter, institutionFilter, curriculaFilter]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Controlled Unlock Execution
  const handleExecuteControlledUnlock = async () => {
    if (!unlockReason.trim()) {
      alert('Please provide an audited justification for this controlled unlock.');
      return;
    }

    setIsUnlocking(true);
    try {
      await createAuditLog({
        action: 'CONTROLLED_UNLOCK',
        actor_name: user?.full_name || 'Dr. Grace Chen',
        actor_role: 'Chief Academic Administrator',
        entity_type: 'REGISTRATION',
        entity_id: targetUnlockRow?.regNumber || 'REG-UNLOCK',
        target_name: targetUnlockRow?.candidate.name || 'Candidate Dossier',
        target_ref: `Reg #${targetUnlockRow?.regNumber || 'UNASSIGNED'}`,
        target_program: targetUnlockRow?.academic.degreeProgram || 'Theology Program',
        mutation_from: 'LOCKED_FINAL',
        mutation_to: 'CONTROLLED_EDIT',
        details: `Super-Admin Multi-Key authorization ${unlockKey || '#ATH-99-B'} verified. Reason: ${unlockReason}`,
      });

      alert(`Controlled unlock executed successfully for ${targetUnlockRow?.regNumber || 'dossier'}. Dossier state changed to CONTROLLED_EDIT.`);
      setControlledUnlockModalOpen(false);
      setTargetUnlockRow(null);
      setUnlockKey('');
      setUnlockReason('');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Open Direct Dossier Review
  const handleOpenDossier = (row: GovernanceCandidateRow) => {
    const matched = registrations.find(r => r.registration_number === row.regNumber || r.id === row.id);
    if (matched) {
      onSelectRegistration(matched);
    } else {
      onSelectRegistration({
        id: row.id,
        registration_number: row.regNumber,
        student_id: row.candidate.uid,
        institution_id: 'inst-01',
        department_id: 'dept-01',
        program_id: 'prog-01',
        academic_year: '2026-2027',
        registration_type: 'INITIAL_REGISTRATION',
        status: row.status as WorkflowStatus,
        submitted_at: new Date().toISOString(),
        student: {
          id: row.candidate.uid,
          permanent_uid: row.candidate.uid,
          first_name: row.candidate.name.split(' ')[0],
          last_name: row.candidate.name.split(' ').slice(1).join(' ') || 'Scholar',
          email: `${row.candidate.name.toLowerCase().replace(/[^a-z]/g, '')}@saiacs.edu`,
          phone: '+91 98450 12345',
          date_of_birth: '1998-05-14',
          gender: 'Male',
          country: 'India',
          state: 'Karnataka',
          address: 'Box 77, Kothanur Post',
          city: 'Bengaluru',
          pincode: '560077',
        },
        program: {
          id: 'prog-01',
          department_id: 'dept-01',
          name: row.academic.degreeProgram,
          code: 'MTH',
          duration_years: 2,
        },
        institution: {
          id: 'inst-01',
          name: row.academic.institution,
          code: 'SAIACS',
          slug: 'saiacs',
          contact_email: 'registry@saiacs.org',
        },
      } as any);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="uppercase tracking-wider">ATA Governance Registry</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="uppercase tracking-wider">Comprehensive Accreditation Rolls</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold uppercase tracking-wider">Registrations Directory</span>
        </div>
      </div>

      {/* 2. Top Header & Primary Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Registrations Directory
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Official Asia Accreditation Ledger • Real-time Sync</span>
          </div>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Central supervisory register tracking student dossiers across 142 accredited seminaries. Perform
            administrative reviews, issue formal approvals, request corrections, or execute audited controlled unlocks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => alert('Generating official comprehensive Governance Report (.xlsx / .csv)...')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Governance Report <span className="text-slate-400 font-normal">(.xlsx / .csv)</span></span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetUnlockRow(allRows[3] || null);
              setControlledUnlockModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs transition-colors"
          >
            <Lock className="h-4 w-4 text-white" />
            <span>Controlled Unlock Portal</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REGISTERED */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL REGISTERED
              </span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">1,428</span>
              <span className="text-2xl font-bold text-slate-900">Dossiers</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[#006f67] font-semibold">+84 candidates</span>
              <span>submitted this term</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: AWAITING INSPECTION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                AWAITING INSPECTION
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">42</span>
              <span className="text-2xl font-bold text-slate-900">Pending Review</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="text-slate-800 font-bold">● 28 fresh</span>, 14 post-resubmission
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 3: UNDER FORMAL REVISION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                UNDER FORMAL REVISION
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Flag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-rose-600">19 Corrections Flagged</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Awaiting dean responses
            </div>
          </div>
          <div className="h-1 w-12 bg-rose-500 rounded-full mt-4" />
        </div>

        {/* Card 4: ACCREDITED ROLL */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                ACCREDITED ROLL
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-slate-900">1,322 Accredited</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Locked &amp; cryptographically signed
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                onSearchQueryChange?.(e.target.value);
              }}
              placeholder="Search by Candidate Name, Permanent UID, ATA Reg #, or Seminary..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006f67] shadow-2xs"
            />
          </div>

          {/* 3 Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={academicYearFilter}
              onChange={e => setAcademicYearFilter(e.target.value)}
              aria-label="Filter by Academic Year Session"
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer"
            >
              <option value="2026-2027">2026–2027 (Active Session)</option>
              <option value="2025-2026">2025–2026</option>
              <option value="2024-2025">2024–2025</option>
            </select>

            <select
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
              aria-label="Filter by Member Seminary"
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer max-w-[260px] truncate"
            >
              <option value="ALL">All Member Seminaries ({INSTITUTION_NAMES.length})</option>
              {INSTITUTION_NAMES.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>

            <select
              value={curriculaFilter}
              onChange={e => setCurriculaFilter(e.target.value)}
              aria-label="Filter by Curricula Tier or Program"
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer max-w-[260px] truncate"
            >
              <option value="ALL">All Curricula &amp; Programs ({PROGRAM_NAMES.length})</option>
              <optgroup label="Academic Tiers">
                <option value="DOC">Doctoral (Ph.D, D.Min)</option>
                <option value="MASTERS">Masters (M.Th, M.Div)</option>
                <option value="BACHELORS">Bachelors (B.Th, B.Min)</option>
              </optgroup>
              <optgroup label="All Master Programs &amp; Courses (127)">
                {PROGRAM_NAMES.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All ({counts.all.toLocaleString()})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'UNDER_REVIEW'
                ? 'bg-[#191c1e] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Under Review ({counts.underReview})</span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESUBMITTED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'RESUBMITTED'
                ? 'bg-[#006f67] text-white shadow-2xs'
                : 'bg-[#ccfbf1] text-[#0f766e] hover:bg-teal-100'
            }`}
          >
            <span>Resubmitted ({counts.resubmitted})</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CORRECTION_REQUIRED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'CORRECTION_REQUIRED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Correction Required ({counts.correctionRequired})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUBMITTED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'SUBMITTED'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Submitted ({counts.submitted})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Approved ({counts.approved.toLocaleString()})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ARCHIVED'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Archived ({counts.archived})
          </button>
        </div>
      </div>

      {/* 5. Registrations Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length}
                    onChange={handleSelectAll}
                    aria-label="Select all dossiers in view"
                    className="h-4 w-4 rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                  />
                </th>
                <th className="py-3 px-4 font-bold">ATA REG # &amp; TIMESTAMP</th>
                <th className="py-3 px-4 font-bold">CANDIDATE DETAILS</th>
                <th className="py-3 px-4 font-bold">ACCREDITED SEMINARY &amp; PROGRAM</th>
                <th className="py-3 px-4 font-bold">DOSSIER DOCUMENTS</th>
                <th className="py-3 px-4 font-bold">WORKFLOW STATUS</th>
                <th className="py-3 px-4 font-bold text-right">ADMINISTRATIVE ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map(row => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        aria-label={`Select candidate ${row.candidate.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                      />
                    </td>

                    {/* ATA REG # & TIMESTAMP */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(row)}
                          className="font-bold text-slate-900 hover:text-[#006f67] hover:underline block text-left"
                        >
                          {row.regNumber}
                        </button>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          {row.isResubmitted ? (
                            <>
                              <RotateCw className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">{row.timeNote}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{row.timeNote}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* CANDIDATE DETAILS */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                          {row.candidate.avatarUrl ? (
                            <img
                              src={row.candidate.avatarUrl}
                              alt={row.candidate.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-slate-600 text-xs">
                              {row.candidate.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{row.candidate.name}</p>
                          <p className="font-mono text-[11px] text-slate-400">UID: {row.candidate.uid}</p>
                        </div>
                      </div>
                    </td>

                    {/* ACCREDITED SEMINARY & PROGRAM */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{row.academic.degreeProgram}</p>
                        <p className="text-[11px] text-slate-500">{row.academic.institution}</p>
                      </div>
                    </td>

                    {/* DOSSIER DOCUMENTS */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.dossier.badgeVariant === 'blue'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          <span>{row.dossier.verifiedCount} Verified</span>
                        </span>

                        {row.dossier.subNote && (
                          <span className="text-[11px] text-slate-400">
                            {row.dossier.subNote}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* WORKFLOW STATUS */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {row.status === 'RESUBMITTED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ccfbf1] text-[#0f766e]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>RESUBMITTED</span>
                          </span>
                        )}

                        {row.status === 'UNDER_REVIEW' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0369a1]">
                            <span>UNDER_REVIEW</span>
                          </span>
                        )}

                        {row.status === 'CORRECTION_REQUIRED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>CORRECTION_REQ</span>
                          </span>
                        )}

                        {row.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ccfbf1] text-[#0f766e]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>APPROVED</span>
                          </span>
                        )}

                        {row.status === 'SUBMITTED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>SUBMITTED</span>
                          </span>
                        )}

                        {row.statusNote && (
                          <p className="text-[11px] text-rose-600 font-semibold">{row.statusNote}</p>
                        )}

                        {row.certificateNumber && (
                          <p className="font-mono text-[10px] text-slate-400">{row.certificateNumber}</p>
                        )}
                      </div>
                    </td>

                    {/* ADMINISTRATIVE ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.status === 'RESUBMITTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenDossier(row)}
                              className="px-3.5 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs transition-colors"
                            >
                              Review Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Dossier ${row.regNumber} directly approved with executive quorum authority.`);
                              }}
                              aria-label="Direct Approve"
                              className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Direct Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRequestCorrectionRow(row);
                              }}
                              aria-label="Flag Correction"
                              className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Flag Correction"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {row.status === 'UNDER_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenDossier(row)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              Review Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => setRequestCorrectionRow(row)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-colors"
                            >
                              Request Correction
                            </button>
                          </>
                        )}

                        {row.status === 'CORRECTION_REQUIRED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setNotesModalRow(row)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              View Notes
                            </button>
                            <button
                              type="button"
                              onClick={() => setAuditModalRow(row)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              Audit Trail
                            </button>
                          </>
                        )}

                        {row.status === 'APPROVED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUnlockRow(row);
                                setControlledUnlockModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1e293b] text-white text-xs font-semibold hover:bg-slate-900 transition-colors shadow-xs"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>Controlled Unlock</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => alert(`Opening certificate ${row.certificateNumber || 'ATA-CRT-9921'}...`)}
                              aria-label="View Certificate"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                              title="View Certificate"
                            >
                              <Award className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {row.status === 'SUBMITTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenDossier(row)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              Start Review
                            </button>
                            <button
                              type="button"
                              onClick={() => alert(`Reviewer assignment dispatched for ${row.regNumber}.`)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              Assign Reviewer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} candidate dossiers
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

      {/* 6. Bottom Protocol Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              ATA Protocol 22-C: Supervised Controlled Unlock
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved dossiers are permanently immutable unless unlocked via Super-Admin Multi-Key authorization
              with cryptographic justification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/audit-logs';
            }
          }}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span>View Unlock Audit Logs</span>
        </button>
      </div>

      {/* 7. Floating Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#191c1e] text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-black text-[11px] font-extrabold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Candidate dossiers selected
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={() => {
              alert(`Moved ${selectedIds.size} dossiers to UNDER_REVIEW.`);
              setSelectedIds(new Set());
            }}
            className="px-3.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            Batch Move to Review
          </button>

          <button
            type="button"
            onClick={() => {
              alert(`Batch approved ${selectedIds.size} candidate dossiers with cryptographically signed quorum token.`);
              setSelectedIds(new Set());
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#006f67] text-white hover:bg-[#005a54] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Batch Approve</span>
          </button>

          <button
            type="button"
            onClick={() => {
              alert(`Exporting ${selectedIds.size} candidate dossiers...`);
            }}
            aria-label="Export selected dossiers"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Export Selected"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ✕ Deselect All
          </button>
        </div>
      )}

      {/* 8. Modals */}

      {/* Controlled Unlock Modal */}
      {controlledUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Super-Admin Controlled Unlock</h3>
                  <p className="text-xs text-slate-500">ATA Protocol 22-C Security Override</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setControlledUnlockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">CAUTION:</span> Controlled unlock breaks cryptographic immutability of an
              approved registration. Every keystroke, mutation, and state override will be permanently written to the
              public governance audit ledger.
            </div>

            {targetUnlockRow && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-800">{targetUnlockRow.candidate.name}</p>
                <p className="text-slate-500">
                  {targetUnlockRow.regNumber} • {targetUnlockRow.academic.degreeProgram} ({targetUnlockRow.academic.institution})
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Super-Admin Multi-Key Authorization Token
                </label>
                <input
                  type="text"
                  value={unlockKey}
                  onChange={e => setUnlockKey(e.target.value)}
                  placeholder="e.g. #ATH-99-B"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Audited Justification Reason (Required)
                </label>
                <textarea
                  value={unlockReason}
                  onChange={e => setUnlockReason(e.target.value)}
                  rows={3}
                  placeholder="Candidate submitted revised Master's thesis dissertation title per academic board directive..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setControlledUnlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUnlocking}
                onClick={handleExecuteControlledUnlock}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800 disabled:opacity-50 shadow-xs"
              >
                {isUnlocking ? 'Authorizing Unlock...' : 'Authorize Controlled Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flag className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Correction Notes</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <p className="font-bold text-slate-800">{notesModalRow.candidate.name}</p>
              <p className="text-slate-500">{notesModalRow.regNumber} • {notesModalRow.academic.degreeProgram}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 leading-relaxed">
              {notesModalRow.notes || 'No detailed correction notes recorded.'}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setNotesModalRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {auditModalRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-5 w-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-base">Candidate Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <p className="font-bold text-slate-800">{auditModalRow.candidate.name}</p>
              <p className="text-slate-500">{auditModalRow.regNumber} • {auditModalRow.academic.institution}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Initial Dossier Ingestion</p>
                  <p className="text-[11px] text-slate-500">Uploaded via Registrar Portal</p>
                </div>
                <span className="font-mono text-slate-400">Feb 20, 2026</span>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Review Commenced</p>
                  <p className="text-[11px] text-slate-500">Assigned to Dr. Grace Chen</p>
                </div>
                <span className="font-mono text-slate-400">Feb 22, 2026</span>
              </div>

              <div className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-900">Correction Flagged</p>
                  <p className="text-[11px] text-rose-700">Missing Serampore Equivalence Certificate</p>
                </div>
                <span className="font-mono text-rose-600 font-bold">Feb 24, 2026</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setAuditModalRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {requestCorrectionRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flag className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Request Candidate Correction</h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestCorrectionRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <p className="font-bold text-slate-800">{requestCorrectionRow.candidate.name}</p>
              <p className="text-slate-500">{requestCorrectionRow.regNumber} • {requestCorrectionRow.academic.degreeProgram}</p>
            </div>

            <div className="text-xs space-y-1">
              <label className="block font-bold text-slate-700">Deficiency Details / Instructions</label>
              <textarea
                value={correctionReason}
                onChange={e => setCorrectionReason(e.target.value)}
                rows={3}
                placeholder="Transcript seal from university missing page 2 coursework credits..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRequestCorrectionRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Correction notice dispatched to candidate and registrar for ${requestCorrectionRow.regNumber}.`);
                  setRequestCorrectionRow(null);
                  setCorrectionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                Dispatch Correction Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
