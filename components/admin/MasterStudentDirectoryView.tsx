'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Student, Registration, Institution, WorkflowStatus } from '@/lib/types';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
import {
  Download,
  Search,
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Loader2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Derived, plain-language scholar model built ONLY from real DB records.     */
/* -------------------------------------------------------------------------- */

type ScholarStatus = 'Active' | 'Conferred' | 'Flagged' | 'Draft' | 'Archived';
type DegreeLevel = 'Doctoral' | 'Masters' | 'Bachelors' | 'Diploma' | 'Unknown';

interface ScholarRow {
  id: string;
  uid: string;
  name: string;
  email: string;
  idVerified: boolean;
  institutionName: string | null;
  programName: string | null;
  programIntake: string | null;
  degreeLevel: DegreeLevel;
  status: ScholarStatus;
  // The registration this row's contextual action operates on (existing workflow).
  primaryRegistration: Registration | null;
}

const CONFERRED_STATUSES: WorkflowStatus[] = ['APPROVED', 'GRADUATED', 'COMPLETED'];
const ACTIVE_STATUSES: WorkflowStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'];

function deriveDegreeLevel(programName?: string | null, degreeLevel?: string | null): DegreeLevel {
  const p = `${programName || ''} ${degreeLevel || ''}`.toLowerCase();
  if (!p.trim()) return 'Unknown';
  if (p.includes('ph.d') || p.includes('phd') || p.includes('doctor') || p.includes('d.min') || p.includes('doctoral')) return 'Doctoral';
  if (p.includes('master') || p.includes('m.th') || p.includes('m.div') || p.includes('m.a') || p.includes('postgrad')) return 'Masters';
  if (p.includes('bachelor') || p.includes('b.th') || p.includes('b.a') || p.includes('undergrad')) return 'Bachelors';
  if (p.includes('diploma') || p.includes('cert')) return 'Diploma';
  return 'Unknown';
}

// Pick the registration that best represents the scholar's current standing and
// choose a single plain-language status with clear precedence.
function deriveStatusAndPrimary(regs: Registration[]): { status: ScholarStatus; primary: Registration | null } {
  if (regs.length === 0) return { status: 'Active', primary: null };

  const byStatus = (test: (s: WorkflowStatus) => boolean) => regs.find((r) => test(r.status));

  const flagged = byStatus((s) => s === 'CORRECTION_REQUIRED');
  if (flagged) return { status: 'Flagged', primary: flagged };

  const active = byStatus((s) => ACTIVE_STATUSES.includes(s));
  if (active) return { status: 'Active', primary: active };

  const conferred = byStatus((s) => CONFERRED_STATUSES.includes(s));
  if (conferred) return { status: 'Conferred', primary: conferred };

  const draft = byStatus((s) => s === 'DRAFT');
  if (draft) return { status: 'Draft', primary: draft };

  const archived = byStatus((s) => s === 'ARCHIVED' || s === 'TRANSFERRED' || s === 'NOT_COMPLETED');
  if (archived) return { status: 'Archived', primary: archived };

  return { status: 'Active', primary: regs[0] };
}

const STATUS_PILL: Record<ScholarStatus, { label: string; cls: string; dot: string }> = {
  Active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Conferred: { label: 'Conferred', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  Flagged: { label: 'Flagged', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  Archived: { label: 'Archived', cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

/* -------------------------------------------------------------------------- */

interface MasterStudentDirectoryViewProps {
  students?: Student[];
  registrations?: Registration[];
  institutions?: Institution[];
  onRefresh?: () => void;
}

type TabId = 'ALL' | 'ACTIVE' | 'DOCTORAL' | 'MASTERS' | 'ALUMNI' | 'FLAGGED';

export const MasterStudentDirectoryView: React.FC<MasterStudentDirectoryViewProps> = ({
  students = [],
  registrations = [],
  institutions = [],
  onRefresh,
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ScholarStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Contextual action state (operates through the existing registration workflow).
  const [confirmAction, setConfirmAction] = useState<{ row: ScholarRow; type: 'APPROVE' | 'FLAG' } | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /* Build scholar rows from real students + their registrations. --------- */
  const scholars = useMemo<ScholarRow[]>(() => {
    return students.map((s) => {
      const regs = registrations
        .filter((r) => r.student_id === s.id)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      const { status, primary } = deriveStatusAndPrimary(regs);
      const anyReg = primary || regs[0] || null;
      return {
        id: s.id,
        uid: s.permanent_uid,
        name: `${s.first_name} ${s.last_name}`.trim(),
        email: s.email,
        idVerified: Boolean(s.national_id),
        institutionName: anyReg?.institution?.name || null,
        programName: anyReg?.program?.name || null,
        programIntake: anyReg?.academic_year ? anyReg.academic_year.slice(0, 4) : null,
        degreeLevel: deriveDegreeLevel(anyReg?.program?.name, anyReg?.program?.degree_level),
        status,
        primaryRegistration: anyReg,
      };
    });
  }, [students, registrations]);

  /* Real, data-backed enrolment overview metrics. ------------------------ */
  const metrics = useMemo(() => {
    return {
      total: scholars.length,
      active: scholars.filter((s) => s.status === 'Active').length,
      conferred: scholars.filter((s) => s.status === 'Conferred').length,
      flagged: scholars.filter((s) => s.status === 'Flagged').length,
    };
  }, [scholars]);

  /* Filter option lists: authoritative shared catalogs (same source used across
     the registrar pages), merged with any values actually present in the data. */
  const institutionOptions = useMemo(() => {
    const names = new Set<string>(INSTITUTION_NAMES);
    scholars.forEach((s) => s.institutionName && names.add(s.institutionName));
    institutions.forEach((i) => names.add(i.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [scholars, institutions]);

  const programOptions = useMemo(() => {
    const names = new Set<string>(PROGRAM_NAMES);
    scholars.forEach((s) => s.programName && names.add(s.programName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [scholars]);

  /* Tab counts from real data. ------------------------------------------- */
  const tabCounts = useMemo(() => ({
    ALL: scholars.length,
    ACTIVE: scholars.filter((s) => s.status === 'Active').length,
    DOCTORAL: scholars.filter((s) => s.degreeLevel === 'Doctoral').length,
    MASTERS: scholars.filter((s) => s.degreeLevel === 'Masters').length,
    ALUMNI: scholars.filter((s) => s.status === 'Conferred').length,
    FLAGGED: scholars.filter((s) => s.status === 'Flagged').length,
  }), [scholars]);

  /* Filtering + sorting. ------------------------------------------------- */
  const filtered = useMemo(() => {
    const list = scholars.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hit =
          s.name.toLowerCase().includes(q) ||
          s.uid.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.institutionName || '').toLowerCase().includes(q) ||
          (s.programName || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (institutionFilter !== 'ALL' && s.institutionName !== institutionFilter) return false;
      if (programFilter !== 'ALL' && s.programName !== programFilter) return false;
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

      if (activeTab === 'ACTIVE' && s.status !== 'Active') return false;
      if (activeTab === 'DOCTORAL' && s.degreeLevel !== 'Doctoral') return false;
      if (activeTab === 'MASTERS' && s.degreeLevel !== 'Masters') return false;
      if (activeTab === 'ALUMNI' && s.status !== 'Conferred') return false;
      if (activeTab === 'FLAGGED' && s.status !== 'Flagged') return false;
      return true;
    });
    // Preserve the student ordering from the API (already newest-first).
    return sortOrder === 'OLDEST' ? [...list].reverse() : list;
  }, [scholars, searchQuery, institutionFilter, programFilter, statusFilter, activeTab, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetToFirstPage = useCallback(() => setCurrentPage(1), []);

  /* Export the currently filtered roster (real data). -------------------- */
  const handleExportRoster = () => {
    const headers = ['Permanent UID', 'Name', 'Email', 'Institution', 'Programme', 'Intake', 'Status'];
    const rows = filtered.map((s) => [
      s.uid,
      s.name,
      s.email,
      s.institutionName || '',
      s.programName || '',
      s.programIntake || '',
      s.status,
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar_roster_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openDetail = (row: ScholarRow) => {
    router.push(`/students?id=${encodeURIComponent(row.uid)}`);
  };

  /* Contextual action executed through the EXISTING registration workflow. */
  const runAction = async () => {
    if (!confirmAction || !confirmAction.row.primaryRegistration) {
      setConfirmAction(null);
      return;
    }
    const { row, type } = confirmAction;
    const reg = row.primaryRegistration!;
    const nextStatus: WorkflowStatus = type === 'APPROVE' ? 'APPROVED' : 'CORRECTION_REQUIRED';
    setActionBusyId(row.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/registrations/${encodeURIComponent(reg.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: nextStatus,
          notes: type === 'FLAG' ? 'Flagged for correction from Scholar Directory.' : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to update this registration. Please try again.');
      }
      setConfirmAction(null);
      if (onRefresh) onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unable to update this registration. Please try again.');
    } finally {
      setActionBusyId(null);
    }
  };

  const showingStart = filtered.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(safePage * pageSize, filtered.length);

  const tabs: { id: TabId; label: string; count: number; danger?: boolean }[] = [
    { id: 'ALL', label: 'All scholars', count: tabCounts.ALL },
    { id: 'ACTIVE', label: 'Active', count: tabCounts.ACTIVE },
    { id: 'DOCTORAL', label: 'Doctoral', count: tabCounts.DOCTORAL },
    { id: 'MASTERS', label: 'Masters', count: tabCounts.MASTERS },
    { id: 'ALUMNI', label: 'Alumni', count: tabCounts.ALUMNI },
    { id: 'FLAGGED', label: 'Flagged', count: tabCounts.FLAGGED, danger: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scholar Directory</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage student enrolment records.</p>
        </div>
        <button
          type="button"
          onClick={handleExportRoster}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export roster</span>
        </button>
      </div>

      {/* Enrolment overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="h-4 w-4" />} accent="teal" label="Total scholars" value={metrics.total} context="Across all institutions" />
        <MetricCard icon={<GraduationCap className="h-4 w-4" />} accent="blue" label="Active enrolment" value={metrics.active} context="Current records" />
        <MetricCard icon={<Award className="h-4 w-4" />} accent="indigo" label="Conferred alumni" value={metrics.conferred} context="Degree issued" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} accent="rose" label="Flagged for review" value={metrics.flagged} context="Requires attention" />
      </div>

      {/* Directory section heading */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm font-bold text-slate-900">Scholar Directory</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter scholars by category">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const showDot = tab.danger && tab.count > 0;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                resetToFirstPage();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] ${
                active ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showDot && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />}
              <span>{tab.label}</span>
              <span className={active ? 'text-slate-300' : 'text-slate-400'}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by name, permanent UID, email, or institution..."
            aria-label="Search scholars"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] focus:border-[#006f67] shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={institutionFilter}
            onChange={(e) => { setInstitutionFilter(e.target.value); resetToFirstPage(); }}
            aria-label="Filter by institution"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All institutions</option>
            {institutionOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={programFilter}
            onChange={(e) => { setProgramFilter(e.target.value); resetToFirstPage(); }}
            aria-label="Filter by programme"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All programmes</option>
            {programOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as 'ALL' | ScholarStatus); resetToFirstPage(); }}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="ALL">All statuses</option>
            <option value="Active">Active</option>
            <option value="Conferred">Conferred</option>
            <option value="Flagged">Flagged</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as 'NEWEST' | 'OLDEST'); resetToFirstPage(); }}
            aria-label="Sort order"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700" role="alert">
          {actionError}
        </div>
      )}

      {/* Directory */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 px-4">Scholar</th>
                <th scope="col" className="py-3 px-4">Institution</th>
                <th scope="col" className="py-3 px-4">Programme</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <p className="text-sm font-semibold text-slate-700">No scholars found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const pill = STATUS_PILL[row.status];
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50/70 ${row.status === 'Flagged' ? 'bg-rose-50/40' : ''}`}
                    >
                      {/* Scholar */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] rounded"
                        >
                          <div className="font-semibold text-slate-900 group-hover:text-[#006f67] transition-colors">{row.name}</div>
                          <div className="font-mono text-[10.5px] text-slate-500">{row.uid}</div>
                          {row.idVerified && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-slate-500">
                              <BadgeCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                              <span>Aadhaar verified</span>
                            </div>
                          )}
                        </button>
                      </td>
                      {/* Institution */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800">{row.institutionName || <span className="text-slate-400">—</span>}</span>
                      </td>
                      {/* Programme */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{row.programName || <span className="text-slate-400">—</span>}</div>
                        {row.programIntake && <div className="text-[10.5px] text-slate-500">Intake {row.programIntake}</div>}
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pill.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} aria-hidden="true" />
                          {pill.label}
                        </span>
                      </td>
                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <RowActions
                            row={row}
                            busy={actionBusyId === row.id}
                            onView={() => openDetail(row)}
                            onApprove={() => setConfirmAction({ row, type: 'APPROVE' })}
                            onFlag={() => setConfirmAction({ row, type: 'FLAG' })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginated.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-slate-700">No scholars found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            paginated.map((row) => {
              const pill = STATUS_PILL[row.status];
              return (
                <div key={row.id} className={`p-4 ${row.status === 'Flagged' ? 'bg-rose-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openDetail(row)}
                      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] rounded"
                    >
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="font-mono text-[10.5px] text-slate-500">{row.uid}</div>
                    </button>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${pill.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} aria-hidden="true" />
                      {pill.label}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                    {row.programName && <div className="text-slate-700">{row.programName}{row.programIntake ? ` · Intake ${row.programIntake}` : ''}</div>}
                    {row.institutionName && <div>{row.institutionName}</div>}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <RowActions
                      row={row}
                      busy={actionBusyId === row.id}
                      onView={() => openDetail(row)}
                      onApprove={() => setConfirmAction({ row, type: 'APPROVE' })}
                      onFlag={() => setConfirmAction({ row, type: 'FLAG' })}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Showing {showingStart}–{showingEnd} of {filtered.length} scholars</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <label className="hidden sm:flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); resetToFirstPage(); }}
                aria-label="Rows per page"
                className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 font-semibold text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <span className="px-2 font-semibold text-slate-700" aria-live="polite">Page {safePage} of {totalPages}</span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <ConfirmDialog
          type={confirmAction.type}
          row={confirmAction.row}
          busy={actionBusyId === confirmAction.row.id}
          onCancel={() => { if (!actionBusyId) { setConfirmAction(null); setActionError(null); } }}
          onConfirm={runAction}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

const ACCENTS: Record<string, string> = {
  teal: 'bg-teal-50 text-[#006f67]',
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  rose: 'bg-rose-50 text-rose-600',
};

const MetricCard: React.FC<{ icon: React.ReactNode; accent: string; label: string; value: number; context: string }> = ({
  icon, accent, label, value, context,
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${ACCENTS[accent]}`}>{icon}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
    <div className="text-[11px] text-slate-400 mt-0.5">{context}</div>
  </div>
);

/* Contextual row actions grounded in the real registration workflow. ------ */
const RowActions: React.FC<{
  row: ScholarRow;
  busy: boolean;
  onView: () => void;
  onApprove: () => void;
  onFlag: () => void;
}> = ({ row, busy, onView, onApprove, onFlag }) => {
  const canActOnReg = Boolean(row.primaryRegistration);

  const viewBtn = (
    <button
      type="button"
      onClick={onView}
      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
    >
      View
    </button>
  );

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Working…
      </span>
    );
  }

  // Active / in-review scholars: admin may approve or flag the underlying registration.
  if (row.status === 'Active' && canActOnReg) {
    return (
      <>
        <button
          type="button"
          onClick={onApprove}
          className="px-2.5 py-1.5 rounded-lg bg-[#006f67] hover:bg-[#005a54] text-white text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onFlag}
          className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Flag
        </button>
      </>
    );
  }

  // Flagged scholars: review the record (opens existing detail/workflow).
  if (row.status === 'Flagged') {
    return (
      <button
        type="button"
        onClick={onView}
        className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        Review
      </button>
    );
  }

  // Conferred / draft / archived: view only.
  return viewBtn;
};

/* Accessible confirmation dialog. ----------------------------------------- */
const ConfirmDialog: React.FC<{
  type: 'APPROVE' | 'FLAG';
  row: ScholarRow;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ type, row, busy, onCancel, onConfirm }) => {
  const isApprove = type === 'APPROVE';
  const reg = row.primaryRegistration;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <h3 id="confirm-title" className="text-base font-bold text-slate-900">
            {isApprove ? 'Approve this registration?' : 'Flag this registration for correction?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isApprove
              ? 'This approves the scholar’s current registration through the standard registration workflow.'
              : 'This returns the scholar’s current registration to the institution for correction.'}
          </p>
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
            <div className="font-semibold text-slate-900">{row.name}</div>
            <div className="text-slate-500">
              {row.uid}{reg?.registration_number ? ` · ${reg.registration_number}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-60 ${
              isApprove ? 'bg-[#006f67] hover:bg-[#005a54] focus-visible:ring-[#006f67]' : 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400'
            }`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {isApprove ? 'Approve' : 'Flag'}
          </button>
        </div>
      </div>
    </div>
  );
};
