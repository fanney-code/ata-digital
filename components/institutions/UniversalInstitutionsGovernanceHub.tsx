'use client';

import React, { useState, useMemo } from 'react';
import { Institution, Department, Program } from '@/lib/types';
import {
  Building2,
  BookOpen,
  Users,
  Calendar,
  Download,
  Zap,
  Plus,
  Search,
  SlidersHorizontal,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Award,
  Clock,
  Key,
  Check,
  X,
  ExternalLink,
  FileText,
  ChevronRight,
  AlertTriangle,
  MapPin,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Edit3,
} from 'lucide-react';

export interface UniversalInstitutionItem {
  id: string;
  name: string;
  code: string;
  establishedYear: number;
  location: string;
  deanName: string;
  ratingBadge: string;
  thumbnailUrl?: string;
  quota?: {
    enrolled: number;
    capacity: number;
    percentage: number;
  };
  enrolledScholarsCount?: number;
  auditTag?: {
    text: string;
    variant: 'orange' | 'cyan' | 'slate';
  };
  chartersCount?: number;
  ratioOrNote?: string;
  programs?: {
    name: string;
    enrolled: number;
    capacity: number;
    percentage: number;
  }[];
  clearanceNote?: string;
  charterSealNote?: string;
}

export const INITIAL_UNIVERSAL_INSTITUTIONS: UniversalInstitutionItem[] = [
  {
    id: 'u-inst-01',
    name: 'South Asia Institute of Advanced Christian Studies (SAIACS)',
    code: 'ATA-AFF-042',
    establishedYear: 1982,
    location: 'Bengaluru, Karnataka, India',
    deanName: 'Dr. Ashish Christopher',
    ratingBadge: 'Class-A Exemplary',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=240&auto=format&fit=crop&q=80',
    quota: {
      enrolled: 482,
      capacity: 520,
      percentage: 92.6,
    },
    programs: [
      { name: 'Master of Divinity (M.Div)', enrolled: 45, capacity: 50, percentage: 90 },
      { name: 'Master of Theology (M.Th)', enrolled: 18, capacity: 20, percentage: 90 },
      { name: 'Doctor of Philosophy (Ph.D)', enrolled: 8, capacity: 10, percentage: 80 },
    ],
    clearanceNote: 'Triennial Commission Clearance Valid until Nov 2027',
    charterSealNote: 'WORM Sealed charter #9821-SAIACS-IN • Full Serampore Reciprocal Transfer Cleared',
  },
  {
    id: 'u-inst-02',
    name: 'Union Biblical Seminary (UBS Pune)',
    code: 'ATA-AFF-018',
    establishedYear: 1953,
    location: 'Pune, Maharashtra, India',
    deanName: 'Rev. Dr. B. Thomas',
    ratingBadge: 'Class-A Conforming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=240&auto=format&fit=crop&q=80',
    enrolledScholarsCount: 560,
    auditTag: {
      text: 'Re-Accreditation: Sep 10, 2026',
      variant: 'orange',
    },
    chartersCount: 18,
    ratioOrNote: '18 Approved Curricula Charters • 1:11 Faculty-Student Ratio • Triennial Renewal Audit in Progress',
  },
  {
    id: 'u-inst-03',
    name: 'Alliance Biblical Seminary (ABS Manila)',
    code: 'ATA-AFF-088',
    establishedYear: 1974,
    location: 'Quezon City, Metro Manila, Philippines',
    deanName: 'Dr. R. Santos',
    ratingBadge: 'Class-A',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=240&auto=format&fit=crop&q=80',
    enrolledScholarsCount: 320,
    auditTag: {
      text: 'Audit Clearance Good Thru 2028',
      variant: 'cyan',
    },
    chartersCount: 12,
    ratioOrNote: '12 Approved Curricula • Southeast Asia Regional Node Hub',
  },
  {
    id: 'u-inst-04',
    name: 'Aizawl Theological College (ATC Mizoram)',
    code: 'ATA-AFF-029',
    establishedYear: 1907,
    location: 'Durtlang, Aizawl, Mizoram, India',
    deanName: 'Rev. Dr. C. Chawnghmingliana',
    ratingBadge: 'Class-A Exemplary',
    thumbnailUrl: undefined,
    enrolledScholarsCount: 210,
    auditTag: {
      text: 'Historic Charter Active',
      variant: 'slate',
    },
    chartersCount: 8,
    ratioOrNote: '8 Approved Curricula • M.Th & B.D Specialization',
  },
];

interface UniversalInstitutionsGovernanceHubProps {
  institutions?: Institution[];
  departments?: Department[];
  programs?: Program[];
}

export const UniversalInstitutionsGovernanceHub: React.FC<UniversalInstitutionsGovernanceHubProps> = ({
  institutions = [],
  departments = [],
  programs = [],
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Root Mutation Enclave Toggles
  const [freezeIntake, setFreezeIntake] = useState(false);
  const [curriculumReinspect, setCurriculumReinspect] = useState(true);
  const [seramporeSync, setSeramporeSync] = useState(true);

  // Dynamic Institutions List
  const [institutionList, setInstitutionList] = useState<UniversalInstitutionItem[]>(INITIAL_UNIVERSAL_INSTITUTIONS);

  // Modals State
  const [charterModalOpen, setCharterModalOpen] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstLocation, setNewInstLocation] = useState('');
  const [newInstDean, setNewInstDean] = useState('');
  const [newInstCap, setNewInstCap] = useState('150');

  const [emergencyQuotaModalOpen, setEmergencyQuotaModalOpen] = useState(false);
  const [targetInstForQuota, setTargetInstForQuota] = useState<UniversalInstitutionItem | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState('550');
  const [quotaJustification, setQuotaJustification] = useState('');

  const [editChartersModalOpen, setEditChartersModalOpen] = useState(false);
  const [inspectAuditModalOpen, setInspectAuditModalOpen] = useState(false);
  const [registrarKeyModalOpen, setRegistrarKeyModalOpen] = useState(false);
  const [targetInstForKey, setTargetInstForKey] = useState<UniversalInstitutionItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter institutions
  const filteredInstitutions = useMemo(() => {
    return institutionList.filter((inst) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = inst.name.toLowerCase().includes(q);
        const matchCode = inst.code.toLowerCase().includes(q);
        const matchLoc = inst.location.toLowerCase().includes(q);
        const matchDean = inst.deanName.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLoc && !matchDean) return false;
      }
      if (selectedRegion !== 'ALL' && !inst.location.toLowerCase().includes(selectedRegion.toLowerCase())) {
        return false;
      }
      if (selectedTier !== 'ALL' && !inst.ratingBadge.toLowerCase().includes(selectedTier.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [institutionList, searchQuery, selectedRegion, selectedTier]);

  // Handle Charter New Institution
  const handleCreateCharter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstLocation.trim()) return;

    const newCode = `ATA-AFF-${String(institutionList.length + 101).padStart(3, '0')}`;
    const newEntry: UniversalInstitutionItem = {
      id: `u-inst-${Date.now()}`,
      name: newInstName.trim(),
      code: newCode,
      establishedYear: new Date().getFullYear(),
      location: newInstLocation.trim(),
      deanName: newInstDean.trim() || 'Dr. Appointed Dean',
      ratingBadge: 'Class-A Conforming',
      thumbnailUrl: undefined,
      enrolledScholarsCount: 0,
      chartersCount: 4,
      ratioOrNote: 'Newly Chartered • Triennial Induction Review in Progress',
      auditTag: {
        text: 'Initial Charter 2026',
        variant: 'cyan',
      },
    };

    setInstitutionList((prev) => [newEntry, ...prev]);
    setCharterModalOpen(false);
    setNewInstName('');
    setNewInstLocation('');
    setNewInstDean('');
    showToast(`New Seminary '${newEntry.name}' successfully chartered into regional directory under ${newCode}.`);
  };

  // Handle Emergency Quota Override
  const handleCommitQuotaOverride = () => {
    if (!targetInstForQuota) return;
    const parsedCap = parseInt(newQuotaValue, 10) || 550;

    setInstitutionList((prev) =>
      prev.map((inst) => {
        if (inst.id === targetInstForQuota.id && inst.quota) {
          return {
            ...inst,
            quota: {
              ...inst.quota,
              capacity: parsedCap,
              percentage: Math.round((inst.quota.enrolled / parsedCap) * 1000) / 10,
            },
          };
        }
        return inst;
      })
    );

    setEmergencyQuotaModalOpen(false);
    showToast(`Emergency Quota Ceiling for ${targetInstForQuota.name} reallocated to ${parsedCap} seats.`);
  };

  // Handle Export Curricula Catalog
  const handleExportCatalog = () => {
    const catalog = {
      catalogTitle: 'Asia Theological Association Master Curricula Catalog',
      exportedAt: new Date().toISOString(),
      totalSeminaries: 142,
      totalCharters: 618,
      regionalBreakdown: {
        doctoral: 48,
        masters: 312,
        bachelors: 198,
        diploma: 60,
      },
      charteredInstitutions: institutionList,
    };

    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATA_Curricula_Catalog_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Master Curricula Catalog (.json) exported successfully.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#131b26] text-white px-4 py-3 rounded-2xl shadow-xl border border-teal-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{toastMessage}</p>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Protocol Sub-Bar & Universal Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium tracking-wide">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">ATA Universal Authority</span>
          <span>&rsaquo;</span>
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Academic Governance</span>
          <span>&rsaquo;</span>
          <span className="text-slate-900 font-bold">Institutions &amp; Curricula Governance Hub</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 font-semibold shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>ROOT AUTONOMY LEVEL-0 • ED25519 VERIFIED MERKLE MASTER • RECIPROCAL TREATY PROTOCOL 11.2</span>
        </div>
      </div>

      {/* 2. Category Tag & Page Title */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
              Institutions &amp; Curricula Hub
            </h1>
          </div>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Pan-Asian authority across 142 accredited theological seminaries, 618 approved degree charters, and regional
            enrollment quota ceilings. Execute root accreditation mutations, syllabus charter amendments, and emergency quota
            reallocation.
          </p>
        </div>

        {/* 3 Top Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleExportCatalog}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Curricula Catalog (.xlsx / JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetInstForQuota(institutionList[0]);
              setEmergencyQuotaModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Zap className="h-4 w-4 text-red-600" />
            <span>Emergency Quota Override</span>
          </button>

          <button
            type="button"
            onClick={() => setCharterModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>+ Charter New Institution</span>
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
            <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">142</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#006f67]">
                +6 this triennium
              </span>
              <span className="text-slate-500 font-medium">100% in 38 nations</span>
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
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">618</div>
            {/* 4 sub-stats row */}
            <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="block font-bold text-slate-900">48</span>
                <span className="text-[10px] text-slate-400">D.Th</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">312</span>
                <span className="text-[10px] text-slate-400">M.Div</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">198</span>
                <span className="text-[10px] text-slate-400">B.Th</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">60</span>
                <span className="text-[10px] text-slate-400">Dip</span>
              </div>
            </div>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-3" />
        </div>

        {/* Card 3: REGIONAL ENROLLMENT CAPACITY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                REGIONAL ENROLLMENT CAPACITY
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">12,450</span>
              <span className="text-xs font-semibold text-slate-400">Max Cap</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">10,482 Active Matriculants</span>
              <span className="font-bold text-emerald-600">84.2% Filled</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>

        {/* Card 4: TRIENNIAL RE-ACCREDITATIONS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TRIENNIAL RE-ACCREDITATIONS
              </span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 tracking-tight">8</span>
              <span className="text-sm font-bold text-slate-800">Seminaries</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-rose-600 font-bold">2026 Cycle</span>
              <span className="text-slate-500">Panel Audits Scheduled</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-rose-600 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Search & Capsule Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seminary by name, code, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006f67]/20 focus:border-[#006f67]"
          />
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full md:w-52 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
        >
          <option value="ALL">Region: All Asia (142)</option>
          <option value="India">South Asia (India)</option>
          <option value="Philippines">Southeast Asia (Philippines)</option>
          <option value="Korea">East Asia (Korea / Japan)</option>
        </select>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
        >
          <option value="ALL">Accreditation Tier: All</option>
          <option value="Exemplary">Class-A Exemplary</option>
          <option value="Conforming">Class-A Conforming</option>
        </select>

        <button
          type="button"
          onClick={() => showToast('Filters refreshed.')}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 5. Dual-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Spans): Accredited Theological Seminaries */}
        <div className="lg:col-span-2 space-y-4">
          {filteredInstitutions.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {inst.thumbnailUrl ? (
                    <img
                      src={inst.thumbnailUrl}
                      alt={inst.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm border border-slate-200 shrink-0">
                      {inst.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 3)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">{inst.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#006f67] border border-teal-200">
                        ● {inst.ratingBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      <span className="font-mono text-slate-700 font-semibold">{inst.code}</span> • Est.{' '}
                      {inst.establishedYear} • {inst.location} • Dean: {inst.deanName}
                    </p>
                  </div>
                </div>

                {/* Quota or Scholars Box */}
                {inst.quota && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      {inst.quota.enrolled} <span className="text-slate-400 font-normal">/ {inst.quota.capacity} Quota</span>
                    </div>
                    <div className="text-[11px] font-bold text-[#006f67]">
                      {inst.quota.percentage}% Capacity Utilized
                    </div>
                  </div>
                )}

                {inst.enrolledScholarsCount && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      {inst.enrolledScholarsCount} <span className="text-slate-400 font-normal">Enrolled Scholars</span>
                    </div>
                    {inst.auditTag && (
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          inst.auditTag.variant === 'orange'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inst.auditTag.variant === 'cyan'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inst.auditTag.text}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Subtext info */}
              {inst.ratioOrNote && (
                <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-medium">
                  {inst.ratioOrNote}
                </div>
              )}

              {/* Curricula Progress Bars (if detailed institution like SAIACS) */}
              {inst.programs && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {inst.programs.map((prog, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate">{prog.name}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006f67]" />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>
                          Enrolled: {prog.enrolled} / {prog.capacity}
                        </span>
                        <span className="font-bold text-[#006f67]">{prog.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#006f67] rounded-full" style={{ width: `${prog.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Clearance Note */}
              {inst.clearanceNote && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{inst.clearanceNote}</span>
                  </div>
                  {inst.charterSealNote && (
                    <p className="text-[11px] font-mono text-slate-400 pl-6">{inst.charterSealNote}</p>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {inst.programs ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditChartersModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Edit Degree Charters</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectAuditModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Inspect Commission Audit File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Conferred Scrolls ledger opened for ${inst.name}.`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Award className="h-3.5 w-3.5 text-slate-500" />
                        <span>View Conferred Scrolls</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => showToast(`Inspect Curricula opened for ${inst.name}.`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <span>Inspect {inst.chartersCount || 8} Curricula</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetInstForQuota(inst);
                          setEmergencyQuotaModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <span>Adjust Quota Ceiling</span>
                      </button>

                      {inst.id === 'u-inst-02' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetInstForKey(inst);
                            setRegistrarKeyModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                        >
                          <Key className="h-3.5 w-3.5" />
                          <span>Provision Registrar Key</span>
                        </button>
                      )}

                      {inst.id === 'u-inst-03' && (
                        <button
                          type="button"
                          onClick={() => showToast('Audit Dossier opened for Alliance Biblical Seminary Manila.')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <span>Audit Dossier</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {inst.programs && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetInstForQuota(inst);
                      setEmergencyQuotaModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-rose-600 font-bold text-xs hover:underline"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Emergency Quota Override</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column (1 Span): Root Mutation Enclave & Telemetry */}
        <div className="space-y-4">
          {/* Card 1: ROOT MUTATION ENCLAVE (Dark Navy Card) */}
          <div className="bg-[#131b26] rounded-2xl border border-slate-800 p-5 shadow-md text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block">
                    ROOT MUTATION ENCLAVE
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                SUPER-ADMIN
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Universal Quota &amp; Curriculum Authority</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Execute instantaneous mutations directly into the ATA cryptographic ledger. All actions trigger distributed
                consensus across 3 regional node validator pairs.
              </p>
            </div>

            {/* 3 Interactive Toggle Switches */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              {/* Toggle 1: Freeze Intake Portals */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Freeze Intake Portals</span>
                  <span className="text-[11px] text-slate-400">Halts regional candidate registrations</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !freezeIntake;
                    setFreezeIntake(next);
                    showToast(`Intake Portals: ${next ? 'FROZEN across all 142 seminaries' : 'ACTIVE'}`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    freezeIntake ? 'bg-red-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-transform ${
                      freezeIntake ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Curriculum Re-Inspection */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Curriculum Re-Inspection</span>
                  <span className="text-[11px] text-slate-400">Mandatory syllabus audit flag</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !curriculumReinspect;
                    setCurriculumReinspect(next);
                    showToast(`Curriculum Re-Inspection Flag: ${next ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    curriculumReinspect ? 'bg-[#006f67]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-transform ${
                      curriculumReinspect ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Serampore Treaty Sync */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Serampore Treaty Sync</span>
                  <span className="text-[11px] text-slate-400">Real-time credit transfer equivalence</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !seramporeSync;
                    setSeramporeSync(next);
                    showToast(`Serampore Reciprocal Treaty Sync: ${next ? 'SYNCHRONIZED' : 'PAUSED'}`);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    seramporeSync ? 'bg-[#006f67]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-transform ${
                      seramporeSync ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>WORM Key ID: 0x9F36...A194</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>

          {/* Card 2: Commission Benchmarks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#006f67]" />
                <h3 className="font-extrabold text-slate-900 text-sm">Commission Benchmarks</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">v8.4 Charter</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="font-bold text-slate-900 block">M.Div Residential Requirement</span>
                <p className="text-[11px] text-slate-500">
                  90+ Credit Hours on-campus instruction. Maximum 20% distance learning allowable.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="font-bold text-slate-900 block">M.Th Specialized Thesis</span>
                <p className="text-[11px] text-slate-500">
                  42+ Credit Hours with mandatory peer dissertation defense evaluated by external examiner.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="font-bold text-slate-900 block">Ph.D Residency &amp; Monograph</span>
                <p className="text-[11px] text-slate-500">
                  54+ Credit Hours + Defended Monograph with Dual ATA Reader audit verification.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-0.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#006f67] block">Faculty-to-Student Ratio</span>
                  <span className="text-[10px] text-slate-500">Mandatory Doctoral Ceiling:</span>
                </div>
                <span className="font-mono text-base font-extrabold text-[#006f67]">1 : 12</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast('Full ATA Accreditation Manual v8.4 (PDF) generated.')}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Review Complete Accreditation Manual</span>
            </button>
          </div>

          {/* Card 3: Regional Density */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Regional Density</h3>
              <span className="text-slate-400 text-xs font-semibold">38 Jurisdictions</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>South Asia</span>
                  <span>78 Seminaries (55%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">India, Sri Lanka, Nepal, Bangladesh</p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006f67] w-[55%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Southeast Asia</span>
                  <span>44 Seminaries (31%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">Philippines, Indonesia, Malaysia, Singapore, Thailand</p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 w-[31%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>East Asia</span>
                  <span>20 Seminaries (14%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">South Korea, Japan, Taiwan, Hong Kong</p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 w-[14%]" />
                </div>
              </div>
            </div>

            {/* Circular Donut Ring Graphic */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-4">
              <svg className="h-16 w-16 -rotate-90 shrink-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#006f67"
                  strokeWidth="4"
                  strokeDasharray="48 52"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeDasharray="27 73"
                  strokeDashoffset="-48"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="4"
                  strokeDasharray="12 88"
                  strokeDashoffset="-75"
                />
              </svg>

              <div className="text-[11px] text-slate-500 leading-snug">
                <span className="font-bold text-slate-900 block">142 Member Faculties</span>
                <span>Total Enrolled: 10,482</span>
                <span className="block text-slate-400">Accredited Triennium 2024–2027</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom ATA Charter Protocol Bar */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p className="text-slate-600">
          <strong className="text-slate-900">ATA Charter Article 9:</strong> Curricular Accreditation &amp; Cross-Institutional
          Standards • All charter amendments require supermajority council quorum.
        </p>

        <div className="flex items-center gap-3 font-mono shrink-0">
          <span className="text-slate-500">Merkle Hash: 0x8F92...B319</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Raft-BFT v2.4 Consensus Active</span>
          </span>
        </div>
      </div>

      {/* MODAL 1: Charter New Institution Modal */}
      {charterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Charter New Theological Institution</h3>
                  <p className="text-xs text-slate-500">Universal Super-Admin Accreditation Ledger Intake</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCharterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCharter} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seminary Name *</label>
                <input
                  type="text"
                  required
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  placeholder="e.g. Colombo Theological Seminary"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Jurisdiction *</label>
                  <input
                    type="text"
                    required
                    value={newInstLocation}
                    onChange={(e) => setNewInstLocation(e.target.value)}
                    placeholder="e.g. Colombo, Sri Lanka"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Principal / Academic Dean</label>
                  <input
                    type="text"
                    value={newInstDean}
                    onChange={(e) => setNewInstDean(e.target.value)}
                    placeholder="e.g. Dr. Ivor Poobalan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Annual Quota Ceiling</label>
                <input
                  type="number"
                  value={newInstCap}
                  onChange={(e) => setNewInstCap(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006f67]/20 font-mono"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-slate-700 space-y-1">
                <span className="font-bold text-[#006f67]">Root Ledger Attestation:</span>
                <p className="text-[11px] leading-relaxed">
                  Charter issuance triggers instant cryptographic key-pair provisioning for the college registrar and
                  broadcasts the new node to the Asia Theological Association federation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCharterModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                >
                  Issue Official Charter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Quota Override Modal */}
      {emergencyQuotaModalOpen && targetInstForQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Emergency Quota Ceiling Override</h3>
                  <p className="text-xs text-slate-500">{targetInstForQuota.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyQuotaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Charter Code:</span>
                  <span className="font-mono font-bold text-slate-900">{targetInstForQuota.code}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Current Capacity:</span>
                  <span className="font-bold text-slate-900">
                    {targetInstForQuota.quota?.capacity || 520} Seats ({targetInstForQuota.quota?.enrolled || 482} Enrolled)
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Capacity Ceiling</label>
                <input
                  type="number"
                  value={newQuotaValue}
                  onChange={(e) => setNewQuotaValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Justification *</label>
                <textarea
                  rows={2}
                  value={quotaJustification}
                  onChange={(e) => setQuotaJustification(e.target.value)}
                  placeholder="e.g. Extraordinary missionary intake approval from Regional Council Secretariat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmergencyQuotaModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitQuotaOverride}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
              >
                Commit Quota Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Provision Registrar Key Modal */}
      {registrarKeyModalOpen && targetInstForKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Provision Registrar FIDO2 Key</h3>
                  <p className="text-xs text-slate-500">{targetInstForKey.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegistrarKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block">Assigned Official Officer:</span>
                <span className="font-bold text-slate-900 text-sm block">{targetInstForKey.deanName}</span>
                <span className="font-mono text-slate-500 text-[11px] block">{targetInstForKey.code}</span>
              </div>

              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
                <span className="font-bold text-[#006f67] block">Generated Hardware Token:</span>
                <div className="p-2 bg-white rounded border border-teal-200 font-mono text-[11px] text-slate-800 break-all select-all font-bold">
                  FIDO2-TOK-SG-01-UBS-9821-X4K9-2026
                </div>
                <p className="text-[10px] text-slate-500">
                  Bind this cryptographic token to the institutional officer hardware key. Valid for 12 months.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setRegistrarKeyModalOpen(false);
                  showToast(`FIDO2 Key token provisioned for ${targetInstForKey.deanName}.`);
                }}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Dispatch Token to Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Degree Charters Modal */}
      {editChartersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Degree Charters</h3>
                  <p className="text-xs text-slate-500">SAIACS Bengaluru Curricular Standards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditChartersModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Master of Divinity (M.Div)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Charter Valid
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">90 Credit Hours • Residential 3-Year • 50 Quota</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Master of Theology (M.Th)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Charter Valid
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">42 Credit Hours • Thesis Track • 20 Quota</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Doctor of Philosophy (Ph.D)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Charter Valid
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">54 Credit Hours • Monograph Defense • 10 Quota</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditChartersModalOpen(false);
                  showToast('Degree charters saved to root ledger.');
                }}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Save Charter Amendments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Inspect Audit Modal */}
      {inspectAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Commission Audit File</h3>
                  <p className="text-xs text-slate-500">SAIACS Triennial Compliance Docket</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 font-mono text-xs text-slate-700 bg-slate-50 m-5 rounded-xl border border-slate-200">
              <div className="text-emerald-700 font-bold">STATUS: 100% CONFORMING (CLASS-A EXEMPLARY)</div>
              <div>Affiliation: ATA-AFF-042 (Bengaluru HQ)</div>
              <div>Faculty Ratio: 1:9 (Conforming with Doctoral Ceiling 1:12)</div>
              <div>Library Holdings: 58,000 Volumes (Exemplary Tier)</div>
              <div>Clearance Valid Through: 30 November 2027</div>
              <div>Next Panel Review: Q3 2027</div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
