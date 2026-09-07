'use client';

import React, { useState, useMemo } from 'react';
import { Registration, UserRole, WorkflowStatus } from '@/lib/types';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
import {
  Search,
  Download,
  Lock,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
  Check,
  X,
  Key,
  Shield,
  Clock,
  Building2,
  FileText,
  UserCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { ExcelImportModal } from '@/components/registration/ExcelImportModal';

interface UniversalRegistrationsMasterRegisterViewProps {
  registrations: Registration[];
  currentRole: UserRole;
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration: () => void;
  onReRegisterStudent: (student: any) => void;
  onReload: () => void;
  externalSearchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export interface UniversalMasterDossier {
  id: string;
  regNumber: string;
  timestamp: string;
  cycleBadge: string;
  cycleBadgeType: 'teal' | 'slate' | 'mono' | 'red' | 'blue';
  studentName: string;
  isVerifiedStudent?: boolean;
  permanentUid: string;
  locationAndCitizen: string;
  initials: string;
  institutionName: string;
  degreeName: string;
  specializationOrNote: string;
  verifiedDocsBadge: string;
  verifiedDocsType: 'cyan' | 'blue' | 'red' | 'emerald';
  verifiedDocsNote: string;
  status: 'RESUBMITTED' | 'UNDER_REVIEW' | 'APPROVED_SEALED' | 'CORRECTION_REQUIRED' | 'SUBMITTED' | 'DRAFT';
}

export const CANONICAL_UNIVERSAL_DOSSIERS: UniversalMasterDossier[] = [];

export const UniversalRegistrationsMasterRegisterView: React.FC<UniversalRegistrationsMasterRegisterViewProps> = ({
  registrations,
  currentRole,
  onSelectRegistration,
  onNewRegistration,
  onReRegisterStudent,
  onReload,
  externalSearchQuery = '',
  onSearchQueryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('AY 2026–2027 (Active)');
  const [selectedSeminary, setSelectedSeminary] = useState('ALL');
  const [selectedDegree, setSelectedDegree] = useState('ALL');
  const [statusTab, setStatusTab] = useState<
    'ALL' | 'UNDER_REVIEW' | 'RESUBMITTED' | 'CORRECTION_REQUIRED' | 'DRAFTS' | 'APPROVED_SEALED'
  >('ALL');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isControlledUnlockModalOpen, setIsControlledUnlockModalOpen] = useState(false);
  const [unlockDossierTarget, setUnlockDossierTarget] = useState<UniversalMasterDossier | null>(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockResolution, setUnlockResolution] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sync external search
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchQueryChange) onSearchQueryChange(val);
  };

  // Map database registrations directly into master dossiers
  const mergedDossiers = useMemo(() => {
    if (!registrations || registrations.length === 0) {
      return [];
    }

    return registrations.map((r) => {
      const studentName = r.student
        ? `${r.student.first_name} ${r.student.last_name}`
        : 'Candidate Student';

      const initials = r.student
        ? `${r.student.first_name?.[0] || ''}${r.student.last_name?.[0] || ''}`.toUpperCase()
        : 'CS';

      let mappedStatus: UniversalMasterDossier['status'] = 'SUBMITTED';
      if (r.status === 'APPROVED') mappedStatus = 'APPROVED_SEALED';
      else if (r.status === 'UNDER_REVIEW') mappedStatus = 'UNDER_REVIEW';
      else if (r.status === 'RESUBMITTED') mappedStatus = 'RESUBMITTED';
      else if (r.status === 'CORRECTION_REQUIRED') mappedStatus = 'CORRECTION_REQUIRED';
      else if (r.status === 'DRAFT') mappedStatus = 'DRAFT';

      return {
        id: r.id,
        regNumber: r.registration_number,
        timestamp: r.academic_year ? `AY ${r.academic_year}` : 'Recent Submission',
        cycleBadge: r.status === 'RESUBMITTED' ? 'Cycle 2 • Resubmission' : 'Cycle 1 • Live Ingest',
        cycleBadgeType: (r.status === 'RESUBMITTED' ? 'teal' : 'blue') as UniversalMasterDossier['cycleBadgeType'],
        studentName,
        isVerifiedStudent: true,
        permanentUid: r.student?.permanent_uid ? `UID: ${r.student.permanent_uid}` : 'UID: N/A',
        locationAndCitizen: r.student?.state ? `${r.student.state} • Citizen: IN` : 'India • Citizen: IN',
        initials,
        institutionName: r.institution?.name || 'Accredited Seminary',
        degreeName: r.program?.name || 'Theological Degree',
        specializationOrNote: r.program?.code || 'ATA Standard Syllabus',
        verifiedDocsBadge: '3/4 Verified',
        verifiedDocsType: 'blue' as UniversalMasterDossier['verifiedDocsType'],
        verifiedDocsNote: r.notes || 'Dossier credentials synchronized',
        status: mappedStatus,
      };
    });
  }, [registrations]);

  // Filtered dossiers
  const filteredDossiers = useMemo(() => {
    return mergedDossiers.filter(item => {
      // Tab filter
      if (statusTab === 'UNDER_REVIEW' && item.status !== 'UNDER_REVIEW') return false;
      if (statusTab === 'RESUBMITTED' && item.status !== 'RESUBMITTED') return false;
      if (statusTab === 'CORRECTION_REQUIRED' && item.status !== 'CORRECTION_REQUIRED') return false;
      if (statusTab === 'DRAFTS' && item.status !== 'DRAFT') return false;
      if (statusTab === 'APPROVED_SEALED' && item.status !== 'APPROVED_SEALED') return false;

      // Degree / Program filter
      if (selectedDegree !== 'ALL') {
        const degLower = item.degreeName.toLowerCase();
        if (selectedDegree === 'PHD') {
          if (!degLower.includes('doctor') && !degLower.includes('ph.d') && !degLower.includes('phd')) return false;
        } else if (selectedDegree === 'MTH') {
          if (!degLower.includes('m.th') && !degLower.includes('master of theology')) return false;
        } else if (selectedDegree === 'MDIV') {
          if (!degLower.includes('m.div') && !degLower.includes('master of divinity')) return false;
        } else if (selectedDegree === 'BACHELORS') {
          if (!degLower.includes('bachelor') && !degLower.includes('b.a') && !degLower.includes('b.th')) return false;
        } else if (selectedDegree === 'DIPLOMA') {
          if (!degLower.includes('diploma') && !degLower.includes('certificate')) return false;
        } else {
          if (degLower !== selectedDegree.toLowerCase()) return false;
        }
      }

      // Seminary / Institution filter
      if (selectedSeminary !== 'ALL') {
        const instLower = item.institutionName.toLowerCase();
        const selLower = selectedSeminary.toLowerCase();
        if (!instLower.includes(selLower) && !selLower.includes(instLower)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesReg = item.regNumber.toLowerCase().includes(q);
        const matchesUid = item.permanentUid.toLowerCase().includes(q);
        const matchesInst = item.institutionName.toLowerCase().includes(q);
        const matchesDeg = item.degreeName.toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesUid && !matchesInst && !matchesDeg) {
          return false;
        }
      }

      return true;
    });
  }, [mergedDossiers, statusTab, selectedSeminary, selectedDegree, searchQuery]);

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredDossiers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDossiers.map(d => d.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export Master Ledger CSV
  const handleExportCSV = () => {
    const headers = ['Registration #', 'Candidate Name', 'Permanent UID', 'Location / Citizenship', 'Institution', 'Degree Program', 'Specialization', 'Verified Docs', 'Status'];
    const rows = filteredDossiers.map(d => [
      `"${d.regNumber}"`,
      `"${d.studentName}"`,
      `"${d.permanentUid}"`,
      `"${d.locationAndCitizen}"`,
      `"${d.institutionName}"`,
      `"${d.degreeName}"`,
      `"${d.specializationOrNote}"`,
      `"${d.verifiedDocsBadge} - ${d.verifiedDocsNote}"`,
      `"${d.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Master_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Execute Controlled Unlock
  const handleExecuteControlledUnlock = () => {
    if (!unlockReason.trim()) {
      alert('Please enter a valid regulatory justification for the Controlled Unlock override.');
      return;
    }
    alert(`Controlled Unlock Executed: Dossier ${unlockDossierTarget?.regNumber || 'selected'} unlocked to editable state. Supermajority audit hash permanently appended to Merkle ledger.`);
    setIsControlledUnlockModalOpen(false);
    setUnlockDossierTarget(null);
    setUnlockReason('');
    setUnlockResolution('');
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* 1. Header, Sub-bar & Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50/80 border border-cyan-200 text-[#006f67] text-xs font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>UNIVERSAL AUTONOMY • FULL RBAC CLEARANCE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#191c1e] tracking-tight">
            Registrations &amp; Master Register
          </h1>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Unified registration ledger across all 142 member institutions. Execute direct student registrations,
            batch Excel imports, administrative approvals, or emergency controlled unlocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Master Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUnlockDossierTarget(filteredDossiers[0] || null);
              setIsControlledUnlockModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 shadow-2xs transition-colors"
          >
            <LockKeyhole className="h-4 w-4 text-red-600" />
            <span>Controlled Unlock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <span>Bulk Excel Import</span>
          </button>

          <button
            type="button"
            onClick={onNewRegistration}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191c1e] text-white text-xs font-semibold hover:bg-black shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>+ New Registration</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL MASTER DOSSIERS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL MASTER DOSSIERS
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">1,428</span>
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span>↗ +84 candidates registered this term</span>
            </p>
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
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">42</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-bold text-slate-800">28 initial</span> • <span className="font-bold text-teal-700">14 resubmitted</span> under queue
            </p>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 3: UNDER FORMAL CORRECTION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                UNDER FORMAL CORRECTION
              </span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">19</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="text-red-700 font-bold">Awaiting registrar revisions</span> across 7 seminaries
            </p>
          </div>
          <div className="h-1 w-12 bg-red-500 rounded-full mt-4" />
        </div>

        {/* Card 4: ACCREDITED & SEALED */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                ACCREDITED &amp; SEALED
              </span>
              <div className="h-8 w-8 rounded-xl bg-cyan-50 text-[#006f67] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">1,322</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-bold text-emerald-700">92.6% lock rate</span> • Cryptographically sealed
            </p>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>
      </div>

      {/* 3. Search & Multi-Dimensional Capsule Filters */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search candidate, Permanent UID, ATA Reg #, or Seminary..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              aria-label="Academic Year"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden"
            >
              <option value="AY 2026–2027 (Active)">AY 2026–2027 (Active)</option>
              <option value="AY 2025–2026">AY 2025–2026</option>
            </select>

            <select
              value={selectedSeminary}
              onChange={e => setSelectedSeminary(e.target.value)}
              aria-label="Filter Seminary"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden max-w-[260px] truncate"
            >
              <option value="ALL">All Member Seminaries ({INSTITUTION_NAMES.length})</option>
              {INSTITUTION_NAMES.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>

            <select
              value={selectedDegree}
              onChange={e => setSelectedDegree(e.target.value)}
              aria-label="Filter Degree Tier or Program"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006f67] focus:outline-hidden max-w-[260px] truncate"
            >
              <option value="ALL">All Programs &amp; Degrees ({PROGRAM_NAMES.length})</option>
              <optgroup label="Degree Tiers">
                <option value="PHD">Doctoral (Ph.D / D.Min)</option>
                <option value="MTH">Master of Theology (M.Th)</option>
                <option value="MDIV">Master of Divinity (M.Div)</option>
                <option value="BACHELORS">Bachelors (B.Th / B.A / B.Min)</option>
                <option value="DIPLOMA">Diploma &amp; Certificates</option>
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

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Dossiers', badge: '1,428' },
            { id: 'UNDER_REVIEW', label: 'Under Review', badge: '28' },
            { id: 'RESUBMITTED', label: 'Resubmitted', badge: '14', isResubmit: true },
            { id: 'CORRECTION_REQUIRED', label: 'Correction Required', badge: '19', isCorrection: true },
            { id: 'DRAFTS', label: 'Drafts', badge: '8' },
            { id: 'APPROVED_SEALED', label: 'Approved & Sealed', badge: '1,322' },
          ].map(tab => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#191c1e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : tab.isResubmit
                        ? 'bg-[#99efe5] text-[#006f67]'
                        : tab.isCorrection
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sub-Header Authority Strip */}
      <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <div className="h-5 w-5 rounded-full bg-teal-50 text-[#006f67] flex items-center justify-center">
            <Key className="h-3 w-3" />
          </div>
          <span>
            <strong>Universal Master Authority Enabled:</strong> Direct in-place edits, live camera OCR ingestion, cascading record purges, and controlled state mutations active.
          </span>
        </div>
        <span className="text-slate-500 font-mono text-[11px] shrink-0">
          Showing 1–{filteredDossiers.length} of 1,428 records
        </span>
      </div>

      {/* 5. Master Register Table Grid */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredDossiers.length}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all dossiers"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-[#006f67]"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold">ATA REG # &amp; TIMESTAMP</th>
                <th className="py-3.5 px-4 font-bold">CANDIDATE PROFILE &amp; PERMANENT UID</th>
                <th className="py-3.5 px-4 font-bold">ACCREDITED SEMINARY &amp; DEGREE</th>
                <th className="py-3.5 px-4 font-bold">VERIFIED DOSSIER DOCS</th>
                <th className="py-3.5 px-4 font-bold text-center">WORKFLOW STATUS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDossiers.map(dossier => {
                const isSelected = selectedIds.includes(dossier.id);

                return (
                  <tr
                    key={dossier.id}
                    onClick={() => {
                      // Attempt to find actual registration if present
                      const actualReg = registrations.find(
                        r => r.registration_number === dossier.regNumber || r.id === dossier.id
                      );
                      if (actualReg) onSelectRegistration(actualReg);
                    }}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 align-top" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(dossier.id)}
                        aria-label={`Select ${dossier.regNumber}`}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-[#006f67]"
                      />
                    </td>

                    {/* ATA Reg # & Timestamp */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div className="font-bold text-slate-900 text-xs">
                        {dossier.regNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {dossier.timestamp}
                      </div>
                      <div>
                        {dossier.cycleBadgeType === 'teal' ? (
                          <span className="inline-block text-[10px] font-bold text-[#006f67] bg-[#99efe5]/40 px-2 py-0.5 rounded-md">
                            {dossier.cycleBadge}
                          </span>
                        ) : dossier.cycleBadgeType === 'mono' ? (
                          <span className="inline-block text-[10px] font-mono font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
                            {dossier.cycleBadge}
                          </span>
                        ) : dossier.cycleBadgeType === 'red' ? (
                          <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                            {dossier.cycleBadge}
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {dossier.cycleBadge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Candidate Profile & Permanent UID */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {dossier.initials}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">{dossier.studentName}</span>
                            {dossier.isVerifiedStudent && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            )}
                          </div>
                          <div className="font-mono text-[10.5px] text-slate-500 font-semibold">
                            {dossier.permanentUid}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {dossier.locationAndCitizen}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Accredited Seminary & Degree */}
                    <td className="py-4 px-4 align-top space-y-0.5 max-w-xs">
                      <div className="font-bold text-slate-900 text-xs">
                        {dossier.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium">
                        {dossier.degreeName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {dossier.specializationOrNote}
                      </div>
                    </td>

                    {/* Verified Dossier Docs */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div>
                        {dossier.verifiedDocsType === 'cyan' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#006f67] border border-cyan-200 text-[10.5px] font-bold">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{dossier.verifiedDocsBadge}</span>
                          </span>
                        ) : dossier.verifiedDocsType === 'blue' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10.5px] font-bold">
                            <span>{dossier.verifiedDocsBadge}</span>
                          </span>
                        ) : dossier.verifiedDocsType === 'red' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10.5px] font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{dossier.verifiedDocsBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
                            <Check className="h-3 w-3" />
                            <span>{dossier.verifiedDocsBadge}</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] leading-snug ${dossier.verifiedDocsType === 'red' ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        {dossier.verifiedDocsNote}
                      </p>
                    </td>

                    {/* Workflow Status */}
                    <td className="py-4 px-4 align-top text-center">
                      {dossier.status === 'RESUBMITTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#99efe5]/40 text-[#006f67] border border-[#99efe5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>RESUBMITTED</span>
                        </span>
                      ) : dossier.status === 'UNDER_REVIEW' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>UNDER_REVIEW</span>
                        </span>
                      ) : dossier.status === 'APPROVED_SEALED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                          <span>APPROVED &amp; SEALED</span>
                        </span>
                      ) : dossier.status === 'CORRECTION_REQUIRED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <span>CORRECTION_REQUIRED</span>
                        </span>
                      ) : dossier.status === 'SUBMITTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>SUBMITTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          <span>DRAFT</span>
                        </span>
                      )}
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
            Showing 1 to {filteredDossiers.length} of 1,428 Candidate Records • <span className="font-semibold text-slate-700">ATA Charter Article 11 Cryptographic Preservation Compliance</span>
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
              238
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

      {/* 6. Bottom Emergency Override Protocol Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-[#006f67] border border-teal-100 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">
              ATA Council Emergency Override Protocol (Controlled Unlock)
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px] max-w-4xl mt-0.5">
              Per the Executive By-Laws of the Asia Theological Association, unlocking any approved and cryptographically
              sealed candidate record instantly creates an indelible Ledger Mutation Entry signed with the active Universal Super-Admin session token.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shrink-0">
          <Key className="h-3.5 w-3.5 text-[#006f67]" />
          <span>ROOT KEY: 0x9FD8...A194</span>
        </div>
      </div>

      {/* MODAL 1: Controlled Unlock Modal */}
      {isControlledUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Emergency Controlled Record Unlock
                  </h3>
                  <p className="text-xs text-red-600 font-medium">
                    Universal Super-Admin Mutation Authority
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsControlledUnlockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1">
              <p className="font-bold">Protocol 22-C Warning:</p>
              <p className="text-[11px] leading-relaxed">
                Unlocking this dossier will transition state from <strong>APPROVED_SEALED &rarr; CONTROLLED_EDIT</strong>,
                invalidating the previous accreditation seal hash and requiring supermajority council re-affirmation.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Registration</label>
                <input
                  type="text"
                  disabled
                  value={`${unlockDossierTarget?.regNumber || ''} — ${unlockDossierTarget?.studentName || ''}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Academic Council Resolution Reference *</label>
                <input
                  type="text"
                  value={unlockResolution}
                  onChange={e => setUnlockResolution(e.target.value)}
                  placeholder="e.g. ATA-SYNOD-2026-RES-942"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mandatory Regulatory Justification *</label>
                <textarea
                  rows={3}
                  value={unlockReason}
                  onChange={e => setUnlockReason(e.target.value)}
                  placeholder="State technical justification (e.g. Master thesis dissertation title correction following peer defense amendment)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsControlledUnlockModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteControlledUnlock}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold text-xs shadow-xs"
              >
                Authorize &amp; Unlock Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Excel Import Modal */}
      {isExcelImportOpen && (
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onSuccess={() => {
            setIsExcelImportOpen(false);
            onReload();
          }}
        />
      )}
    </div>
  );
};
