'use client';

import React, { useState, useMemo } from 'react';
import { Institution, Department, Program } from '@/lib/types';
import {
  Download,
  CheckCircle2,
  SlidersHorizontal,
  Calendar,
  Building2,
  BookOpen,
  Users,
  Sliders,
  Search,
  FileText,
  GraduationCap,
  Award,
  ShieldCheck,
  Clock,
  ExternalLink,
  X,
  Check,
  MapPin,
  TrendingUp,
  Landmark,
  Shield,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface InstitutionsAcademicGovernanceViewProps {
  institutions?: Institution[];
  departments?: Department[];
  programs?: Program[];
}

export interface GovernanceInstitutionItem {
  id: string;
  name: string;
  code: string;
  establishedYear: number;
  location: string;
  deanName: string;
  ratingBadge: {
    label: string;
    variant: 'exemplary' | 'conforming' | 'standard';
  };
  thumbnailUrl: string;
  institutionalQuota: {
    enrolled: number;
    capacity: number;
    percentage: number;
  };
  charteredCurriculaCount?: number;
  enrolledScholarsCount?: number;
  charteredPrograms?: {
    name: string;
    level: string;
    enrolled: number;
    capacity: number;
    percentage: number;
    status: 'Active' | 'Pending';
  }[];
  clearanceNote: string;
  clearanceType: 'triennial' | 'review_due' | 'regional_compliant' | 'centennial';
  reviewDate?: string;
}

export const INITIAL_GOVERNANCE_INSTITUTIONS: GovernanceInstitutionItem[] = [
  {
    id: 'gov-inst-01',
    name: 'South Asia Institute of Advanced Christian Studies (SAIACS)',
    code: 'ATA-AFF-042',
    establishedYear: 1982,
    location: 'Bengaluru, Karnataka, India',
    deanName: 'Dr. Ashish Christopher',
    ratingBadge: {
      label: 'Class-A Exemplary',
      variant: 'exemplary',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=240&auto=format&fit=crop&q=80',
    institutionalQuota: {
      enrolled: 482,
      capacity: 520,
      percentage: 92.6,
    },
    charteredPrograms: [
      {
        name: 'Master of Divinity (M.Div)',
        level: 'Masters',
        enrolled: 45,
        capacity: 50,
        percentage: 90,
        status: 'Active',
      },
      {
        name: 'Master of Theology (M.Th)',
        level: 'Masters',
        enrolled: 18,
        capacity: 20,
        percentage: 90,
        status: 'Active',
      },
      {
        name: 'Doctor of Philosophy (Ph.D)',
        level: 'Doctoral',
        enrolled: 8,
        capacity: 10,
        percentage: 80,
        status: 'Active',
      },
    ],
    clearanceNote: 'Triennial Commission Clearance Valid until Nov 2027',
    clearanceType: 'triennial',
  },
  {
    id: 'gov-inst-02',
    name: 'Union Biblical Seminary (UBS Pune)',
    code: 'ATA-AFF-018',
    establishedYear: 1953,
    location: 'Pune, Maharashtra, India',
    deanName: 'Rev. Dr. B. Thomas',
    ratingBadge: {
      label: 'Class-A Conforming',
      variant: 'conforming',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=240&auto=format&fit=crop&q=80',
    institutionalQuota: {
      enrolled: 560,
      capacity: 600,
      percentage: 93.3,
    },
    charteredCurriculaCount: 18,
    enrolledScholarsCount: 560,
    clearanceNote: 'Re-Accreditation Panel Review: Sep 10, 2026',
    clearanceType: 'review_due',
    reviewDate: 'Sep 10, 2026',
  },
  {
    id: 'gov-inst-03',
    name: 'Alliance Biblical Seminary (Manila)',
    code: 'ATA-AFF-088',
    establishedYear: 1974,
    location: 'Quezon City, Metro Manila, Philippines',
    deanName: 'Dr. R. Santos',
    ratingBadge: {
      label: 'Class-A',
      variant: 'standard',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=240&auto=format&fit=crop&q=80',
    institutionalQuota: {
      enrolled: 320,
      capacity: 350,
      percentage: 91.4,
    },
    charteredCurriculaCount: 12,
    enrolledScholarsCount: 320,
    clearanceNote: 'Southeast Asia Regional Charter Compliant',
    clearanceType: 'regional_compliant',
  },
  {
    id: 'gov-inst-04',
    name: 'Aizawl Theological College (ATC Mizoram)',
    code: 'ATA-AFF-029',
    establishedYear: 1907,
    location: 'Durtlang, Aizawl, Mizoram, India',
    deanName: 'Rev. Dr. C. Chawnghmingliana',
    ratingBadge: {
      label: 'Class-A Exemplary',
      variant: 'exemplary',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=240&auto=format&fit=crop&q=80',
    institutionalQuota: {
      enrolled: 210,
      capacity: 240,
      percentage: 87.5,
    },
    charteredCurriculaCount: 8,
    enrolledScholarsCount: 210,
    clearanceNote: 'Centennial Heritage Charter - Active M.Th Research Hub',
    clearanceType: 'centennial',
  },
];

export const InstitutionsAcademicGovernanceView: React.FC<InstitutionsAcademicGovernanceViewProps> = ({
  institutions = [],
  departments = [],
  programs = [],
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');

  // Modals state
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [selectedInstForQuota, setSelectedInstForQuota] = useState<GovernanceInstitutionItem | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [auditFileModalOpen, setAuditFileModalOpen] = useState(false);
  const [curriculaDrawerInst, setCurriculaDrawerInst] = useState<GovernanceInstitutionItem | null>(null);

  // Quota Adjustment Form State
  const [newQuotaCeiling, setNewQuotaCeiling] = useState('550');
  const [quotaReason, setQuotaReason] = useState('Expansion of Master of Theology residential cohort.');

  // Filtering
  const filteredInstitutions = useMemo(() => {
    return INITIAL_GOVERNANCE_INSTITUTIONS.filter(inst => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = inst.name.toLowerCase().includes(q);
        const matchesCode = inst.code.toLowerCase().includes(q);
        const matchesLoc = inst.location.toLowerCase().includes(q);
        const matchesDean = inst.deanName.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesLoc && !matchesDean) {
          return false;
        }
      }

      // Rating filter
      if (ratingFilter === 'EXEMPLARY' && inst.ratingBadge.variant !== 'exemplary') return false;
      if (ratingFilter === 'CONFORMING' && inst.ratingBadge.variant !== 'conforming') return false;

      return true;
    });
  }, [searchQuery, ratingFilter]);

  const handleOpenQuotaModal = (inst: GovernanceInstitutionItem) => {
    setSelectedInstForQuota(inst);
    setNewQuotaCeiling(String(inst.institutionalQuota.capacity));
    setQuotaModalOpen(true);
  };

  const handleSaveQuota = () => {
    alert(`Quota ceiling for ${selectedInstForQuota?.name} adjusted to ${newQuotaCeiling} scholars. Signed in Central Charter Ledger.`);
    setQuotaModalOpen(false);
    setSelectedInstForQuota(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span>ATA Central Governance</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold">Institutional Accreditation &amp; Curricula</span>
        </div>
      </div>

      {/* 2. Top Header & 4 Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ATA Institutional Charter &amp; Accreditation Commission</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Institutions &amp; Academic Governance
          </h1>

          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Official registry of 142 accredited theological faculties, institutional quotas, approved degree charters,
            and triennial commission compliance across Asia.
          </p>
        </div>

        {/* 4 Executive Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => alert('Downloading official comprehensive Curricula Directory (.xlsx)...')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#99efe5] bg-white text-[#006f67] text-xs font-semibold hover:bg-teal-50/60 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-[#006f67]" />
            <span>Download Curricula Directory (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setAuditFileModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-slate-600" />
            <span>Commission Charter Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedInstForQuota(INITIAL_GOVERNANCE_INSTITUTIONS[0]);
              setQuotaModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <SlidersHorizontal className="h-4 w-4 text-white" />
            <span>Manage Institutional Quotas</span>
          </button>

          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Calendar className="h-4 w-4 text-white" />
            <span>Accreditation Review Schedule</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ACCREDITED SEMINARIES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                ACCREDITED SEMINARIES
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">142</span>
              <span className="text-xs font-bold text-[#006f67] bg-teal-50 px-1.5 py-0.5 rounded">
                ↑+6 this triennium
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>100% Chartered faculties in Asia</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: APPROVED CURRICULA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                APPROVED CURRICULA
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-slate-900">618</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Doctoral, Masters, Bachelors &amp; Diploma Tiers
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 3: REGIONAL QUOTA CAPACITY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                REGIONAL QUOTA CAPACITY
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">12,450</span>
              <span className="text-sm font-extrabold text-slate-700">84.2%</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Regional Utilization • 10,482 Active
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>

        {/* Card 4: PENDING RE-ACCREDITATION (Dark Card) */}
        <div className="bg-[#131b26] text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                PENDING RE-ACCREDITATION
              </span>
              <div className="h-7 w-7 rounded-lg bg-white/10 text-teal-400 flex items-center justify-center">
                <Sliders className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">8</span>
              <span className="text-base font-bold text-slate-300">Seminaries</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Triennial cycle Q3 2026 panel audits &amp; reviews
            </div>
          </div>
          <div className="h-1 w-12 bg-teal-400 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search seminary by name, location, or charter code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006f67] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            aria-label="Filter by Region"
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer"
          >
            <option value="ALL">Region: All Asia</option>
            <option value="SOUTH_ASIA">South Asia</option>
            <option value="SOUTHEAST_ASIA">Southeast Asia</option>
            <option value="EAST_ASIA">East Asia</option>
          </select>

          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            aria-label="Filter by Commission Rating"
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer"
          >
            <option value="ALL">Tier: All Ratings</option>
            <option value="EXEMPLARY">Class-A Exemplary</option>
            <option value="CONFORMING">Class-A Conforming</option>
          </select>

          <button
            type="button"
            aria-label="Open filter preferences"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-2xs"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 5. Main Dual Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Member Seminaries & Faculties Cards */}
        <div className="lg:col-span-2 space-y-4">
          {filteredInstitutions.map((inst, index) => {
            return (
              <div
                key={inst.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Card Top: Thumbnail + Title + Rating + Quota Box */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={inst.thumbnailUrl}
                        alt={inst.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                          {inst.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            inst.ratingBadge.variant === 'exemplary'
                              ? 'bg-[#ccfbf1] text-[#0f766e]'
                              : inst.ratingBadge.variant === 'conforming'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{inst.ratingBadge.label}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        <span className="font-mono font-semibold text-slate-700">Code: {inst.code}</span> • Est. {inst.establishedYear} •{' '}
                        <MapPin className="inline h-3 w-3 -mt-0.5 text-slate-400" /> {inst.location} • Dean: {inst.deanName}
                      </p>
                    </div>
                  </div>

                  {/* Right Quota Box */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 shrink-0 text-right sm:text-right">
                    {inst.charteredCurriculaCount ? (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Curricula Matrix
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 block">
                          {inst.charteredCurriculaCount} Approved Curricula
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {inst.enrolledScholarsCount} Enrolled Scholars
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Institutional Quota
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 block">
                          {inst.institutionalQuota.enrolled} / {inst.institutionalQuota.capacity}
                        </span>
                        <span className="text-[11px] text-[#006f67] font-bold block">
                          {inst.institutionalQuota.percentage}% Capacity
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Optional Expanded Program Quotas (SAIACS) */}
                {inst.charteredPrograms && (
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      CHARTERED DEGREE CURRICULA &amp; QUOTA UTILIZATION
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {inst.charteredPrograms.map(prog => (
                        <div key={prog.name} className="p-3 rounded-lg bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]" title={prog.name}>
                              {prog.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              {prog.status}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="text-slate-500">Enrolled: {prog.enrolled} / {prog.capacity}</span>
                            <span className="font-bold text-slate-900">{prog.percentage}%</span>
                          </div>

                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#006f67] rounded-full"
                              style={{ width: `${prog.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer: Clearance & Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {inst.clearanceType === 'triennial' && (
                      <>
                        <ShieldCheck className="h-4 w-4 text-[#006f67]" />
                        <span className="text-[#006f67] font-medium">{inst.clearanceNote}</span>
                      </>
                    )}
                    {inst.clearanceType === 'review_due' && (
                      <>
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-slate-700 font-medium">{inst.clearanceNote}</span>
                      </>
                    )}
                    {inst.clearanceType === 'regional_compliant' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-700 font-medium">{inst.clearanceNote}</span>
                      </>
                    )}
                    {inst.clearanceType === 'centennial' && (
                      <>
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700 font-medium">{inst.clearanceNote}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {inst.charteredPrograms ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenQuotaModal(inst)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Adjust Quota Ceiling
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditFileModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Commission Audit File
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Opening Conferred Degree Scrolls for ${inst.name}...`)}
                          className="px-3 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-neutral-800 shadow-xs transition-colors"
                        >
                          View Conferred Scrolls
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setCurriculaDrawerInst(inst)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Inspect {inst.charteredCurriculaCount} Curricula
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuotaModal(inst)}
                          className="px-3 py-1.5 rounded-lg bg-[#006f67] text-white font-semibold hover:bg-[#005a54] shadow-xs transition-colors"
                        >
                          Manage Quotas
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Governance Standards, Reviews & Regional Hub Density */}
        <div className="space-y-5">
          {/* Block 1: Standing Benchmarks (v8.4 Charter) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Standing Benchmarks</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold font-mono">
                v8.4 Charter
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Accreditation commission baseline criteria applied across all member theological faculties for current triennium:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600 mt-0.5 shrink-0">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">M.Div Residential Requirement</p>
                  <p className="text-[11px] text-slate-500">90+ Credit Hours on-campus instruction</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600 mt-0.5 shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">M.Th Specialized Thesis</p>
                  <p className="text-[11px] text-slate-500">42+ Credit Hours with peer dissertation defense</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600 mt-0.5 shrink-0">
                  <Award className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Ph.D Residency &amp; Defense</p>
                  <p className="text-[11px] text-slate-500">54+ Hours + Monograph + Dual ATA Reader audit</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#ccfbf1]/40 border border-[#99efe5]/60 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-[#006f67] text-white mt-0.5 shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Faculty-to-Student Ratio</p>
                  <p className="text-[11px] text-[#006f67] font-semibold">
                    1:12 (Mandatory Ceiling for Doctoral Accreditation)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: High-Priority Reviews (AY 2026-2027) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-sm">
                <span>!</span>
                <h3 className="text-slate-900 font-extrabold">High-Priority Reviews</h3>
              </div>
              <span className="font-mono text-[11px] text-slate-400">AY 2026-2027</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">SAIACS Bengaluru</span>
                  <span className="text-slate-400 font-mono text-[10px]">Aug 15, 2026</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  M.Th Biennial Quota Extension Review (Requesting +10 Cap expansion)
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">UBS Pune</span>
                  <span className="text-slate-400 font-mono text-[10px]">Sep 10, 2026</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Departmental Faculty-Student Ratio Audit &amp; residential thesis review
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar className="h-4 w-4 text-white" />
              <span>Schedule Commission Panel</span>
            </button>
          </div>

          {/* Block 3: Regional Hub Density */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Regional Hub Density</h3>
              <span className="text-xs font-bold text-slate-500 font-mono">142 Total</span>
            </div>

            {/* SVG Donut Chart */}
            <div className="flex justify-center py-2">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Background ring */}
                  <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  {/* South Asia: 55% = strokeDasharray 131 238 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#006f67"
                    strokeWidth="10"
                    strokeDasharray="131 238"
                    strokeDashoffset="0"
                    fill="transparent"
                  />
                  {/* Southeast Asia: 31% = 74 238 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#1e293b"
                    strokeWidth="10"
                    strokeDasharray="74 238"
                    strokeDashoffset="-131"
                    fill="transparent"
                  />
                  {/* East Asia: 14% = 33 238 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#64748b"
                    strokeWidth="10"
                    strokeDasharray="33 238"
                    strokeDashoffset="-205"
                    fill="transparent"
                  />
                </svg>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#006f67]" />
                  <span>South Asia</span>
                </div>
                <span className="font-bold text-slate-900">78 (55%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1e293b]" />
                  <span>Southeast Asia</span>
                </div>
                <span className="font-bold text-slate-900">44 (31%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#64748b]" />
                  <span>East Asia</span>
                </div>
                <span className="font-bold text-slate-900">20 (14%)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Regional Secretariat Oversight:</span>
              <span className="font-bold text-[#006f67]">Bengaluru / Manila</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Modals */}

      {/* Quota Adjustment Modal */}
      {quotaModalOpen && selectedInstForQuota && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#006f67] text-white flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Adjust Institutional Quota Ceiling</h3>
                  <p className="text-xs text-slate-500">ATA Commission Authorization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuotaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedInstForQuota.name}</p>
              <p className="text-slate-500">
                Code: {selectedInstForQuota.code} • Current Ceiling: {selectedInstForQuota.institutionalQuota.capacity} scholars
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Annual Intake Quota Ceiling
                </label>
                <input
                  type="number"
                  value={newQuotaCeiling}
                  onChange={e => setNewQuotaCeiling(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Commission Review Justification
                </label>
                <textarea
                  value={quotaReason}
                  onChange={e => setQuotaReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuotaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuota}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#006f67] text-white hover:bg-[#005a54] shadow-xs"
              >
                Authorize Quota Mutation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Commission Panel Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Schedule Commission Panel Review</h3>
                  <p className="text-xs text-slate-500">Triennial Accreditation Evaluation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Seminary</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]">
                  <option>Union Biblical Seminary (UBS Pune) — Sep 10, 2026</option>
                  <option>SAIACS Bengaluru — Aug 15, 2026</option>
                  <option>Alliance Biblical Seminary (Manila) — Oct 24, 2026</option>
                  <option>Aizawl Theological College (ATC Mizoram) — Nov 12, 2026</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Commissioner</label>
                <input
                  type="text"
                  defaultValue="Dr. Grace Chen (Council Director)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Scope</label>
                <textarea
                  rows={2}
                  defaultValue="Comprehensive inspection of faculty residential tenure, M.Div course load, library accession standards, and student transcripts."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Commission panel consultation confirmed and notifications dispatched.');
                  setScheduleModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800 shadow-xs"
              >
                Confirm Commission Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Audit File Modal */}
      {auditFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Commission Charter Report</h3>
                  <p className="text-xs text-slate-500">Accredited Triennial Attestation Record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuditFileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-900">ATA Resolution #2024-TR-09</p>
              <p>
                Chartered under the authority of Asia Theological Association Central Executive Synod. All 142 affiliated
                seminaries comply with 1:12 faculty ratios and baseline credit standards.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px] text-slate-500">
                <span>DIGEST: sha256:7f9a...80e3</span>
                <span className="font-bold text-emerald-600">SEAL: COMPLIANT</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAuditFileModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Downloading official signed Charter Report (PDF)...');
                  setAuditFileModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#006f67] text-white hover:bg-[#005a54] shadow-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Report PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Curricula Drawer */}
      {curriculaDrawerInst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{curriculaDrawerInst.name}</h3>
                <p className="text-xs text-slate-500">
                  Approved Degree Programs &amp; Curricula Matrix ({curriculaDrawerInst.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurriculaDrawerInst(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Master of Divinity (M.Div)</p>
                  <p className="text-[11px] text-slate-500">90 Credits • Duration: 3 Years</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                  Accredited &amp; Active
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Master of Theology (M.Th)</p>
                  <p className="text-[11px] text-slate-500">42 Credits • Duration: 2 Years</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                  Accredited &amp; Active
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Bachelor of Theology (B.Th)</p>
                  <p className="text-[11px] text-slate-500">108 Credits • Duration: 3 Years</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                  Accredited &amp; Active
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Doctor of Ministry (D.Min)</p>
                  <p className="text-[11px] text-slate-500">36 Credits • Duration: 3 Years</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                  Accredited &amp; Active
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurriculaDrawerInst(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
