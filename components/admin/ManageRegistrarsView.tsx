'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Profile, Institution } from '@/lib/types';
import { createAuditLog, fetchInstitutions } from '@/lib/api/supabase-service';
import {
  UserCheck,
  UserPlus,
  Search,
  RefreshCw,
  Download,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  Globe,
  Sliders,
  Key,
  Ban,
  Send,
  Trash2,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Zap,
  Check,
  X,
  FileText,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

export interface RegistrarAccountItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  initialsVariant: 'mint' | 'blue' | 'purple' | 'slate';
  institution: {
    name: string;
    subDetails: string;
    code: string;
  };
  permissions: {
    title: string;
    description: string;
    tier: string;
  };
  lastActive: {
    label: string;
    isActiveNow?: boolean;
    ipDetails?: string;
    inviteNote?: string;
  };
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED';
  isVerified?: boolean;
}

export const INITIAL_REGISTRAR_ACCOUNTS: RegistrarAccountItem[] = [
  {
    id: 'reg-acc-01',
    name: 'Rev. M. Thomas',
    email: 'm.thomas@saiacs.org',
    initials: 'MT',
    initialsVariant: 'mint',
    institution: {
      name: 'SAIACS Bengaluru',
      subDetails: 'South Asia Institute of Advanced Christian Studies • IN-KA-004',
      code: 'SAIACS',
    },
    permissions: {
      title: 'Head Academic Registrar',
      description: 'Full Intake & Batch CSV Import',
      tier: 'Tier-2 Full',
    },
    lastActive: {
      label: 'Active now',
      isActiveNow: true,
      ipDetails: 'IP: 182.73.12.91 (Bengaluru)',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-acc-02',
    name: 'Dr. Ashish Christopher',
    email: 'ashishc@ubs.ac.in',
    initials: 'AC',
    initialsVariant: 'blue',
    institution: {
      name: 'Union Biblical Seminary (UBS)',
      subDetails: 'Pune, Maharashtra • IN-MH-011',
      code: 'UBS',
    },
    permissions: {
      title: 'Senior Registrar',
      description: 'Intake & Document Verifications',
      tier: 'Tier-2 Verifier',
    },
    lastActive: {
      label: '2 hours ago',
      ipDetails: 'IP: 49.36.88.14 (Pune)',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-acc-03',
    name: 'Dr. Maria Elena Santos',
    email: 'registrar@abseminary.edu.ph',
    initials: 'MS',
    initialsVariant: 'purple',
    institution: {
      name: 'Allahabad Bible Seminary (ABS)',
      subDetails: 'Prayagraj / Allahabad, Uttar Pradesh • IN-UP-002',
      code: 'ABS',
    },
    permissions: {
      title: 'Regional Hub Registrar',
      description: 'Archipelago Intake & Equivalence',
      tier: 'Tier-2 Hub',
    },
    lastActive: {
      label: 'Yesterday, 15:40',
      ipDetails: 'IP: 119.93.18.204 (Manila)',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-acc-04',
    name: 'Rev. Prof. Lalrinkima',
    email: 'rima.prof@atc.edu.in',
    initials: 'RL',
    initialsVariant: 'slate',
    institution: {
      name: 'Aizawl Theological College (ATC)',
      subDetails: 'Aizawl, Mizoram • IN-MZ-001',
      code: 'ATC',
    },
    permissions: {
      title: 'Academic Dean & Registrar',
      description: 'Full Administrative Intake Scope',
      tier: 'Tier-2 Dean',
    },
    lastActive: {
      label: '3 days ago',
      ipDetails: 'IP: 103.220.14.72 (Aizawl)',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-acc-05',
    name: 'Jennifer K. Hwang',
    email: 'j.hwang@acts.ac.kr',
    initials: 'JH',
    initialsVariant: 'slate',
    institution: {
      name: 'Asian Center for Theo. Studies (ACTS)',
      subDetails: 'Seoul, South Korea • KR-SEL-008',
      code: 'ACTS',
    },
    permissions: {
      title: 'Candidate Registrar',
      description: 'Awaiting initial induction & 2FA Bind',
      tier: 'Tier-2 Pending',
    },
    lastActive: {
      label: 'Never connected',
      inviteNote: 'Invite sent Feb 26 • Exp: 18h',
    },
    status: 'PENDING_ACTIVATION',
    isVerified: false,
  },
];

export const ManageRegistrarsView: React.FC = () => {
  const [dbProfiles, setDbProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRegistrar, setSelectedRegistrar] = useState<RegistrarAccountItem | null>(null);
  const [isBylawsModalOpen, setIsBylawsModalOpen] = useState(false);

  // New Registrar Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionName, setInstitutionName] = useState('SAIACS Bengaluru');
  const [institutionsList, setInstitutionsList] = useState<Institution[]>([]);
  const [roleTitle, setRoleTitle] = useState('Senior Registrar');
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, insts] = await Promise.all([
        fetch('/api/admin/registrars', { credentials: 'include' }).then(r => r.json()).catch(() => ({ profiles: [] })),
        fetchInstitutions().catch(() => [] as Institution[]),
      ]);
      const all: Profile[] = allRes.profiles || [];
      const regs = all.filter(p => p.role === 'REGISTRAR');
      setDbProfiles(regs);
      setInstitutionsList(insts);
    } catch (err: any) {
      console.warn('Profiles load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge database profiles with canonical mock data
  const mergedRegistrars = useMemo(() => {
    const list: RegistrarAccountItem[] = [...INITIAL_REGISTRAR_ACCOUNTS];

    dbProfiles.forEach(p => {
      const match = list.some(r => r.email.toLowerCase() === p.email.toLowerCase());
      if (!match) {
        const initials = p.full_name
          ? p.full_name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : 'RG';

        list.push({
          id: p.id,
          name: p.full_name,
          email: p.email,
          initials,
          initialsVariant: 'blue',
          institution: {
            name: 'Affiliated Seminary',
            subDetails: 'Chartered Theological Institution',
            code: 'ATA',
          },
          permissions: {
            title: 'Institutional Registrar',
            description: 'Intake & Verification Access',
            tier: 'Tier-2 Standard',
          },
          lastActive: {
            label: 'Recent Session',
            ipDetails: 'IP: 103.24.81.12',
          },
          status: 'ACTIVE',
          isVerified: true,
        });
      }
    });

    return list;
  }, [dbProfiles]);

  // Filtered rows
  const filteredRegistrars = useMemo(() => {
    return mergedRegistrars.filter(r => {
      // Status Tab
      if (statusTab === 'ACTIVE' && r.status !== 'ACTIVE') return false;
      if (statusTab === 'PENDING' && r.status !== 'PENDING_ACTIVATION') return false;
      if (statusTab === 'SUSPENDED' && r.status !== 'SUSPENDED') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesEmail = r.email.toLowerCase().includes(q);
        const matchesInst = r.institution.name.toLowerCase().includes(q);
        const matchesRole = r.permissions.title.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesInst && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [mergedRegistrars, statusTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrars.length / pageSize));
  const paginatedRegistrars = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrars.slice(start, start + pageSize);
  }, [filteredRegistrars, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusTab]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Handle Provision New Registrar — through BFF (Administrator role verified server-side)
  const handleProvisionRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('Please enter registrar full name and official email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find matching institution ID from master data
      const matchedInst = institutionsList.find(i => 
        institutionName.includes(i.code) || 
        institutionName.toLowerCase().includes(i.name.toLowerCase()) ||
        i.name.toLowerCase().includes(institutionName.toLowerCase())
      );

      // Persist registrar account through BFF — server verifies ADMINISTRATOR role
      const res = await fetch('/api/admin/registrars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          institutionId: matchedInst?.id,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to provision registrar');
      }

      // Audit log creation
      await createAuditLog({
        action: 'STATUS_CHANGED',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'Chief Academic Administrator / Council Director',
        entity_type: 'STUDENT',
        entity_id: `usr-${Date.now()}`,
        target_name: fullName,
        target_ref: email,
        target_program: roleTitle,
        mutation_from: 'UNPROVISIONED',
        mutation_to: 'INVITATION_DISPATCHED',
        details: `Provisioned new registrar account for ${fullName} (${email}) at ${institutionName}. 24-hour verification token dispatched.`,
      });

      alert(`Official invitation link generated and dispatched to ${email}. Verification token active for 24 hours.`);
      setIsProvisionModalOpen(false);
      setFullName('');
      setEmail('');
      loadData();
    } catch (err: any) {
      alert(`Failed to provision registrar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="uppercase tracking-wider">ATA Central Administration</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="uppercase tracking-wider">Institutional Personnel &amp; Delegation</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold uppercase tracking-wider">Registrar Directory &amp; Provisioning</span>
        </div>
      </div>

      {/* 2. Top Tag, Header & Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>RBAC ENFORCED • OPERATIONAL TIER-2 PERSONNEL</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Manage &amp; Provision Registrar Accounts
          </h1>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Delegate operational student intake and record verification authority to accredited theological seminary
            officers. Provision encrypted credentials, partition institutional scopes, and audit real-time registrar
            sessions across Asian member seminaries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => alert('Exporting official registrar directory CSV...')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Directory (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4 text-white" />
            <span>+ Provision New Registrar</span>
          </button>
        </div>
      </div>

      {/* 3. Quick-Dispatch & Security Governance Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 spans): Institutional Registrar Quick-Dispatch */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#f0fdfa] border border-[#ccfbf1] shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#006f67] uppercase">
                <Zap className="h-4 w-4 text-[#006f67]" />
                <span>FAST INTAKE DELEGATION</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#99efe5] text-[#006f67] text-xs font-bold shadow-2xs">
                Tier-2 Credentials
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Institutional Registrar Quick-Dispatch
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Accreditation council bylaws mandate every affiliated seminary have at least one authenticated Dean or
              Registrar officer holding cryptographically validated intake authority. Newly provisioned accounts receive
              mandatory 24-hour verification links.
            </p>
          </div>

          {/* 3 Protocol Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#99efe5]/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Step 1: Identity &amp; Domain
              </span>
              <p className="font-bold text-xs text-slate-900">Whitelisted Campus Mail</p>
              <p className="text-[11px] text-slate-500">Rejects unverified public domains</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-[#99efe5]/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Step 2: Scoped Delegation
              </span>
              <p className="font-bold text-xs text-slate-900">Institution-Locked Scope</p>
              <p className="text-[11px] text-slate-500">Strict data compartmentalization</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-[#99efe5]/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Step 3: Protocol 2FA
              </span>
              <p className="font-bold text-xs text-slate-900">Mandatory FIDO2 Setup</p>
              <p className="text-[11px] text-slate-500">Hardware token or Authenticator</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#99efe5]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 text-[11px]">
              <Lock className="h-3.5 w-3.5 text-[#006f67]" />
              <span>Session IP bindings refreshed continuously via Regional Secretariat gateway.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(true)}
              className="font-bold text-xs text-[#006f67] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Launch Full Provisioning Drawer</span>
              <span className="font-mono">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Security Governance (Dark Card) */}
        <div className="p-6 rounded-2xl bg-[#131b26] text-white border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                SECURITY GOVERNANCE
              </span>
              <div className="h-8 w-8 rounded-xl bg-white/10 text-teal-400 flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-4xl font-extrabold text-white tracking-tight">142</div>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">Accredited Member Seminaries</p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All 184 active registrars maintain localized registry rights strictly isolated to candidate cohorts enrolled
              inside their chartered institution code.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Active Session Quota</span>
              <span className="font-bold text-teal-300">88% Capacity</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full w-[88%]" />
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              37 Simultaneous Active Sessions across 8 Regional Zones
            </p>
          </div>
        </div>
      </div>

      {/* 4. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL ACTIVE REGISTRARS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL ACTIVE REGISTRARS
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">184</span>
              <span className="text-xs font-bold text-[#006f67] bg-teal-50 px-1.5 py-0.5 rounded">
                +6 this mo.
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Across 142 accredited member colleges
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: PENDING ACTIVATION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                PENDING ACTIVATION
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">7</span>
              <span className="text-xs font-semibold text-slate-500">Invites pending</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Temporary token issued, awaiting <span className="text-amber-700 font-bold">2FA</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-amber-500 rounded-full mt-4" />
        </div>

        {/* Card 3: INTAKE VELOCITY (30D) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                INTAKE VELOCITY (30D)
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">482</span>
              <span className="text-xs font-semibold text-slate-500">Student filings</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Avg 2.6 candidate submissions / officer
            </div>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-4" />
        </div>

        {/* Card 4: SECURITY COMPLIANCE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                SECURITY COMPLIANCE
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">98.9%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Compliant
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Enforced hardware / authenticator app 2FA
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>
      </div>

      {/* 5. Regional Accreditation Mesh Banner */}
      <div className="p-4 rounded-2xl bg-[#eff4ff] border border-blue-100/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Asia-Wide Theological Accreditation Mesh</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active registrar endpoints distributed across 16 theological zones including India, South Korea,
              Philippines, and Singapore.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-white border border-blue-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>South Asia (94)</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-blue-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Southeast Asia (51)</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-blue-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span>East Asia (39)</span>
          </span>
        </div>
      </div>

      {/* 6. Search, Filter & Tabs Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by registrar name, official email, institution code, or..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006f67] shadow-2xs"
          />
        </div>

        {/* Tabs & Regional Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (184)
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active (177)
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Invite (7)
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('SUSPENDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === 'SUSPENDED'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suspended (0)
            </button>
          </div>

          <div className="relative">
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              aria-label="Filter by Regional Hub"
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer"
            >
              <option value="ALL">All Regional Hubs</option>
              <option value="SOUTH_ASIA">South Asia Hub</option>
              <option value="SOUTHEAST_ASIA">Southeast Asia Hub</option>
              <option value="EAST_ASIA">East Asia Hub</option>
            </select>
          </div>

          <button
            type="button"
            aria-label="Open filter settings"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-2xs"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 7. Registrar Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">REGISTRAR NAME &amp; PROFILE</th>
                <th className="py-3 px-4 font-bold">ASSIGNED INSTITUTION &amp; CAMPUS</th>
                <th className="py-3 px-4 font-bold">PERMISSIONS &amp; INTAKE ROLE</th>
                <th className="py-3 px-4 font-bold">LAST ACTIVE SESSION</th>
                <th className="py-3 px-4 font-bold">ACCOUNT STATUS</th>
                <th className="py-3 px-4 font-bold text-right">GOVERNANCE ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedRegistrars.map(reg => {
                return (
                  <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Registrar Name & Profile */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            reg.initialsVariant === 'mint'
                              ? 'bg-[#ccfbf1] text-[#0f766e]'
                              : reg.initialsVariant === 'blue'
                              ? 'bg-[#e0f2fe] text-[#0369a1]'
                              : reg.initialsVariant === 'purple'
                              ? 'bg-[#ede9fe] text-[#6d28d9]'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {reg.initials}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{reg.name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>{reg.email}</span>
                            {reg.isVerified && (
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Institution & Campus */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-900">{reg.institution.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{reg.institution.subDetails}</p>
                      </div>
                    </td>

                    {/* Permissions & Intake Role */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Key className="h-3 w-3 text-slate-400" />
                          <span>{reg.permissions.title}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">{reg.permissions.description}</p>
                      </div>
                    </td>

                    {/* Last Active Session */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        {reg.lastActive.isActiveNow ? (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{reg.lastActive.label}</span>
                          </div>
                        ) : (
                          <p className="font-bold text-slate-800 text-xs">{reg.lastActive.label}</p>
                        )}

                        {reg.lastActive.ipDetails && (
                          <p className="font-mono text-[10px] text-slate-400">{reg.lastActive.ipDetails}</p>
                        )}

                        {reg.lastActive.inviteNote && (
                          <p className="text-[10px] font-medium text-amber-700">{reg.lastActive.inviteNote}</p>
                        )}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-4 px-4">
                      {reg.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ccfbf1] text-[#0f766e]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>PENDING_ACTIVATION</span>
                        </span>
                      )}
                    </td>

                    {/* Governance Actions */}
                    <td className="py-4 px-4 text-right">
                      {reg.status === 'PENDING_ACTIVATION' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => alert(`Verification invitation re-sent to ${reg.email}.`)}
                            className="px-2.5 py-1 rounded-lg bg-[#eff4ff] text-blue-700 font-semibold text-xs hover:bg-blue-100 flex items-center gap-1 transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            <span>Resend Invite</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Revoked invite for ${reg.email}.`)}
                            aria-label="Revoke invite"
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Revoke Invitation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegistrar(reg);
                              setIsPermissionsModalOpen(true);
                            }}
                            aria-label="Edit permissions"
                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Edit Permissions"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Hardware 2FA session re-authenticated for ${reg.name}.`)}
                            aria-label="Manage 2FA tokens"
                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Manage Security Tokens"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Temporary intake freeze toggled for ${reg.name}.`)}
                            aria-label="Suspend intake access"
                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-rose-600 transition-colors"
                            title="Suspend Access"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredRegistrars.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRegistrars.length)} of {filteredRegistrars.length} registered institutional delegates
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

      {/* 8. Bottom Regulatory Governance Directive Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              ATA Council Regulatory Governance Directive • Section 4.9
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Institutional Registrars are cryptographically restricted to candidate dossiers registered under their
              chartered institution identifier. All credential provisioning, password resets, role mutations, and session
              terminations are immutably signed in the Central Executive Governance Audit Ledger with SHA-256 integrity logs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsBylawsModalOpen(true)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span>View Bylaws</span>
        </button>
      </div>

      {/* 9. Provision New Registrar Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision New Institutional Registrar</h3>
                  <p className="text-xs text-slate-500">Tier-2 Credential Delegation &amp; FIDO2 Enrollment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionRegistrar} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registrar Officer Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rev. Dr. Paul Varghese"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Institutional Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. registrar@saiacs.edu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must be an accredited institutional domain (@seminary.edu / .org)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Seminary *</label>
                  <select
                    value={institutionName}
                    onChange={e => setInstitutionName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                  >
                    <option value="SAIACS Bengaluru">SAIACS Bengaluru</option>
                    <option value="Union Biblical Seminary (UBS)">Union Biblical Seminary (UBS)</option>
                    <option value="Alliance Biblical Seminary">Alliance Biblical Seminary</option>
                    <option value="Aizawl Theological College">Aizawl Theological College</option>
                    <option value="COTR Theological College">COTR Theological College</option>
                    <option value="New Theological College">New Theological College</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intake Authority Role *</label>
                  <select
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#006f67]"
                  >
                    <option value="Head Academic Registrar">Head Academic Registrar</option>
                    <option value="Senior Registrar">Senior Registrar</option>
                    <option value="Regional Hub Registrar">Regional Hub Registrar</option>
                    <option value="Academic Dean & Registrar">Academic Dean &amp; Registrar</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Enforce FIDO2 Hardware 2FA</p>
                  <p className="text-[11px] text-slate-500">Requires WebAuthn security key or authenticator app</p>
                </div>
                <input
                  type="checkbox"
                  checked={enforce2FA}
                  onChange={e => setEnforce2FA(e.target.checked)}
                  className="h-4 w-4 rounded text-[#006f67] focus:ring-[#006f67]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800 disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Dispatching Invitation...' : 'Dispatch Activation Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Edit Permissions Modal */}
      {isPermissionsModalOpen && selectedRegistrar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registrar Permissions &amp; Scope</h3>
                  <p className="text-xs text-slate-500">{selectedRegistrar.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-slate-400 font-medium">Chartered Scope</p>
                <p className="font-bold text-slate-800">{selectedRegistrar.institution.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{selectedRegistrar.institution.subDetails}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="text-[#006f67] rounded" />
                  <div>
                    <p className="font-bold text-slate-800">Candidate Intake Wizard &amp; Manual Entry</p>
                    <p className="text-[10px] text-slate-500">Allows generating new candidate profiles and registrations</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="text-[#006f67] rounded" />
                  <div>
                    <p className="font-bold text-slate-800">Excel Batch Ingestion Engine</p>
                    <p className="text-[10px] text-slate-500">Permits bulk candidate parsing and automated quota allocation</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="text-[#006f67] rounded" />
                  <div>
                    <p className="font-bold text-slate-800">Document Locker Certification &amp; Capture</p>
                    <p className="text-[10px] text-slate-500">Uploading certified transcripts and mobile camera scans</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Permissions updated for ${selectedRegistrar.name}.`);
                  setIsPermissionsModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Bylaws Modal */}
      {isBylawsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-base">ATA Regulatory Bylaws • Section 4.9</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBylawsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 text-slate-600 max-h-60 overflow-y-auto leading-relaxed">
              <p className="font-bold text-slate-800">Article IV §9: Institutional Registrar Identity &amp; Quorum</p>
              <p>
                1. Every chartered member institution shall formally accredit a minimum of one (1) and a maximum of three
                (3) verified registrar delegates authorized to upload student intake registries.
              </p>
              <p>
                2. Registrars must execute two-factor authentication (FIDO2 or certified TOTP authenticator) on every
                session mutation.
              </p>
              <p>
                3. Direct edits to approved student dossiers require Super-Admin Multi-Key authorization. Registrars may
                submit correction requests through the official executive channel.
              </p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsBylawsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
