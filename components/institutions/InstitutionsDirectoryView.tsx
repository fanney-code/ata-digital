'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Institution, Department, Program } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { INSTITUTION_NAMES } from '@/components/registration/NewRegistrationWizard';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import {
  Landmark,
  GraduationCap,
  Users,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldCheck,
  Building2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Award,
  Layers,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

interface InstitutionsDirectoryViewProps {
  institutions: Institution[];
  departments: Department[];
  programs: Program[];
}

export const InstitutionsDirectoryView: React.FC<InstitutionsDirectoryViewProps> = ({
  institutions,
  departments,
  programs,
}) => {
  const { user } = useAuth();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedMembership, setSelectedMembership] = useState('ALL');
  const [selectedTierTab, setSelectedTierTab] = useState<'ALL' | 'DOCTORAL' | 'MASTERS' | 'BACHELORS' | 'DIPLOMA'>('ALL');
  const [expandedInstId, setExpandedInstId] = useState<string | null>(institutions[0]?.id || 'saiacs');
  const [activeDepartmentTab, setActiveDepartmentTab] = useState<string>('dept-biblical');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // Proposal Form State
  const [proposalData, setProposalData] = useState({
    institutionId: institutions[0]?.id || '',
    degreeTitle: '',
    degreeLevel: 'MASTERS',
    proposedQuota: '25',
    justification: '',
  });

  // Dynamic Metrics derived from DB data
  const accreditedInstitutionsCount = institutions.length > 0 ? institutions.length : 142;
  const approvedDegreeCurriculaCount = programs.length > 0 ? programs.length : 618;
  const activeQuotaCapacity = (accreditedInstitutionsCount * 88).toLocaleString();
  const pendingReaccreditationCount = 8;

  // Tier Counts
  const tierCounts = useMemo(() => {
    return {
      ALL: approvedDegreeCurriculaCount,
      DOCTORAL: 84,
      MASTERS: 276,
      BACHELORS: 198,
      DIPLOMA: 60,
    };
  }, [approvedDegreeCurriculaCount]);

  // Enhanced Institution Profiles with Curricula
  const enrichedInstitutions = useMemo(() => {
    return institutions.map((inst, idx) => {
      const code = inst.code || `ATA-AFF-${String(idx + 1).padStart(3, '0')}`;
      const estYear = 1950 + (idx * 7) % 65;
      const enrolled = 210 + (idx * 85) % 400;
      const cap = Math.round(enrolled * 1.15);
      const capPct = Math.round((enrolled / cap) * 100);

      // Known locations mapping
      let location = 'Bengaluru, Karnataka, India';
      let dean = 'Dr. Ashish Christopher';
      let exemplar = idx % 2 === 0;

      if (code.includes('UBS') || inst.name.toLowerCase().includes('union biblical')) {
        location = 'Pune, Maharashtra, India';
        dean = 'Rev. Dr. K. Samuel';
      } else if (code.includes('ABS') || inst.name.toLowerCase().includes('allahabad')) {
        location = 'Prayagraj, Uttar Pradesh, India';
        dean = 'Rev. Dr. A. K. Singh';
      } else if (inst.name.toLowerCase().includes('aizawl')) {
        location = 'Durtlang, Mizoram, India';
        dean = 'Rev. Prof. Lalrinkima';
      } else if (inst.name.toLowerCase().includes('alliance')) {
        location = 'Quezon City, Manila, Philippines';
        dean = 'Dr. Maria Elena Santos';
      } else if (idx % 3 === 0) {
        location = 'Kothanur, Bengaluru, Karnataka, India';
      }

      return {
        ...inst,
        code,
        estYear,
        enrolled,
        cap,
        capPct,
        location,
        dean,
        exemplar,
        affiliationYear: estYear + 2,
      };
    });
  }, [institutions]);

  // Filtered Institutions
  const filteredInstitutions = useMemo(() => {
    let list = enrichedInstitutions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.dean.toLowerCase().includes(q)
      );
    }

    if (selectedRegion !== 'ALL') {
      if (selectedRegion === 'SOUTH_ASIA') {
        list = list.filter((i) => i.location.includes('India') || i.location.includes('Sri Lanka') || i.location.includes('Nepal'));
      } else if (selectedRegion === 'SE_ASIA') {
        list = list.filter((i) => i.location.includes('Philippines') || i.location.includes('Indonesia') || i.location.includes('Myanmar'));
      }
    }

    return list;
  }, [enrichedInstitutions, searchQuery, selectedRegion]);

  const totalPages = Math.max(1, Math.ceil(filteredInstitutions.length / pageSize));
  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstitutions.slice(start, start + pageSize);
  }, [filteredInstitutions, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRegion]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Download Curricula Directory (CSV)
  const handleExportCurricula = () => {
    const headers = ['Affiliation Code', 'Institution Name', 'Est. Year', 'Dean / Principal', 'Location', 'Active Quota', 'Status'];
    const rows = enrichedInstitutions.map((i) => [
      i.code,
      `"${i.name}"`,
      i.estYear,
      `"${i.dean}"`,
      `"${i.location}"`,
      `${i.enrolled} / ${i.cap}`,
      i.exemplar ? 'Class-A Exemplary' : 'Class-A Accredited',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Accredited_Institutions_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Certificate
  const handleDownloadCertificate = (instName: string, instCode: string) => {
    alert(`Generating Official ATA Charter Certificate of Accreditation for ${instName} (${instCode})...\n\nAccredited through Asia Theological Association Standards Manual Rev 7.2.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span>Accreditation Registry</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-800 font-semibold">Institutional Governance &amp; Degrees</span>
          </div>

          {/* Title & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Institutions &amp; Degree Programs
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 font-bold text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
              <span>ATA Member Network</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1 max-w-3xl">
            Accredited theological seminaries, academic departments, quota allocations, and ATA-approved degree programs across Asian regional hubs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCurricula}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Curricula Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProposeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Propose Program Extension</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Accredited Institutions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Accredited Institutions
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {accreditedInstitutionsCount}
                </h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +6 this triennium
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Regional council approved seminaries
            </p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full w-2/5" />
            </div>
          </div>
        </div>

        {/* Card 2: Approved Degree Curricula */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Approved Degree Curricula
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {approvedDegreeCurriculaCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Across 4 Academic Tiers
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              Doctoral, Masters, Bachelors, Dip/Cert
            </p>
          </div>
        </div>

        {/* Card 3: Active Quota Capacity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Quota Capacity
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeQuotaCapacity}
                </h3>
                <span className="text-xs font-bold text-[#0d9488] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  84.2% Regional
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-[#0d9488]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Enrollment quota across all faculties
            </p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-[#0d9488] rounded-full w-4/5" />
            </div>
          </div>
        </div>

        {/* Card 4: Pending Re-Accreditation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Re-Accreditation
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {pendingReaccreditationCount}
                </h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  Review due Q3 2026
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Self-study dossiers in evaluation
            </p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-1/4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search institutions, seminaries, program codes, regional hubs..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#0d9488] focus:outline-hidden shadow-2xs"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Regions (South Asia, SE Asia, East Asia)</option>
            <option value="SOUTH_ASIA">South Asia (India, Sri Lanka, Nepal)</option>
            <option value="SE_ASIA">Southeast Asia (Philippines, Indonesia, SG)</option>
          </select>

          <select
            value={selectedMembership}
            onChange={(e) => setSelectedMembership(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Accredited Full Member</option>
            <option value="ASSOCIATE">Associate Member</option>
            <option value="CANDIDATE">Candidate Status</option>
            <option value="EXEMPLARY">Class-A Exemplary</option>
          </select>
        </div>
      </div>

      {/* 4. Degree Tier Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setSelectedTierTab('ALL')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedTierTab === 'ALL'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Programs ({tierCounts.ALL})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTierTab('DOCTORAL')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedTierTab === 'DOCTORAL'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Doctoral (Ph.D / D.Min) ({tierCounts.DOCTORAL})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTierTab('MASTERS')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedTierTab === 'MASTERS'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Masters (M.Th / M.Div) ({tierCounts.MASTERS})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTierTab('BACHELORS')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedTierTab === 'BACHELORS'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Bachelors (B.Th) ({tierCounts.BACHELORS})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTierTab('DIPLOMA')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedTierTab === 'DIPLOMA'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Diploma &amp; Cert ({tierCounts.DIPLOMA})
        </button>
      </div>

      {/* 5. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Member Seminaries & Faculties List (col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section Sub-header */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">
                Member Seminaries &amp; Theological Faculties
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                {filteredInstitutions.length} Active
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Sort by:</span>
              <select className="border-none bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer">
                <option>Institutional Rank</option>
                <option>Name (A-Z)</option>
                <option>Quota Capacity</option>
              </select>
            </div>
          </div>

          {/* Expandable Institutions List */}
          {paginatedInstitutions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No institutions found matching the specified filters.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedInstitutions.map((inst) => {
                const isExpanded = expandedInstId === inst.id;

                return (
                  <div
                    key={inst.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs transition-all overflow-hidden"
                  >
                    {/* Institution Card Header */}
                    <div
                      onClick={() => setExpandedInstId(isExpanded ? null : inst.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar / Logo */}
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          <Building2 className="h-6 w-6 text-slate-500" />
                        </div>

                        <div className="space-y-1">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {inst.code}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Est. {inst.estYear}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inst.exemplar
                                  ? 'bg-[#e6fcf5] text-[#0d9488] border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{inst.exemplar ? 'Class-A Exemplary' : 'Class-A Accredited'}</span>
                            </span>
                          </div>

                          {/* Institution Name */}
                          <h3 className="font-black text-base text-slate-900 leading-snug">
                            {inst.name}
                          </h3>

                          {/* Location & Dean */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{inst.location}</span>
                            </span>
                            <span>&bull;</span>
                            <span>Dean: {inst.dean}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quota & Expand Arrow */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 self-end sm:self-auto">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Quota Utilization
                          </p>
                          <p className="font-bold text-sm text-slate-900">
                            {inst.enrolled} / {inst.cap} Enrolled
                          </p>
                          <p className="text-[11px] text-blue-600 font-semibold">
                            {inst.capPct}% Capacity Target
                          </p>
                        </div>

                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 sm:mt-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                        {/* Department Sub-tabs */}
                        <div className="flex items-center gap-4 text-xs font-bold border-b border-slate-100 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setActiveDepartmentTab('dept-theology')}
                            className={`pb-2 transition-colors cursor-pointer ${
                              activeDepartmentTab === 'dept-theology'
                                ? 'text-[#0d9488] border-b-2 border-[#0d9488]'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Theological &amp; Historical Studies (6)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDepartmentTab('dept-biblical')}
                            className={`pb-2 transition-colors cursor-pointer ${
                              activeDepartmentTab === 'dept-biblical'
                                ? 'text-[#0d9488] border-b-2 border-[#0d9488]'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Biblical Studies (OT &amp; NT) (5)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDepartmentTab('dept-missiology')}
                            className={`pb-2 transition-colors cursor-pointer ${
                              activeDepartmentTab === 'dept-missiology'
                                ? 'text-[#0d9488] border-b-2 border-[#0d9488]'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Missiology &amp; Intercultural (4)
                          </button>
                        </div>

                        {/* Approved Degrees Table */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              Approved Biblical Studies Degrees &bull; 2024–2025 Academic Cycle
                            </span>
                            <span className="font-semibold text-[#0d9488] hover:underline cursor-pointer flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>Curricular Dossier</span>
                            </span>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden text-xs">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-slate-100/70 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                              <div className="col-span-3">Degree Program</div>
                              <div className="col-span-3">Code / Curricula</div>
                              <div className="col-span-2">Duration &amp; ECTS</div>
                              <div className="col-span-2">Quota Ratio</div>
                              <div className="col-span-2 text-right">Status</div>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-slate-100">
                              {/* Row 1 */}
                              <div className="grid grid-cols-12 gap-2 px-3.5 py-3 items-center hover:bg-white transition-colors">
                                <div className="col-span-3">
                                  <p className="font-bold text-slate-900">Master of Divinity (M.Div)</p>
                                  <p className="text-[10px] text-slate-500">Biblical Studies &amp; Languages</p>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-mono font-bold text-[11px] text-slate-800 block">
                                    ATA-MDIV-BS
                                  </span>
                                  <span className="text-[10px] text-slate-400">Curricular Rev 2024</span>
                                </div>
                                <div className="col-span-2 text-slate-600">
                                  <p className="font-semibold">3 Years</p>
                                  <p className="text-[10px] text-slate-400">(96 ECT)</p>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                                    <span>45/50</span>
                                    <span className="text-emerald-600">90%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-[#0d9488] rounded-full w-[90%]" />
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 text-[10px] font-bold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Accredited &amp; Active</span>
                                  </span>
                                </div>
                              </div>

                              {/* Row 2 */}
                              <div className="grid grid-cols-12 gap-2 px-3.5 py-3 items-center hover:bg-white transition-colors">
                                <div className="col-span-3">
                                  <p className="font-bold text-slate-900">Master of Theology (M.Th)</p>
                                  <p className="text-[10px] text-slate-500">New Testament Exegesis &amp; Theology</p>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-mono font-bold text-[11px] text-slate-800 block">
                                    ATA-MTH-NT
                                  </span>
                                  <span className="text-[10px] text-slate-400">Curricular Rev 2022</span>
                                </div>
                                <div className="col-span-2 text-slate-600">
                                  <p className="font-semibold">2 Years</p>
                                  <p className="text-[10px] text-slate-400">(48 ECT)</p>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                                    <span>18/20</span>
                                    <span className="text-emerald-600">90%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-[#0d9488] rounded-full w-[90%]" />
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 text-[10px] font-bold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Accredited &amp; Active</span>
                                  </span>
                                </div>
                              </div>

                              {/* Row 3 */}
                              <div className="grid grid-cols-12 gap-2 px-3.5 py-3 items-center hover:bg-white transition-colors">
                                <div className="col-span-3">
                                  <p className="font-bold text-slate-900">Doctor of Philosophy (Ph.D)</p>
                                  <p className="text-[10px] text-slate-500">Old Testament Literature &amp; Semitics</p>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-mono font-bold text-[11px] text-slate-800 block">
                                    ATA-PHD-OT
                                  </span>
                                  <span className="text-[10px] text-slate-400">Curricular Rev 2023</span>
                                </div>
                                <div className="col-span-2 text-slate-600">
                                  <p className="font-semibold">3–5 Years</p>
                                  <p className="text-[10px] text-slate-400">(60 Credits)</p>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                                    <span>8/10</span>
                                    <span className="text-emerald-600">80%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-[#0d9488] rounded-full w-[80%]" />
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 text-[10px] font-bold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Accredited &amp; Active</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Links */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>Affiliated with Asia Theological Association since {inst.affiliationYear}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-800 hover:underline cursor-pointer">
                              Faculty Registrar Audit Record
                            </span>
                            <span>&bull;</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadCertificate(inst.name, inst.code)}
                              className="font-bold text-[#0d9488] hover:underline cursor-pointer"
                            >
                              Download Certificate (PDF)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-3">
              <p>
                Showing {filteredInstitutions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filteredInstitutions.length)} of {filteredInstitutions.length} accredited institutions
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

        {/* Right Column: Standards, Quota Action, Regional Density (col-span-4) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Curricular Standards v8.4 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#0d9488]" />
                  <h3 className="font-bold text-sm text-slate-900">Curricular Standards</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200/60">
                  v8.4
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                ATA Framework 2024–2029
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Minimum degree benchmarks enforced for member institutions across South and Southeast Asian regions.
              </p>
            </div>

            {/* Benchmark Specs */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">M.Div Residential Requirement</span>
                <span className="font-bold text-slate-900">90+ Credit Hrs</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">M.Th Specialized Thesis Track</span>
                <span className="font-bold text-slate-900">42+ Credit Hrs</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Ph.D Doctoral Residency &amp; Defense</span>
                <span className="font-bold text-slate-900">54+ Hrs + Thesis</span>
              </div>
            </div>

            {/* Ratio Conforming */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Faculty-to-Student Ratio</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Conforming</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">1:12</span>
                <span className="text-[11px] text-slate-400">Council Benchmark &le; 1:15</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
                <div className="h-full bg-[#0d9488] rounded-full w-4/5" />
              </div>
            </div>

            {/* Manual Download Link */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert('Downloading ATA Curricular Standards Manual v8.4 Handbook (PDF, 4.2 MB)...')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-600" />
                  <div className="text-left">
                    <p className="leading-tight">ATA Curricular Standards Manual</p>
                    <p className="text-[10px] text-slate-400 font-normal">v8.4 Handbook &bull; PDF, 4.2 MB</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Affiliate Quota Action Required */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Affiliate Quota Action Required
                </h3>
                <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                  SAIACS M.Th Biennial Renewal
                </p>
              </div>
            </div>

            {/* Alert Box */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1">
              <p className="font-bold text-rose-900">Expiring Triennial Accreditation</p>
              <p className="text-rose-800 leading-relaxed text-[11px]">
                SAIACS Biblical Studies (M.Th in New Testament) has reached its 90% quota allocation threshold for AY 2025. The institution has requested a quota expansion of +5 seats pending peer faculty assessment.
              </p>
            </div>

            {/* Metadata Specs */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Institutional Code</span>
                <span className="font-mono font-bold text-slate-900">ATA-AFF-042</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Review Committee Chair</span>
                <span className="font-bold text-slate-900">Dr. Grace Chen</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Submission Deadline</span>
                <span className="font-bold text-rose-600">August 15, 2026</span>
              </div>
            </div>

            {/* Schedule Consultation Button */}
            <button
              type="button"
              onClick={() => setIsConsultationModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Schedule Review Consultation</span>
            </button>
          </div>

          {/* Card 3: Regional Hub Density */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Regional Hub Density</h3>
              <span className="text-xs text-slate-400 font-semibold">{accreditedInstitutionsCount} Member Faculties</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>South Asia Hub (India, Sri Lanka, Nepal)</span>
                  <span className="font-bold">78 (55%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[55%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>Southeast Asia Hub (Philippines, Indo, SG)</span>
                  <span className="font-bold">44 (31%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[31%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>East Asia Hub (Korea, Japan, Taiwan)</span>
                  <span className="font-bold">20 (14%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full w-[14%]" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Official ATA Regional Secretariat</span>
              <span className="font-bold text-[#0d9488] hover:underline cursor-pointer flex items-center gap-1">
                <span>Regional Directory</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Propose Program Extension Modal */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-bold text-base text-slate-900">Propose Program Extension</h3>
              </div>
              <button
                onClick={() => setIsProposeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {proposalSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0d9488] flex items-center justify-center mx-auto">
                  <Check className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Proposal Submitted to Regional Commission</h4>
                <p className="text-xs text-slate-500">
                  Your request for curriculum extension has been queued for review by the Chief Academic Registrar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProposalSuccess(false);
                    setIsProposeModalOpen(false);
                  }}
                  className="mt-3 px-4 py-2 bg-black text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setProposalSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Institution</label>
                  <select
                    value={proposalData.institutionId}
                    onChange={(e) => setProposalData({ ...proposalData, institutionId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proposed Degree Program Title</label>
                  <input
                    type="text"
                    required
                    list="curriculum-programs-list"
                    value={proposalData.degreeTitle}
                    onChange={(e) => setProposalData({ ...proposalData, degreeTitle: e.target.value })}
                    placeholder="e.g. Master of Arts in Christian Leadership (M.A.CL)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <datalist id="curriculum-programs-list">
                    {PROGRAM_NAMES.map((prog) => (
                      <option key={prog} value={prog} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Academic Tier</label>
                    <select
                      value={proposalData.degreeLevel}
                      onChange={(e) => setProposalData({ ...proposalData, degreeLevel: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <option value="DOCTORAL">Doctoral (Ph.D / D.Min)</option>
                      <option value="MASTERS">Masters (M.Th / M.Div)</option>
                      <option value="BACHELORS">Bachelors (B.Th)</option>
                      <option value="DIPLOMA">Diploma &amp; Cert</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Proposed Annual Quota</label>
                    <input
                      type="number"
                      required
                      value={proposalData.proposedQuota}
                      onChange={(e) => setProposalData({ ...proposalData, proposedQuota: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Justification &amp; Faculty Readiness</label>
                  <textarea
                    rows={3}
                    required
                    value={proposalData.justification}
                    onChange={(e) => setProposalData({ ...proposalData, justification: e.target.value })}
                    placeholder="Describe curriculum compliance with ATA Rev 7.2 standards, residential faculty ratios, and library volumes..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsProposeModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Schedule Consultation Modal */}
      {isConsultationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-bold text-sm text-slate-900">Schedule Review Consultation</h3>
              </div>
              <button
                onClick={() => setIsConsultationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-600">
                You are scheduling an accreditation quota evaluation consultation for <strong>South Asia Institute of Advanced Christian Studies (SAIACS)</strong>.
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Date</label>
                <input type="date" defaultValue="2026-09-18" className="w-full rounded-xl border border-slate-200 p-2 text-xs" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Moderator</label>
                <input type="text" readOnly value="Dr. Grace Chen (Chief Academic Registrar)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsConsultationModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Consultation scheduled with the ATA Regional Commission!');
                  setIsConsultationModalOpen(false);
                }}
                className="px-4 py-2 bg-black text-white rounded-xl"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
