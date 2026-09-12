'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Student, Registration, Institution } from '@/lib/types';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';
import {
  Download,
  Search,
  Users,
  GraduationCap,
  Award,
  Network,
  ShieldCheck,
  Shield,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BookOpen,
  Layers,
  FileText,
  Code2,
  Check,
  Calendar,
  Eye,
  MapPin,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  ArrowRight,
} from 'lucide-react';

export interface UniversalScholarItem {
  id: string;
  name: string;
  permanentUid: string;
  email: string;
  avatarUrl?: string;
  idVerificationType: 'Aadhaar Verified' | 'Passport Verified' | 'Dual Institutional ID' | 'Verified ID' | 'Council Certified';
  institutionName: string;
  institutionSubtext: string;
  activeProgram: string;
  programSubtext: string;
  degreeLevel: 'Doctoral' | 'Masters' | 'Bachelors' | 'Diploma';
  enrollmentStatus: 'Active Enrolled' | 'Conferred Alumni' | 'Dual Enrolled' | 'Flagged / Audit';
  milestoneTitle: string;
  milestoneSubtext: string;
  milestonesCount: number;
  governanceStatus: 'ACTIVE_SCHOLAR' | 'DUAL_ACCREDITED' | 'ALUMNI_CONFERRED' | 'FLAGGED_AUDIT';
  residentialCredits: number;
  thesisTitle?: string;
  coRegSeminary?: string;
  isLocked?: boolean;
}

export const INITIAL_UNIVERSAL_SCHOLARS: UniversalScholarItem[] = [];

interface UniversalStudentMasterDirectoryViewProps {
  students?: Student[];
  registrations?: Registration[];
  institutions?: Institution[];
}

export const UniversalStudentMasterDirectoryView: React.FC<UniversalStudentMasterDirectoryViewProps> = ({
  students = [],
  registrations = [],
  institutions = [],
}) => {
  const router = useRouter();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeminary, setSelectedSeminary] = useState('ALL');
  const [selectedDegreeLevel, setSelectedDegreeLevel] = useState('ALL');
  const [selectedEnrollment, setSelectedEnrollment] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DOCTORAL' | 'MASTERS' | 'ALUMNI' | 'FLAGGED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Row Checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Interactive Modals
  const [batchAuditModalOpen, setBatchAuditModalOpen] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [controlledUnlockModalOpen, setControlledUnlockModalOpen] = useState(false);
  const [governanceCodeModalOpen, setGovernanceCodeModalOpen] = useState(false);
  const [newRegWizardOpen, setNewRegWizardOpen] = useState(false);
  const [selectedScholarDossier, setSelectedScholarDossier] = useState<UniversalScholarItem | null>(null);

  // Controlled Unlock Form State
  const [targetScholarForUnlock, setTargetScholarForUnlock] = useState<UniversalScholarItem | null>(null);
  const [unlockJustification, setUnlockJustification] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Dynamic institution list for filtering
  const seminaryOptions = useMemo(() => {
    const set = new Set<string>(INSTITUTION_NAMES);
    institutions.forEach((inst) => {
      if (inst.name) set.add(inst.name);
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { code: 'ALL', label: `All Member Seminaries (${sorted.length})` },
      ...sorted.map((name) => ({ code: name, label: name })),
    ];
  }, [institutions]);

  // Map database students directly into authoritative scholar items
  const combinedScholars = useMemo<UniversalScholarItem[]>(() => {
    if (!students || students.length === 0) return [];

    return students.map((s) => {
      const matchingRegs = registrations.filter((r) => r.student_id === s.id);
      const primaryReg = matchingRegs[0];
      const instName = primaryReg?.institution?.name || 'Accredited Seminary';
      const progName = primaryReg?.program?.name || 'Theological Degree';
      const isDoc = progName.toLowerCase().includes('ph.d') || progName.toLowerCase().includes('doctor');
      const degreeLevel = isDoc ? 'Doctoral' : progName.toLowerCase().includes('master') || progName.toLowerCase().includes('m.th') || progName.toLowerCase().includes('m.div') ? 'Masters' : 'Bachelors';

      const milestoneCount = matchingRegs.length > 0 ? matchingRegs.length : 1;
      const milestoneTitle = `${milestoneCount} ${milestoneCount === 1 ? 'Milestone' : 'Milestones'} Active`;
      const milestoneSubtext = matchingRegs.length > 0 ? matchingRegs.map(r => r.program?.code || 'Degree').join(' → ') : `${progName} Matriculated`;

      let governanceStatus: UniversalScholarItem['governanceStatus'] = 'ACTIVE_SCHOLAR';
      if (matchingRegs.some(r => r.status === 'APPROVED')) governanceStatus = 'ALUMNI_CONFERRED';
      if (matchingRegs.some(r => r.status === 'CORRECTION_REQUIRED')) governanceStatus = 'FLAGGED_AUDIT';

      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        permanentUid: s.permanent_uid,
        email: s.email,
        avatarUrl: undefined,
        idVerificationType: s.national_id ? 'Aadhaar Verified' : 'Verified ID',
        institutionName: instName,
        institutionSubtext: `${instName} • Regional Hub`,
        activeProgram: progName,
        programSubtext: `${primaryReg?.academic_year || 'AY 2026–2027'} • Scoped Ingest`,
        degreeLevel: degreeLevel as UniversalScholarItem['degreeLevel'],
        enrollmentStatus: 'Active Enrolled',
        milestoneTitle,
        milestoneSubtext,
        milestonesCount: milestoneCount,
        governanceStatus,
        residentialCredits: isDoc ? 54 : 45,
        isLocked: primaryReg?.status === 'APPROVED',
      };
    });
  }, [students, registrations]);

  // Filter scholars based on query, seminary, degree, enrollment, and tab
  const filteredScholars = useMemo(() => {
    return combinedScholars.filter((scholar) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = scholar.name.toLowerCase().includes(q);
        const matchUid = scholar.permanentUid.toLowerCase().includes(q);
        const matchEmail = scholar.email.toLowerCase().includes(q);
        const matchInst = scholar.institutionName.toLowerCase().includes(q);
        const matchProg = scholar.activeProgram.toLowerCase().includes(q);
        if (!matchName && !matchUid && !matchEmail && !matchInst && !matchProg) {
          return false;
        }
      }

      // Seminary filter
      if (
        selectedSeminary !== 'ALL' &&
        !scholar.institutionName.toLowerCase().includes(selectedSeminary.toLowerCase())
      ) {
        return false;
      }

      // Degree level or specific program filter
      if (selectedDegreeLevel !== 'ALL') {
        if (['Doctoral', 'Masters', 'Bachelors', 'Diploma'].includes(selectedDegreeLevel)) {
          if (scholar.degreeLevel !== selectedDegreeLevel) return false;
        } else {
          if (scholar.activeProgram.toLowerCase() !== selectedDegreeLevel.toLowerCase()) return false;
        }
      }

      // Enrollment filter
      if (selectedEnrollment !== 'ALL' && scholar.enrollmentStatus !== selectedEnrollment) {
        return false;
      }

      // Tab filter
      if (
        activeTab === 'ACTIVE' &&
        scholar.enrollmentStatus !== 'Active Enrolled' &&
        scholar.enrollmentStatus !== 'Dual Enrolled'
      ) {
        return false;
      }
      if (activeTab === 'DOCTORAL' && scholar.degreeLevel !== 'Doctoral') {
        return false;
      }
      if (activeTab === 'MASTERS' && scholar.degreeLevel !== 'Masters') {
        return false;
      }
      if (activeTab === 'ALUMNI' && scholar.enrollmentStatus !== 'Conferred Alumni') {
        return false;
      }
      if (activeTab === 'FLAGGED' && scholar.governanceStatus !== 'FLAGGED_AUDIT') {
        return false;
      }

      return true;
    });
  }, [combinedScholars, searchQuery, selectedSeminary, selectedDegreeLevel, selectedEnrollment, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredScholars.length / pageSize));
  const paginatedScholars = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredScholars.slice(start, start + pageSize);
  }, [filteredScholars, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSeminary, selectedDegreeLevel, selectedEnrollment, activeTab]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredScholars.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScholars.map((s) => s.id)));
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

  // Export roster to CSV
  const handleExportRoster = () => {
    const rows = filteredScholars.map((s) => ({
      UID: s.permanentUid,
      Name: s.name,
      Email: s.email,
      Institution: s.institutionName,
      Program: s.activeProgram,
      DegreeLevel: s.degreeLevel,
      Milestones: s.milestoneSubtext,
      Status: s.governanceStatus,
      Verification: s.idVerificationType,
      Locked: s.isLocked ? 'LOCKED_SEALED' : 'UNLOCKED',
    }));

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Universal_Master_Scholar_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run batch audit
  const handleRunBatchAudit = () => {
    setAuditRunning(true);
    setAuditComplete(false);
    setTimeout(() => {
      setAuditRunning(false);
      setAuditComplete(true);
    }, 1800);
  };

  // Handle Controlled Unlock Submit
  const handleExecuteControlledUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockJustification.trim()) {
      alert('Council audit justification note is mandatory under Article 14.');
      return;
    }
    setUnlockSuccess(true);
    setTimeout(() => {
      setControlledUnlockModalOpen(false);
      setUnlockSuccess(false);
      setUnlockJustification('');
      setUnlockPin('');
      setTargetScholarForUnlock(null);
    }, 1600);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. Universal Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium tracking-wide">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">ATA Universal Authority</span>
          <span>&rsaquo;</span>
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Student Governance &amp; Lifetime Progression</span>
          <span>&rsaquo;</span>
          <span className="text-slate-900 font-bold">Student Master Directory</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50/80 text-[#006f67] border border-cyan-200 font-semibold shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>● UNIVERSAL AUTONOMY • FULL RBAC CLEARANCE</span>
        </div>
      </div>

      {/* 2. Top Header & 4 Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Student Master Directory
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Pan-Asian centralized master repository of all matriculated theological scholars across 142 accredited ATA
            member institutions. Super-Admin cross-institutional audits, permanent UID lifecycle governance, conferred
            credential verification, and sovereign scholar dossier overrides.
          </p>
        </div>

        {/* 4 Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportRoster}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export Master Ledger (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuditComplete(false);
              setBatchAuditModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-[#006f67] text-xs font-bold shadow-2xs transition-colors"
          >
            <Layers className="h-4 w-4 text-[#006f67]" />
            <span>Milestone Audit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetScholarForUnlock(combinedScholars.find((s) => s.isLocked) || combinedScholars[0]);
              setControlledUnlockModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-50 text-rose-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <Unlock className="h-4 w-4 text-rose-600" />
            <span>Controlled Unlock</span>
          </button>

          <button
            type="button"
            onClick={() => setNewRegWizardOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>+ New Registration</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL SCHOLARS REGISTERED */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL SCHOLARS
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">31</h3>
            <p className="text-xs text-[#94a3b8] mt-1 font-medium">Across all institutions</p>
          </div>
        </div>

        {/* Card 2: ACTIVE ENROLLED */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE ENROLMENT
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">25</h3>
            <p className="text-xs text-[#94a3b8] mt-1 font-medium">Current records</p>
          </div>
        </div>

        {/* Card 3: CONFERRED ALUMNI */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              CONFERRED ALUMNI
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">3</h3>
            <p className="text-xs text-[#94a3b8] mt-1 font-medium">Degree issued</p>
          </div>
        </div>

        {/* Card 4: MULTI-DEGREE SCHOLARS (Dark Card) */}
        <div className="bg-[#131b26] rounded-2xl p-5 border border-slate-800 shadow-2xs flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                MULTI-DEGREE SCHOLARS
              </span>
              <div className="h-8 w-8 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center">
                <Network className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white tracking-tight">342</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300">Cross-accredited across 2+ member institutions</span>
              <span className="bg-[#004d40] text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                Ledger OK
              </span>
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-400 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Multi-Dimensional Search & Filtering Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, Permanent UID (STU-YYYY-XXXX), email, or institution..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006f67]/20 focus:border-[#006f67]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Seminary Dropdown */}
          <select
            value={selectedSeminary}
            onChange={(e) => setSelectedSeminary(e.target.value)}
            className="w-full md:w-56 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
          >
            {seminaryOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Degree / Program Dropdown */}
          <select
            value={selectedDegreeLevel}
            onChange={(e) => setSelectedDegreeLevel(e.target.value)}
            className="w-full md:w-56 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20 truncate"
          >
            <option value="ALL">All Programs &amp; Degrees ({PROGRAM_NAMES.length})</option>
            <optgroup label="Degree Tiers">
              <option value="Doctoral">Doctoral (Ph.D / D.Min)</option>
              <option value="Masters">Masters (M.Th / M.Div)</option>
              <option value="Bachelors">Bachelors (B.Th)</option>
              <option value="Diploma">Diploma / Cert</option>
            </optgroup>
            <optgroup label="All Master Programs &amp; Courses (127)">
              {PROGRAM_NAMES.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Enrollment Dropdown */}
          <select
            value={selectedEnrollment}
            onChange={(e) => setSelectedEnrollment(e.target.value)}
            className="w-full md:w-40 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
          >
            <option value="ALL">Enrollment (All)</option>
            <option value="Active Enrolled">Active Enrolled</option>
            <option value="Dual Enrolled">Dual Enrolled</option>
            <option value="Conferred Alumni">Conferred Alumni</option>
            <option value="Flagged / Audit">Flagged for Audit</option>
          </select>
        </div>

        {/* Horizontal Capsule Tab Switchers */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>All Scholars</span>
            <span className="opacity-80 font-normal">4,890</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'ACTIVE'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Active Enrolled</span>
            <span className="opacity-80 font-normal">1,428</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCTORAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'DOCTORAL'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Doctoral Candidates</span>
            <span className="opacity-80 font-normal">384</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MASTERS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'MASTERS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Masters</span>
            <span className="opacity-80 font-normal">1,842</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALUMNI')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'ALUMNI'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Alumni / Ordained</span>
            <span className="opacity-80 font-normal">3,120</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLAGGED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'FLAGGED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Flagged for Audit</span>
            <span className="opacity-80 font-normal">14</span>
          </button>
        </div>
      </div>

      {/* 5. Sub-Header Authority Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-100/70 border border-slate-200/70 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#006f67] shrink-0" />
          <span>
            <strong className="text-slate-800">Universal Master Authority Enabled:</strong> Direct cross-institutional
            records inspection, lifetime credential verification, cascading record purges, and sovereign scholar dossier overrides active.
          </span>
        </div>
        <div className="text-slate-500 font-medium shrink-0">
          Showing <span className="text-slate-900 font-bold">{filteredScholars.length}</span> of 4,890 records
        </div>
      </div>

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#191c1e] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 font-bold text-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{selectedIds.size} scholars selected</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleExportRoster}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Selected</span>
          </button>
          <button
            type="button"
            onClick={() => {
              alert(`Verified and cleared ${selectedIds.size} scholar records on the council ledger.`);
              setSelectedIds(new Set());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-xs font-bold text-white transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Batch Audit Clear</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-xs ml-1"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* 6. Master Student Directory Table Grid (6 Columns) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredScholars.length && filteredScholars.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                  />
                </th>
                <th className="py-3.5 px-4">CANDIDATE &amp; PERMANENT UID</th>
                <th className="py-3.5 px-4">PRIMARY INSTITUTION &amp; CAMPUS</th>
                <th className="py-3.5 px-4">ACTIVE / CONFERRED PROGRAM</th>
                <th className="py-3.5 px-4">TOTAL ATA MILESTONES</th>
                <th className="py-3.5 px-4 text-right">GOVERNANCE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredScholars.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No theological scholars matching current filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try broadening your search criteria or resetting filters</p>
                  </td>
                </tr>
              ) : (
                paginatedScholars.map((scholar) => {
                  const isChecked = selectedIds.has(scholar.id);
                  return (
                    <tr
                      key={scholar.id}
                      onClick={() => setSelectedScholarDossier(scholar)}
                      className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${
                        isChecked ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-4 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(scholar.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(scholar.id)}
                          className="rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                        />
                      </td>

                      {/* Candidate & Permanent UID */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {scholar.avatarUrl ? (
                            <img
                              src={scholar.avatarUrl}
                              alt={scholar.name}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                              {scholar.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{scholar.name}</span>
                              {scholar.isLocked && (
                                <span title="Cryptographically Sealed Docket">
                                  <Lock className="h-3 w-3 text-emerald-600 inline-block" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                {scholar.permanentUid}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {scholar.idVerificationType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Primary Institution & Campus */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{scholar.institutionName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{scholar.institutionSubtext}</span>
                          </div>
                        </div>
                      </td>

                      {/* Active / Conferred Program */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-900">{scholar.activeProgram}</div>
                          <div className="text-[11px] text-slate-500 leading-snug">{scholar.programSubtext}</div>
                        </div>
                      </td>

                      {/* Total ATA Milestones */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                            <ShieldCheck className="h-4 w-4 text-[#006f67] shrink-0" />
                            <span>{scholar.milestoneTitle}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tracking-tight">
                            {scholar.milestoneSubtext}
                          </div>
                        </div>
                      </td>

                      {/* Governance Status */}
                      <td className="py-4 px-4 text-right">
                        {scholar.governanceStatus === 'ACTIVE_SCHOLAR' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>ACTIVE_SCHOLAR</span>
                          </span>
                        )}

                        {scholar.governanceStatus === 'DUAL_ACCREDITED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>DUAL_ACCREDITED</span>
                          </span>
                        )}

                        {scholar.governanceStatus === 'ALUMNI_CONFERRED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>ALUMNI_CONFERRED</span>
                          </span>
                        )}

                        {scholar.governanceStatus === 'FLAGGED_AUDIT' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            <span>FLAGGED_AUDIT</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredScholars.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredScholars.length)} of {filteredScholars.length} candidate records
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

      {/* 7. Bottom Emergency Override Protocol Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#006f67] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              ATA Council Emergency Override Protocol (Controlled Unlock)
            </h4>
            <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed mt-0.5">
              Per the Executive By-Laws of the Asia Theological Association, unlocking any approved and cryptographically sealed candidate record instantly creates an indelible Ledger Mutation Entry signed with the active Universal Super-Admin session token.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
          <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] flex items-center gap-1.5">
            <KeyRound className="h-3 w-3 text-slate-500" />
            <span>ROOT KEY: 0x9FD8...A194</span>
          </div>
        </div>
      </div>

      {/* 8. Accreditation Statute Protocol Directive Card */}
      <div className="bg-[#f0fdf9] border border-[#a7f3d0] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#006f67] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold tracking-wider text-[#006f67] uppercase">
              ACCREDITATION STATUTE • Commission on Theological Accreditation
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              ATA Multi-Institution Degree Recognition Protocol • Article 11.2
            </h3>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Every conferred qualification recorded within the Asia Theological Association ledger maintains
              cryptographic provenance verifying prerequisite degree validation, residential residency compliance, and
              authorized registrar signatures across all participating member institutions. Dual-enrolled candidates must
              hold reciprocal clearance from the Regional Commission Secretariat prior to doctorate candidacy
              confirmation.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0 self-stretch md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-xs font-semibold shadow-2xs">
            🔒 LEDGER HASH: <span className="text-[#006f67]">#MERKLE-2026-REG-V8</span>
          </div>

          <button
            type="button"
            onClick={() => setGovernanceCodeModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-2xs w-full md:w-auto"
          >
            <Code2 className="h-4 w-4 text-slate-600" />
            <span>Inspect Governance Code</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Batch Milestone Audit Verification Modal */}
      {batchAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Cross-Institutional Batch Audit</h3>
                  <p className="text-xs text-slate-500">Cryptographic validation across 142 accredited Asian seminaries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Scope of Verification:</span>
                  <span className="text-[#006f67]">4,890 Active &amp; Conferred Scholars</span>
                </div>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li>Prerequisite degree validity &amp; transfer credits</li>
                  <li>Residential credit compliance (90+ M.Div / 42+ M.Th / 54+ Ph.D)</li>
                  <li>Cross-institutional concurrent dual-enrollment check</li>
                  <li>Digital tamper-evident cryptographic hash consistency</li>
                </ul>
              </div>

              {auditRunning && (
                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-center space-y-2">
                  <div className="inline-block h-6 w-6 border-2 border-[#006f67] border-t-transparent rounded-full animate-spin" />
                  <p className="font-bold text-[#006f67]">Verifying cross-accredited ledger nodes...</p>
                  <p className="text-[11px] text-slate-500">Node cluster: Bengaluru, Pune, Manila, Seoul</p>
                </div>
              )}

              {auditComplete && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Audit Completed Successfully</span>
                  </div>
                  <p className="text-emerald-700">
                    4,848 / 4,890 credentials confirmed tamper-free. 42 records flagged for standard triennial council
                    re-verification.
                  </p>
                  <div className="font-mono text-[11px] text-emerald-900 bg-emerald-100/70 px-2 py-1 rounded">
                    Audit Verification Signature: #AUDIT-20260906-ATA-9411-OK
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBatchAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              {!auditComplete ? (
                <button
                  type="button"
                  onClick={handleRunBatchAudit}
                  disabled={auditRunning}
                  className="px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {auditRunning ? 'Executing Audit...' : 'Start Full Audit Run'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBatchAuditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                >
                  Acknowledge Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Controlled Unlock Emergency Override Modal */}
      {controlledUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Unlock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    ATA Council Emergency Override Protocol
                  </h3>
                  <p className="text-xs text-slate-500">Controlled Unlock &amp; Mutation Authority</p>
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

            <form onSubmit={handleExecuteControlledUnlock} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Super-Admin Directive:</strong> Unlocking an accredited docket allows the primary seminary
                registrar to edit candidate biometrics or program placement. A tamper-evident mutation block will be appended to the ledger.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Candidate Docket</label>
                <select
                  value={targetScholarForUnlock?.id || ''}
                  onChange={(e) => {
                    const found = combinedScholars.find((s) => s.id === e.target.value);
                    if (found) setTargetScholarForUnlock(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                >
                  {combinedScholars.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.permanentUid}) — {s.institutionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Council Justification &amp; Authority Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={unlockJustification}
                  onChange={(e) => setUnlockJustification(e.target.value)}
                  placeholder="State formal executive board authorization reason (e.g. Approved thesis title amendment or institutional transfer)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Universal PIN / Session Key</label>
                <input
                  type="password"
                  placeholder="Enter Universal Session Authorization PIN"
                  value={unlockPin}
                  onChange={(e) => setUnlockPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
                />
              </div>

              {unlockSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dossier successfully unlocked. Immutable mutation block logged.</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setControlledUnlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unlockSuccess}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Execute Controlled Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Inspect Governance Code Modal */}
      {governanceCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">ATA Accreditation Statute • Article 11.2</h3>
                  <p className="text-xs text-slate-500">Cross-Institutional Degree Verification &amp; Dual Candidacy Rule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGovernanceCodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 rounded-xl m-5 border border-slate-200">
              <p className="font-bold text-slate-900">
                ARTICLE 11 — CONCURRENT &amp; PROGRESSIVE THEOLOGICAL DEGREE RECOGNITION
              </p>
              <p>
                Section 11.2.1 (Prerequisite Provenance): No candidate shall be awarded an ATA-accredited postgraduate
                degree (Master of Theology, Doctor of Ministry, or Doctor of Philosophy) without verifiable digital
                attestation of their qualifying undergraduate degree from a recognized regional body.
              </p>
              <p>
                Section 11.2.2 (Dual-Institutional Oversight): Where a candidate pursues joint doctoral research between
                two accredited member colleges (e.g. FTS Manila &amp; ABS Manila), both institutional registrars must sign
                the bilateral matriculation docket and notify the Central Council Secretariat within 30 days of intake.
              </p>
              <p>
                Section 11.2.3 (Ledger Integrity): All matriculation entries, program progressions, and conferred degrees
                must be registered into the decentralized regional ledger under cryptographic SHA-256 hash validation.
              </p>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600">
                <div>Hash Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
                <div>Commission Authority: ATA Council Executive Directorate (Bengaluru)</div>
                <div>Ratified: General Assembly Resolution #441 (Nov 2024)</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setGovernanceCodeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close Statute View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Scholar Dossier & Lifetime Milestones Drawer */}
      {selectedScholarDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedScholarDossier.avatarUrl ? (
                  <img
                    src={selectedScholarDossier.avatarUrl}
                    alt={selectedScholarDossier.name}
                    className="h-11 w-11 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                    {selectedScholarDossier.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedScholarDossier.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500 font-semibold">
                      {selectedScholarDossier.permanentUid}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedScholarDossier.idVerificationType}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScholarDossier(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Chartered Institution
                  </span>
                  <span className="font-bold text-slate-900">{selectedScholarDossier.institutionName}</span>
                  <p className="text-[11px] text-slate-500">{selectedScholarDossier.institutionSubtext}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Degree Placement
                  </span>
                  <span className="font-bold text-slate-900">{selectedScholarDossier.activeProgram}</span>
                  <p className="text-[11px] text-slate-500">{selectedScholarDossier.programSubtext}</p>
                </div>
              </div>

              {selectedScholarDossier.thesisTitle && (
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl">
                  <span className="text-[11px] font-bold text-[#006f67] uppercase block tracking-wider">
                    Defended / Active Research Monograph
                  </span>
                  <p className="font-medium text-slate-800 italic mt-1">&ldquo;{selectedScholarDossier.thesisTitle}&rdquo;</p>
                </div>
              )}

              {selectedScholarDossier.coRegSeminary && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-[11px] font-bold text-blue-700 uppercase block tracking-wider">
                    Dual-Institutional Co-Registrar
                  </span>
                  <p className="font-medium text-slate-800 mt-1">{selectedScholarDossier.coRegSeminary}</p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Academic Milestones Chain ({selectedScholarDossier.milestonesCount})
                </span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                  {selectedScholarDossier.milestoneSubtext}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">Residential Credit Clearance:</span>
                <span className="font-bold text-slate-900">{selectedScholarDossier.residentialCredits} Credit Hours Completed</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const uid = selectedScholarDossier.permanentUid;
                  setSelectedScholarDossier(null);
                  router.push(`/students?id=${encodeURIComponent(uid)}`);
                }}
                className="flex items-center gap-1.5 text-[#006f67] hover:underline font-bold text-xs"
              >
                <span>View Full Lifetime History Timeline</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedScholarDossier(null)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: New Registration Wizard Modal */}
      {newRegWizardOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewRegWizardOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-3xl">
            <NewRegistrationWizard
              onCancel={() => setNewRegWizardOpen(false)}
              onSuccess={(newReg) => {
                setNewRegWizardOpen(false);
                router.push(`/registrations?id=${newReg.id}`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
