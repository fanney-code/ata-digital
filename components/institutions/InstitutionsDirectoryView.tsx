'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Institution, Department, Program, Registration } from '@/lib/types';
import { fetchProgramsForInstitution } from '@/lib/api/supabase-service';
import {
  Building2,
  GraduationCap,
  Users,
  Search,
  Download,
  X,
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface InstitutionsDirectoryViewProps {
  institutions: Institution[];
  departments: Department[];
  programs: Program[];
  registrations?: Registration[];
}

type SortKey = 'NAME_ASC' | 'NAME_DESC' | 'RECENT' | 'REGS_DESC' | 'DEPTS_DESC';

export const InstitutionsDirectoryView: React.FC<InstitutionsDirectoryViewProps> = ({
  institutions,
  departments,
  programs,
  registrations = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('NAME_ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Existing institution dossier (slide-over) — the detail experience we reuse.
  const [inspectedInstitution, setInspectedInstitution] = useState<Institution | null>(null);
  const [dossierPrograms, setDossierPrograms] = useState<Program[]>([]);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierProgramSearch, setDossierProgramSearch] = useState('');

  /* Verified mappings from real database records. ------------------------ */
  const departmentsByInstId = useMemo(() => {
    const map = new Map<string, Department[]>();
    for (const d of departments) {
      if (!map.has(d.institution_id)) map.set(d.institution_id, []);
      map.get(d.institution_id)!.push(d);
    }
    return map;
  }, [departments]);

  const registrationsByInstId = useMemo(() => {
    const map = new Map<string, Registration[]>();
    for (const r of registrations) {
      if (!map.has(r.institution_id)) map.set(r.institution_id, []);
      map.get(r.institution_id)!.push(r);
    }
    return map;
  }, [registrations]);

  // Institution -> set of program degree levels (derived from real depts+programs),
  // so the academic-level filter is fully data-backed without per-row async loads.
  const levelsByInstId = useMemo(() => {
    const deptToInst = new Map<string, string>();
    for (const d of departments) deptToInst.set(d.id, d.institution_id);
    const map = new Map<string, Set<string>>();
    for (const p of programs) {
      const instId = p.department_id ? deptToInst.get(p.department_id) : undefined;
      if (!instId || !p.degree_level) continue;
      if (!map.has(instId)) map.set(instId, new Set());
      map.get(instId)!.add(p.degree_level.toUpperCase());
    }
    return map;
  }, [departments, programs]);

  const loadDossierPrograms = useCallback(async (instId: string) => {
    setLoadingDossier(true);
    try {
      const progs = await fetchProgramsForInstitution(instId);
      setDossierPrograms(progs);
    } catch (err) {
      console.error('Failed to load programs for dossier:', err);
      setDossierPrograms([]);
    } finally {
      setLoadingDossier(false);
    }
  }, []);

  const openInstitution = useCallback((inst: Institution) => {
    setDossierProgramSearch('');
    setDossierPrograms([]);
    setInspectedInstitution(inst);
    loadDossierPrograms(inst.id);
  }, [loadDossierPrograms]);

  const closeInstitution = useCallback(() => {
    setInspectedInstitution(null);
    setDossierPrograms([]);
    setDossierProgramSearch('');
  }, []);

  /* Filter + sort pipeline. ---------------------------------------------- */
  const filteredInstitutions = useMemo(() => {
    let list = institutions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q))
      );
    }

    if (selectedLevel !== 'ALL') {
      list = list.filter((inst) => levelsByInstId.get(inst.id)?.has(selectedLevel));
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'RECENT':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'REGS_DESC':
          return (registrationsByInstId.get(b.id)?.length || 0) - (registrationsByInstId.get(a.id)?.length || 0);
        case 'DEPTS_DESC':
          return (departmentsByInstId.get(b.id)?.length || 0) - (departmentsByInstId.get(a.id)?.length || 0);
        default:
          return 0;
      }
    });
  }, [institutions, searchQuery, selectedLevel, sortBy, levelsByInstId, registrationsByInstId, departmentsByInstId]);

  const totalPages = Math.max(1, Math.ceil(filteredInstitutions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedInstitutions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredInstitutions.slice(start, start + pageSize);
  }, [filteredInstitutions, safePage, pageSize]);

  const resetToFirstPage = useCallback(() => setCurrentPage(1), []);

  /* CSV export of verified directory fields (existing capability). ------- */
  const handleExportDirectory = () => {
    const headers = ['Institution Code', 'Institution Name', 'Departments', 'Active Registrations', 'Record Created At'];
    const rows = filteredInstitutions.map((i) => [
      i.code || '',
      i.name,
      String(departmentsByInstId.get(i.id)?.length || 0),
      String(registrationsByInstId.get(i.id)?.length || 0),
      i.created_at || '',
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Institutions_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportDossier = (inst: Institution) => {
    const depts = departmentsByInstId.get(inst.id) || [];
    const regs = registrationsByInstId.get(inst.id) || [];
    const data = {
      institution_name: inst.name,
      institution_code: inst.code,
      record_id: inst.id,
      created_at: inst.created_at || 'Not recorded',
      academic_departments: depts.map((d) => ({ name: d.name, code: d.code })),
      approved_programs: dossierPrograms.map((p) => ({ name: p.name, code: p.code, level: p.degree_level || 'Not specified' })),
      verified_registrations_count: regs.length,
      registrations: regs.map((r) => ({ registration_number: r.registration_number, status: r.status, academic_year: r.academic_year })),
    };
    const url = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_Dossier_${inst.code || 'INST'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showingStart = filteredInstitutions.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(safePage * pageSize, filteredInstitutions.length);

  const metrics = [
    { icon: <Building2 className="h-5 w-5" />, accent: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', label: 'Member institutions', value: institutions.length, context: 'Accredited member institutions' },
    { icon: <Layers className="h-5 w-5" />, accent: 'bg-blue-50 text-blue-700 border-blue-200/60', label: 'Academic departments', value: departments.length, context: 'Registered departments across member institutions' },
    { icon: <GraduationCap className="h-5 w-5" />, accent: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', label: 'Approved degree programmes', value: programs.length, context: 'Approved programmes in the directory' },
    { icon: <Users className="h-5 w-5" />, accent: 'bg-amber-50 text-amber-700 border-amber-200/60', label: 'Active registrations', value: registrations.length, context: 'Currently active registrations' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutions &amp; Structure</h1>
          <p className="text-sm text-slate-500 mt-1">Manage member institutions, academic departments, and degree programmes.</p>
        </div>
        <button
          type="button"
          onClick={handleExportDirectory}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export directory (CSV)</span>
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{m.label}</span>
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center border ${m.accent}`}>
                {React.cloneElement(m.icon, { className: 'h-4 w-4' })}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{m.value.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{m.context}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); resetToFirstPage(); }}
            placeholder="Search by institution name or code..."
            aria-label="Search institutions"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] focus:border-[#006f67] shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => { setSelectedLevel(e.target.value); resetToFirstPage(); }}
            aria-label="Filter by academic level"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="ALL">All academic levels</option>
            <option value="DOCTORAL">Doctoral</option>
            <option value="MASTERS">Masters</option>
            <option value="BACHELORS">Bachelors</option>
            <option value="DIPLOMA">Diploma &amp; certificate</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortKey); resetToFirstPage(); }}
            aria-label="Sort institutions"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="NAME_ASC">Name (A → Z)</option>
            <option value="NAME_DESC">Name (Z → A)</option>
            <option value="RECENT">Recently updated</option>
            <option value="REGS_DESC">Most active registrations</option>
            <option value="DEPTS_DESC">Most departments</option>
          </select>
        </div>
      </div>

      {/* Section heading + count */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-900">Institutions</h2>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
          {filteredInstitutions.length}
        </span>
      </div>

      {/* Directory list */}
      {paginatedInstitutions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No institutions found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedInstitutions.map((inst) => {
            const deptCount = departmentsByInstId.get(inst.id)?.length || 0;
            const regCount = registrationsByInstId.get(inst.id)?.length || 0;
            return (
              <div
                key={inst.id}
                className="bg-white border border-slate-200 rounded-xl shadow-2xs px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{inst.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[11px]">
                      {inst.code ? (
                        <span className="font-mono text-slate-600">{inst.code}</span>
                      ) : (
                        <span className="text-slate-400">Code unassigned</span>
                      )}
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        Accredited member
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {deptCount} {deptCount === 1 ? 'department' : 'departments'}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 ${regCount > 0 ? 'font-semibold text-slate-700' : ''}`}>
                        <Users className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {regCount} active {regCount === 1 ? 'registration' : 'registrations'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => openInstitution(inst)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
                    aria-label={`View institution ${inst.name}`}
                  >
                    View institution
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 shadow-2xs">
        <span>Showing {showingStart}–{showingEnd} of {filteredInstitutions.length} institutions</span>
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

      {/* Institution dossier drawer (existing detail experience) */}
      {inspectedInstitution && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={closeInstitution}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Institution details: ${inspectedInstitution.name}`}
            className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1.5 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    {inspectedInstitution.code ? (
                      <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {inspectedInstitution.code}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Code not recorded
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Accredited member
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 leading-snug">{inspectedInstitution.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeInstitution}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] shrink-0"
                  aria-label="Close institution details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Verified summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Institutional summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Active registrations</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{registrationsByInstId.get(inspectedInstitution.id)?.length || 0}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Departments</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{departmentsByInstId.get(inspectedInstitution.id)?.length || 0}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Approved programmes</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{loadingDossier ? '…' : dossierPrograms.length}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Record created</span>
                    <span className="font-medium text-slate-800">
                      {inspectedInstitution.created_at
                        ? new Date(inspectedInstitution.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Not recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Departments ({departmentsByInstId.get(inspectedInstitution.id)?.length || 0})
                </h3>
                {(() => {
                  const depts = departmentsByInstId.get(inspectedInstitution.id) || [];
                  if (depts.length === 0) {
                    return <p className="text-xs text-slate-500">No departments recorded for this institution.</p>;
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {depts.map((dept) => (
                        <span key={dept.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{dept.code}</span>
                          <span>{dept.name}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Approved programmes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Approved programmes</h3>
                  {!loadingDossier && dossierPrograms.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{dossierPrograms.length}</span>
                  )}
                  {loadingDossier && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" /> Loading…
                    </span>
                  )}
                </div>

                {!loadingDossier && dossierPrograms.length > 0 && (
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={dossierProgramSearch}
                      onChange={(e) => setDossierProgramSearch(e.target.value)}
                      placeholder="Search programme name or code..."
                      aria-label="Search approved programmes"
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] shadow-2xs"
                    />
                    {dossierProgramSearch && (
                      <button
                        type="button"
                        onClick={() => setDossierProgramSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Clear programme search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {loadingDossier ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">Loading programmes…</div>
                ) : dossierPrograms.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <BookOpen className="h-6 w-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-800">No approved programmes recorded</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">No degree programmes are associated with this institution&apos;s departments yet.</p>
                  </div>
                ) : (
                  (() => {
                    const dQuery = dossierProgramSearch.trim().toLowerCase();
                    const filteredProgs = dQuery
                      ? dossierPrograms.filter(
                          (p) =>
                            p.name.toLowerCase().includes(dQuery) ||
                            (p.code && p.code.toLowerCase().includes(dQuery)) ||
                            (p.degree_level && p.degree_level.toLowerCase().includes(dQuery))
                        )
                      : dossierPrograms;
                    if (filteredProgs.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="font-semibold text-slate-700">No matching programmes</p>
                          <button type="button" onClick={() => setDossierProgramSearch('')} className="mt-2 text-xs font-semibold text-slate-800 hover:underline">
                            Clear search
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {filteredProgs.map((prog) => (
                          <div key={prog.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 leading-snug truncate">{prog.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{prog.code}</span>
                                {prog.degree_level && <span className="text-[10px] text-slate-500">{prog.degree_level}</span>}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0">Approved</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeInstitution}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleExportDossier(inspectedInstitution)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-black shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export institution record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
