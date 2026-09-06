'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Institution, Department, Program } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchInstitutions, fetchDepartments, fetchPrograms } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { INSTITUTION_NAMES } from '@/components/registration/NewRegistrationWizard';
import {
  Building2,
  BookOpen,
  Layers,
  Search,
  MapPin,
  CheckCircle2,
  GraduationCap,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

// Institutional metadata mapping for featured accredited seminaries
const INSTITUTION_LOCATIONS: Record<string, string> = {
  NIBS: 'Kottayam, Kerala',
  SAIACS: 'Bengaluru, Karnataka',
  UBS: 'Pune, Maharashtra',
  CLGD: 'Bengaluru, Karnataka',
  SABC: 'Bengaluru, Karnataka',
  ABS: 'Prayagraj, Uttar Pradesh',
  HBIC: 'Chennai, Tamil Nadu',
  HBI: 'Chennai, Tamil Nadu',
  FIGS: 'Udaipur, Rajasthan',
  FBC: 'Udaipur, Rajasthan',
  DBC: 'Dimapur, Nagaland',
};

export default function InstitutionsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [isMemberDirectoryOpen, setIsMemberDirectoryOpen] = useState(false);
  const [memberDirectorySearch, setMemberDirectorySearch] = useState('');

  useEffect(() => {
    Promise.all([fetchInstitutions(), fetchDepartments(), fetchPrograms()]).then(
      ([insts, depts, progs]) => {
        setInstitutions(insts);
        setDepartments(depts);
        setPrograms(progs);
        setLoading(false);
      }
    );
  }, []);

  // Filtered institutions based on search and degree level
  const filteredInstitutions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return institutions.filter((inst) => {
      const instDepts = departments.filter((d) => d.institution_id === inst.id);
      const instProgs = programs.filter((p) =>
        instDepts.some((d) => d.id === p.department_id)
      );

      // Level matching
      const matchesLevel =
        selectedLevel === 'ALL' ||
        instProgs.some(
          (p) => p.degree_level?.toUpperCase() === selectedLevel.toUpperCase()
        );

      if (!matchesLevel) return false;

      // Text query matching
      if (!q) return true;

      const matchInstName = inst.name.toLowerCase().includes(q);
      const matchInstCode = inst.code.toLowerCase().includes(q);
      const matchLocation = (INSTITUTION_LOCATIONS[inst.code] || '').toLowerCase().includes(q);
      const matchDept = instDepts.some(
        (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
      );
      const matchProg = instProgs.some(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );

      return matchInstName || matchInstCode || matchLocation || matchDept || matchProg;
    });
  }, [institutions, departments, programs, searchQuery, selectedLevel]);

  // Filtered 198 member colleges for directory
  const filteredMemberColleges = useMemo(() => {
    const q = memberDirectorySearch.toLowerCase().trim();
    if (!q) return INSTITUTION_NAMES;
    return INSTITUTION_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [memberDirectorySearch]);

  const getDegreeLevelBadge = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'DOCTORATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POSTGRADUATE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UNDERGRADUATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DIPLOMA':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="Institutions & Academic Structure"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Institutional Hierarchy & Academic Governance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Constituent Institutions, Departments, and Degree Programs accredited under Asia Theological Association (ATA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ATA Accredited Governance
            </span>
          </div>
        </div>

        {/* Top Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Featured Institutions
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {institutions.length}
              </span>
              <span className="text-[11px] text-purple-600 font-medium">Curricula</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Member Colleges
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {INSTITUTION_NAMES.length}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Accredited</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Departments
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {departments.length}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Divisions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Degree Programs
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {programs.length}
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">Qualifications</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter institutions, departments, programs..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Degree Level Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-1" />
            {[
              { id: 'ALL', label: 'All Levels' },
              { id: 'UNDERGRADUATE', label: 'Undergraduate' },
              { id: 'POSTGRADUATE', label: 'Postgraduate' },
              { id: 'DOCTORATE', label: 'Doctorate' },
              { id: 'DIPLOMA', label: 'Diploma' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedLevel === lvl.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible ATA Member Colleges Directory Section */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMemberDirectoryOpen(!isMemberDirectoryOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Accredited ATA Member Colleges Directory
                </h3>
                <p className="text-[11px] text-slate-500">
                  Full registry of {INSTITUTION_NAMES.length} authorized Asia Theological Association institutions across South Asia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                {INSTITUTION_NAMES.length} Member Colleges
              </span>
              {isMemberDirectoryOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {isMemberDirectoryOpen && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/40 dark:bg-slate-800/20">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={memberDirectorySearch}
                  onChange={(e) => setMemberDirectorySearch(e.target.value)}
                  placeholder={`Search among ${INSTITUTION_NAMES.length} accredited institutions...`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredMemberColleges.map((colName, index) => (
                  <div
                    key={colName}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2.5 hover:border-blue-300 transition-colors shadow-2xs"
                  >
                    <span className="font-mono text-[10px] font-bold text-blue-600 shrink-0 mt-0.5">
                      #{index + 1}
                    </span>
                    <span className="leading-snug">{colName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured Institutions Hierarchical Cards */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-800">No Institutions Found</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              No institution or degree program matches your search &ldquo;{searchQuery}&rdquo;. Try clearing filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInstitutions.map((inst) => {
              const instDepts = departments.filter((d) => d.institution_id === inst.id);
              const location = INSTITUTION_LOCATIONS[inst.code] || 'India';

              return (
                <div
                  key={inst.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5 transition-all hover:border-purple-300"
                >
                  {/* Card Header: Institution Info + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold tracking-wider">
                          CODE: {inst.code}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {location}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ATA Accredited
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {inst.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                        {instDepts.length} Academic Department{instDepts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Departments Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instDepts.map((dept) => {
                      const deptProgs = programs.filter(
                        (p) =>
                          p.department_id === dept.id &&
                          (selectedLevel === 'ALL' ||
                            p.degree_level?.toUpperCase() === selectedLevel.toUpperCase())
                      );

                      if (selectedLevel !== 'ALL' && deptProgs.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={dept.id}
                          className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-600 shrink-0" />
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {dept.name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                {dept.code}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {deptProgs.map((prog) => (
                                <div
                                  key={prog.id}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 leading-snug flex items-center gap-1.5">
                                      <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                      {prog.name}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                                      {prog.code}
                                    </span>
                                  </div>
                                  <div className="flex justify-end">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getDegreeLevelBadge(
                                        prog.degree_level
                                      )}`}
                                    >
                                      {prog.degree_level}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                            <span>{deptProgs.length} Program{deptProgs.length !== 1 ? 's' : ''} offered</span>
                            <span>ATA Certified</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
