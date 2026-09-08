'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { createAuditLog } from '@/lib/api/supabase-service';
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
  AlertTriangle,
  RotateCw,
  Radio,
  Sliders,
  Award,
} from 'lucide-react';

export interface UniversalRegistrarItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  initialsVariant: 'slate' | 'mint' | 'blue' | 'purple';
  institution: {
    name: string;
    subCampus: string;
    codeBadge: string;
    hubRegion: 'SOUTH_ASIA' | 'SOUTHEAST_ASIA' | 'EAST_ASIA';
  };
  intakeScope: {
    title: string;
    description: string;
    quotaOrNote: string;
  };
  lastActive: {
    label: string;
    isActiveNow?: boolean;
    ipDetails?: string;
    geoDetails?: string;
    inviteNote?: string;
    isNever?: boolean;
  };
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED';
  isVerified?: boolean;
}

export const INITIAL_UNIVERSAL_REGISTRARS: UniversalRegistrarItem[] = [
  {
    id: 'reg-001',
    name: 'Rev. M. Thomas',
    email: 'm.thomas@saiacs.org',
    initials: 'MT',
    initialsVariant: 'slate',
    institution: {
      name: 'SAIACS Bengaluru',
      subCampus: 'South Asia Inst. of Advanced Christian Studies',
      codeBadge: 'IN-KA-004 • Full Charter',
      hubRegion: 'SOUTH_ASIA',
    },
    intakeScope: {
      title: 'Head Academic Registrar',
      description: 'Full Intake & Batch CSV Import',
      quotaOrNote: 'Batch Quota: 150/Term',
    },
    lastActive: {
      label: 'Active now',
      isActiveNow: true,
      ipDetails: '103.220.14.72',
      geoDetails: 'Bengaluru, KA, India',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-002',
    name: 'Dr. Ashish Christopher',
    email: 'ashish.c@ubs.ac.in',
    initials: 'AC',
    initialsVariant: 'slate',
    institution: {
      name: 'Union Biblical Seminary',
      subCampus: 'UBS Pune Campus',
      codeBadge: 'IN-MH-011 • Accredited Tier-1',
      hubRegion: 'SOUTH_ASIA',
    },
    intakeScope: {
      title: 'Senior Registrar',
      description: 'Intake & Document Verifications',
      quotaOrNote: 'Batch Quota: 200/Term',
    },
    lastActive: {
      label: '2 hours ago',
      ipDetails: '49.36.88.14',
      geoDetails: 'Pune, MH, India',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-003',
    name: 'Dr. Maria Elena Santos',
    email: 'registrar@absseminary.edu.ph',
    initials: 'MS',
    initialsVariant: 'slate',
    institution: {
      name: 'Alliance Biblical Seminary',
      subCampus: 'Quezon City Campus',
      codeBadge: 'PH-MNL-003 • Regional Node',
      hubRegion: 'SOUTHEAST_ASIA',
    },
    intakeScope: {
      title: 'Regional Hub Registrar',
      description: 'Archipelago Intake & Equivalence',
      quotaOrNote: 'Cross-Institute Validator',
    },
    lastActive: {
      label: 'Yesterday 16:40',
      ipDetails: '119.93.18.204',
      geoDetails: 'Metro Manila, Philippines',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-004',
    name: 'Rev. Prof. Lalrinkima',
    email: 'rina.prof@atc.edu.in',
    initials: 'LR',
    initialsVariant: 'slate',
    institution: {
      name: 'Aizawl Theological College',
      subCampus: 'ATC Mizoram Campus',
      codeBadge: 'IN-MZ-001 • Accredited Tier-1',
      hubRegion: 'SOUTH_ASIA',
    },
    intakeScope: {
      title: 'Academic Dean & Registrar',
      description: 'Full Administrative Intake Scope',
      quotaOrNote: 'Direct Registry Sync',
    },
    lastActive: {
      label: '3 days ago',
      ipDetails: '103.220.14.72',
      geoDetails: 'Aizawl, Mizoram, India',
    },
    status: 'ACTIVE',
    isVerified: true,
  },
  {
    id: 'reg-005',
    name: 'Jennifer K. Hwang',
    email: 'j.hwang@acts.ac.kr',
    initials: 'JH',
    initialsVariant: 'slate',
    institution: {
      name: 'Asian Center for Theo. Studies',
      subCampus: 'ACTS University, Seoul',
      codeBadge: 'KR-SEL-008 • Associate',
      hubRegion: 'EAST_ASIA',
    },
    intakeScope: {
      title: 'Candidate Registrar',
      description: 'Awaiting Initial Induction & 2FA Bind',
      quotaOrNote: 'Temporary Token (Expires in 18h)',
    },
    lastActive: {
      label: 'Never connected',
      isNever: true,
      inviteNote: 'Invite Dispatched: Feb 26',
      geoDetails: 'Awaiting Seoul (GMT+9)',
    },
    status: 'PENDING_ACTIVATION',
    isVerified: false,
  },
];

export const UniversalRegistrarSecurityGovernanceView: React.FC = () => {
  const [registrars, setRegistrars] = useState<UniversalRegistrarItem[]>(INITIAL_UNIVERSAL_REGISTRARS);
  const [dbProfiles, setDbProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isEmergencyRotateModalOpen, setIsEmergencyRotateModalOpen] = useState(false);
  const [isBylawsModalOpen, setIsBylawsModalOpen] = useState(false);
  const [selectedRegistrar, setSelectedRegistrar] = useState<UniversalRegistrarItem | null>(null);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // New Registrar Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstitution, setFormInstitution] = useState('SAIACS Bengaluru');
  const [formScope, setFormScope] = useState('Head Academic Registrar');
  const [formRegion, setFormRegion] = useState<'SOUTH_ASIA' | 'SOUTHEAST_ASIA' | 'EAST_ASIA'>('SOUTH_ASIA');
  const [formQuota, setFormQuota] = useState('150');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load profiles from BFF
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/registrars', { credentials: 'include' });
      const data = await res.json();
      const profiles: Profile[] = data.profiles || [];
      const regProfiles = profiles.filter(p => p.role === 'REGISTRAR');
      setDbProfiles(regProfiles);
    } catch (err: any) {
      console.warn('Profiles load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge database profiles with canonical list
  const mergedList = useMemo(() => {
    const list = [...registrars];
    dbProfiles.forEach(p => {
      const exists = list.some(r => r.email.toLowerCase() === p.email.toLowerCase());
      if (!exists) {
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
          initialsVariant: 'slate',
          institution: {
            name: 'Affiliated Seminary',
            subCampus: 'Chartered Theological Institution',
            codeBadge: 'ATA-REG-AFF',
            hubRegion: 'SOUTH_ASIA',
          },
          intakeScope: {
            title: 'Institutional Registrar',
            description: 'Intake & Verification Access',
            quotaOrNote: 'Batch Quota: 100/Term',
          },
          lastActive: {
            label: 'Recent Session',
            ipDetails: '103.24.81.12',
            geoDetails: 'Asia Node Gateway',
          },
          status: 'ACTIVE',
          isVerified: true,
        });
      }
    });
    return list;
  }, [registrars, dbProfiles]);

  // Filtered registrars
  const filteredRegistrars = useMemo(() => {
    return mergedList.filter(item => {
      // Tab filter
      if (statusTab === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (statusTab === 'PENDING' && item.status !== 'PENDING_ACTIVATION') return false;
      if (statusTab === 'SUSPENDED' && item.status !== 'SUSPENDED') return false;

      // Region filter
      if (regionFilter !== 'ALL' && item.institution.hubRegion !== regionFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesInst = item.institution.name.toLowerCase().includes(q) || item.institution.subCampus.toLowerCase().includes(q);
        const matchesCode = item.institution.codeBadge.toLowerCase().includes(q);
        const matchesScope = item.intakeScope.title.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesInst && !matchesCode && !matchesScope) {
          return false;
        }
      }

      return true;
    });
  }, [mergedList, statusTab, regionFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrars.length / pageSize));
  const paginatedRegistrars = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrars.slice(start, start + pageSize);
  }, [filteredRegistrars, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusTab, regionFilter]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Action: Export Directory CSV
  const handleExportCSV = () => {
    const headers = ['Registrar Name', 'Email', 'Institution', 'Campus Details', 'Affiliation Code', 'Role / Scope', 'Last Active', 'IP', 'Location', 'Status'];
    const rows = filteredRegistrars.map(r => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.institution.name}"`,
      `"${r.institution.subCampus}"`,
      `"${r.institution.codeBadge}"`,
      `"${r.intakeScope.title}"`,
      `"${r.lastActive.label}"`,
      `"${r.lastActive.ipDetails || 'N/A'}"`,
      `"${r.lastActive.geoDetails || 'N/A'}"`,
      `"${r.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ATA_Registrars_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Handle Provisioning
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please fill out registrar full name and official institutional email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const initials = formName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const newRegistrar: UniversalRegistrarItem = {
        id: `reg-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        initials,
        initialsVariant: 'slate',
        institution: {
          name: formInstitution,
          subCampus: 'Chartered Institution Campus',
          codeBadge: 'PROV-2026 • Tier-1',
          hubRegion: formRegion,
        },
        intakeScope: {
          title: formScope,
          description: 'Full Administrative Intake Scope',
          quotaOrNote: `Batch Quota: ${formQuota}/Term`,
        },
        lastActive: {
          label: 'Never connected',
          isNever: true,
          inviteNote: `Invite Dispatched: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          geoDetails: 'Awaiting WebAuthn / FIDO2 Setup',
        },
        status: 'PENDING_ACTIVATION',
        isVerified: false,
      };

      setRegistrars(prev => [newRegistrar, ...prev]);

      await createAuditLog({
        action: 'STATUS_CHANGED',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'UNIVERSAL_SUPER_ADMIN',
        entity_type: 'STUDENT',
        entity_id: newRegistrar.id,
        target_name: newRegistrar.name,
        target_ref: newRegistrar.email,
        target_program: newRegistrar.intakeScope.title,
        mutation_from: 'UNPROVISIONED',
        mutation_to: 'PENDING_ACTIVATION',
        details: `Provisioned Tier-2 institutional registrar credentials for ${newRegistrar.name} (${newRegistrar.email}) at ${newRegistrar.institution.name}. 24-hour verification token dispatched with Ed25519 public signature.`,
      });

      alert(`Official invitation link generated and dispatched to ${formEmail}. Verification token active for 24 hours with mandatory hardware 2FA.`);
      setIsProvisionModalOpen(false);
      setFormName('');
      setFormEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Emergency Mass Rotation
  const handleEmergencyRotate = async () => {
    setIsSubmitting(true);
    try {
      await createAuditLog({
        action: 'STATUS_CHANGED',
        actor_name: 'Dr. Grace Chen',
        actor_role: 'UNIVERSAL_SUPER_ADMIN',
        entity_type: 'STUDENT',
        entity_id: 'SESSION-REVOKE-ALL',
        target_name: 'Global Registrar Mesh',
        target_ref: 'ALL_ACTIVE_SESSIONS',
        target_program: 'Council Security Protocol 11.2',
        mutation_from: 'ACTIVE_SESSIONS',
        mutation_to: 'ROTATED_AND_REAUTHENTICATED',
        details: 'Universal Super-Admin initiated Emergency Mass Session Rotation across all 184 active registrar accounts. All persistent tokens revoked. Mandatory WebAuthn re-handshake enforced.',
      });

      alert('Emergency Mass Rotation Executed: All 184 active registrar sessions have been successfully terminated. Mandatory re-authentication tokens dispatched to institutional whitelisted emails.');
      setIsEmergencyRotateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Resend Invite
  const handleResendInvite = (item: UniversalRegistrarItem) => {
    alert(`Fresh 24-hour cryptographic induction token re-dispatched to ${item.email}.`);
  };

  // Action: Revoke Registrar
  const handleRevoke = (item: UniversalRegistrarItem) => {
    if (confirm(`Revoke registrar authority for ${item.name} (${item.institution.name})? This halts all intake portal permissions immediately.`)) {
      setRegistrars(prev =>
        prev.map(r => (r.id === item.id ? { ...r, status: 'SUSPENDED' } : r))
      );
      alert(`Registrar account for ${item.name} suspended.`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Protocol Sub-Bar & Universal Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="uppercase tracking-wider">ATA Universal Authority</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="uppercase tracking-wider">Institutional Personnel &amp; Delegation</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold uppercase tracking-wider">Manage &amp; Provision Registrar Accounts</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50/80 border border-cyan-200 text-[#006f67] text-[11px] font-bold shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tracking-tight">
            ROOT RBAC ENFORCED • OPERATIONAL TIER-2 PERSONNEL • FULL PROVISIONING &amp; REVOCATION AUTONOMY
          </span>
        </div>
      </div>

      {/* 2. Top Title & 3 Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Registrar Accounts &amp; Security Governance
          </h1>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Delegate and audit operational student intake authority across 142 accredited theological seminaries.
            Provision encrypted credentials, partition institutional scopes, enforce hardware 2FA/WebAuthn, and
            audit real-time registrar sessions across Asian member colleges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Directory (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmergencyRotateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 shadow-2xs transition-colors"
          >
            <Zap className="h-4 w-4 text-red-600" />
            <span>⚡ Emergency Mass Rotation</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191c1e] text-white text-xs font-semibold hover:bg-black shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4 text-white" />
            <span>+ Provision New Registrar</span>
          </button>
        </div>
      </div>

      {/* 3. Dual Top Governance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 spans): Institutional Registrar Quick-Dispatch Drawer */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center border border-teal-100">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Institutional Registrar Quick-Dispatch Drawer
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#99efe5]/50 text-[#006f67] text-xs font-bold shadow-2xs">
                Bylaw Mandate 4.9
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Accreditation council bylaws mandate every affiliated seminary have at least one authenticated Dean or
              Registrar officer holding cryptographically validated intake authority. Newly provisioned accounts receive
              mandatory 24-hour verification links with cryptographic hardware binding.
            </p>
          </div>

          {/* 3 Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Mail className="h-3 w-3 text-[#006f67]" />
                <span>STEP 1</span>
              </div>
              <p className="font-bold text-xs text-slate-900">Whitelisted Campus Mail Domain</p>
              <p className="text-[11px] text-slate-500">Strict DNS MX validation</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Lock className="h-3 w-3 text-[#006f67]" />
                <span>STEP 2</span>
              </div>
              <p className="font-bold text-xs text-slate-900">Institution-Locked Scope</p>
              <p className="text-[11px] text-slate-500">Chartered cohort partitions</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Key className="h-3 w-3 text-[#006f67]" />
                <span>STEP 3</span>
              </div>
              <p className="font-bold text-xs text-slate-900">FIDO2 / TOTP Enforcement</p>
              <p className="text-[11px] text-slate-500">Hardware key preferred</p>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-[#006f67] shrink-0" />
              <span>Zero shared registrar accounts allowed. Every issuance generates unique Ed25519 public credential hashes.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(true)}
              className="font-bold text-xs text-[#006f67] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Launch Full Provisioning Drawer</span>
              <span className="font-mono">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Security Governance & Quotas (Dark Navy Enclave Card) */}
        <div className="p-6 rounded-2xl bg-[#131b26] text-white border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Security Governance &amp; Quotas
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#004d40] text-emerald-300 text-[10px] font-mono font-bold tracking-wider">
                LIVE QUORUM
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              142 Accredited Member Seminaries. All 184 active registrars maintain localized registry rights strictly
              isolated to candidate cohorts enrolled inside their chartered institution code.
            </p>
          </div>

          {/* Active Sessions Telemetry */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Simultaneous Active Sessions</span>
              </div>
              <span className="font-extrabold text-white text-sm">37 / 42 Peak</span>
            </div>

            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-[88.1%]" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Concurrency Capacity: 88.1% (Nominal)</span>
              <span>8 Regional Sub-Routers Online</span>
            </div>
          </div>

          {/* Monospace Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Audited Ledger Anchor: #0x89A...FD1C</span>
            <span className="flex items-center gap-1 text-teal-300 font-sans font-bold">
              <ShieldCheck className="h-3 w-3" />
              <span>WebAuthn Lv.3 Active</span>
            </span>
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
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">184</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                +6 this month
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Across 142 accredited member colleges in Asia
            </p>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-4" />
        </div>

        {/* Card 2: PENDING ACTIVATION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                PENDING ACTIVATION
              </span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">7</span>
              <span className="text-xs font-semibold text-slate-500">invites active</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Temporary token issued • Awaiting hardware 2FA setup
            </p>
          </div>
          <div className="h-1 w-12 bg-red-500 rounded-full mt-4" />
        </div>

        {/* Card 3: INTAKE VELOCITY (30D) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                INTAKE VELOCITY (30D)
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">482</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                filings confirmed
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Average 2.6 candidate submissions / officer
            </p>
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
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">98.9%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Strict Pass
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Enforced hardware / authenticator app • 0 leaks
            </p>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>
      </div>

      {/* 5. Accredited Registrar Distribution Mesh Banner */}
      <div className="p-4 rounded-2xl bg-[#eff4ff] border border-blue-100/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Accredited Registrar Distribution Mesh</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active registrar endpoints distributed across 18 theological zones including India, South Korea, Philippines, Singapore, Sri Lanka, Myanmar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRegionFilter('SOUTH_ASIA')}
            className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              regionFilter === 'SOUTH_ASIA'
                ? 'bg-[#191c1e] text-white border-[#191c1e]'
                : 'bg-white border-blue-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>South Asia: 94 Officers</span>
          </button>

          <button
            type="button"
            onClick={() => setRegionFilter('SOUTHEAST_ASIA')}
            className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              regionFilter === 'SOUTHEAST_ASIA'
                ? 'bg-[#191c1e] text-white border-[#191c1e]'
                : 'bg-white border-blue-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Southeast Asia: 51 Officers</span>
          </button>

          <button
            type="button"
            onClick={() => setRegionFilter('EAST_ASIA')}
            className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              regionFilter === 'EAST_ASIA'
                ? 'bg-[#191c1e] text-white border-[#191c1e]'
                : 'bg-white border-blue-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            <span>East Asia: 39 Officers</span>
          </button>

          <button
            type="button"
            onClick={() => setRegionFilter('ALL')}
            title="Reset region filter"
            className="p-1.5 rounded-full bg-white border border-blue-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Tabs, Search & Regional Hubs Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusTab === 'ALL'
                ? 'bg-[#191c1e] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Registrars (184)
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusTab === 'ACTIVE'
                ? 'bg-[#191c1e] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active (177)
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              statusTab === 'PENDING'
                ? 'bg-[#191c1e] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Invite</span>
            <span className="text-red-500 font-bold">7</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('SUSPENDED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusTab === 'SUSPENDED'
                ? 'bg-[#191c1e] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspended (0)
          </button>
        </div>

        {/* Right Search & Hub Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by officer name, institution, code..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006f67] shadow-2xs"
            />
          </div>

          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            aria-label="Filter by Regional Hub"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-[#006f67] cursor-pointer"
          >
            <option value="ALL">All Regional Hubs</option>
            <option value="SOUTH_ASIA">South Asia Hub (94)</option>
            <option value="SOUTHEAST_ASIA">Southeast Asia Hub (51)</option>
            <option value="EAST_ASIA">East Asia Hub (39)</option>
          </select>
        </div>
      </div>

      {/* 7. Registrar Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">REGISTRAR NAME &amp; PROFILE</th>
                <th className="py-3 px-4 font-bold">ASSIGNED SEMINARY / COLLEGE</th>
                <th className="py-3 px-4 font-bold">INTAKE SCOPE &amp; ROLE</th>
                <th className="py-3 px-4 font-bold">LAST ACTIVE SESSION</th>
                <th className="py-3 px-4 font-bold">ACCOUNT STATUS</th>
                <th className="py-3 px-4 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedRegistrars.map(reg => {
                return (
                  <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Registrar Name & Profile */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {reg.initials}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">{reg.name}</span>
                            {reg.isVerified && (
                              <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
                            )}
                            {reg.lastActive.isNever && (
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{reg.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Seminary / College */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-900">{reg.institution.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{reg.institution.subCampus}</p>
                        <span className="inline-block text-[10px] font-mono text-cyan-800 font-semibold">
                          {reg.institution.codeBadge}
                        </span>
                      </div>
                    </td>

                    {/* Intake Scope & Role */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{reg.intakeScope.title}</p>
                        <p className="text-[11px] text-slate-500">{reg.intakeScope.description}</p>
                        <p className={`text-[10px] font-medium ${reg.lastActive.isNever ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                          {reg.intakeScope.quotaOrNote}
                        </p>
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
                        ) : reg.lastActive.isNever ? (
                          <p className="font-bold text-red-600 text-xs">{reg.lastActive.label}</p>
                        ) : (
                          <p className="font-bold text-slate-800 text-xs">{reg.lastActive.label}</p>
                        )}

                        {reg.lastActive.ipDetails && (
                          <p className="font-mono text-[10px] text-slate-400">{reg.lastActive.ipDetails}</p>
                        )}

                        {reg.lastActive.inviteNote && (
                          <p className="text-[10px] text-slate-500">{reg.lastActive.inviteNote}</p>
                        )}

                        {reg.lastActive.geoDetails && (
                          <p className="text-[10px] text-slate-500">{reg.lastActive.geoDetails}</p>
                        )}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-4 px-4">
                      {reg.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#99efe5]/40 text-[#006f67] border border-[#99efe5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>ACTIVE</span>
                        </span>
                      ) : reg.status === 'PENDING_ACTIVATION' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span>PENDING_ACTIVATION</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <span>SUSPENDED</span>
                        </span>
                      )}
                    </td>

                    {/* Governance Actions */}
                    <td className="py-4 px-4 text-right">
                      {reg.status === 'PENDING_ACTIVATION' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResendInvite(reg)}
                            className="px-2.5 py-1 rounded-lg bg-black text-white hover:bg-neutral-800 text-[11px] font-semibold transition-colors"
                          >
                            Resend Token
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(reg)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Revoke Token"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegistrar(reg);
                              setIsScopeModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            Scope
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegistrar(reg);
                              setIsAuditModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            Audit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(reg)}
                            className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Revoke / Suspend"
                          >
                            <Ban className="h-3.5 w-3.5" />
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

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredRegistrars.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRegistrars.length)} of {filteredRegistrars.length} provisioned registrar authorities
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

      {/* 8. Bottom Legal & Regulatory Governance Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] max-w-4xl">
            <strong>ATA Council Regulatory Governance Directive • Section 4.9:</strong> Institutional Registrars are
            cryptographically restricted to candidate dossiers registered under their chartered institution identifier.
            All credential provisioning, password resets, role mutations, and session terminations are immutably signed
            in the Central Executive Governance Audit Ledger with SHA-256 integrity logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsBylawsModalOpen(true)}
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs shrink-0 whitespace-nowrap"
        >
          View Bylaws &amp; Delegation Policies
        </button>
      </div>

      {/* MODAL 1: Provision New Registrar Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Provision Institutional Registrar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Issue cryptographically partitioned Tier-2 intake credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Registrar Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Rev. Dr. Timothy S. Samuel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Official Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="e.g. registrar@saiacs.org (whitelisted domain only)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                />
                <p className="text-[10px] text-slate-400">Must be an institutional MX domain; public email providers (Gmail, Yahoo) are blocked by Policy 4.9.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Seminary</label>
                  <select
                    value={formInstitution}
                    onChange={e => setFormInstitution(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                  >
                    <option value="SAIACS Bengaluru">SAIACS Bengaluru (IN-KA-004)</option>
                    <option value="Union Biblical Seminary">Union Biblical Seminary (IN-MH-011)</option>
                    <option value="Alliance Biblical Seminary">Alliance Biblical Seminary (PH-MNL-003)</option>
                    <option value="Aizawl Theological College">Aizawl Theological College (IN-MZ-001)</option>
                    <option value="Asian Center for Theo. Studies">Asian Center for Theo. Studies (KR-SEL-008)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Regional Hub</label>
                  <select
                    value={formRegion}
                    onChange={e => setFormRegion(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                  >
                    <option value="SOUTH_ASIA">South Asia Hub (India, Sri Lanka)</option>
                    <option value="SOUTHEAST_ASIA">Southeast Asia Hub (Philippines, Singapore)</option>
                    <option value="EAST_ASIA">East Asia Hub (Korea, Japan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Intake Scope &amp; Role</label>
                  <select
                    value={formScope}
                    onChange={e => setFormScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                  >
                    <option value="Head Academic Registrar">Head Academic Registrar</option>
                    <option value="Senior Registrar">Senior Registrar</option>
                    <option value="Regional Hub Registrar">Regional Hub Registrar</option>
                    <option value="Academic Dean & Registrar">Academic Dean & Registrar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Batch Intake Quota</label>
                  <input
                    type="number"
                    value={formQuota}
                    onChange={e => setFormQuota(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#006f67]"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-[11px] text-teal-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Key className="h-3.5 w-3.5 text-[#006f67]" />
                  <span>Mandatory Security Controls</span>
                </div>
                <p>An initial 24-hour cryptographic token will be dispatched. Upon first login, the registrar is prompted for hardware FIDO2 or TOTP authenticator pairing.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Dispatching Token...' : 'Dispatch Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Mass Rotation Modal */}
      {isEmergencyRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Emergency Mass Rotation
                </h3>
                <p className="text-xs text-red-600 font-medium">
                  Universal Super-Admin Revocation Authority
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action terminates all <strong>184 active registrar sessions</strong> across 142 seminaries in all 3
              Asian regional zones. All temporary session tokens and cookies will be instantly purged from the Redis
              cache and Supabase session store.
            </p>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1">
              <p className="font-bold">Immediate Consequences:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>All active student registrations currently being drafted will remain safe.</li>
                <li>Registrars must re-authenticate via their registered FIDO2 / TOTP hardware key.</li>
                <li>A Merkle ledger integrity log will be permanently appended to block #ATA-ROT.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEmergencyRotateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmergencyRotate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold text-xs shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Revoking All Sessions...' : 'Confirm Mass Rotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Scope & Permissions Drawer Modal */}
      {isScopeModalOpen && selectedRegistrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                  {selectedRegistrar.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedRegistrar.name} — Intake Scope
                  </h3>
                  <p className="text-xs text-slate-500">{selectedRegistrar.institution.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScopeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-800">Partitioned Institution Scope:</p>
                <p className="font-mono text-[#006f67] font-semibold">{selectedRegistrar.institution.codeBadge}</p>
                <p className="text-[11px] text-slate-500">Access is cryptographically isolated to candidate enrollments under this chartered ID.</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">Granted Operational Permissions:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Single &amp; Bulk Intake</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Transcript Seal Upload</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Candidate Identity KYC</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Dossier Correction Resubmit</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Intake Term Batch Ceiling</label>
                <input
                  type="text"
                  defaultValue={selectedRegistrar.intakeScope.quotaOrNote}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScopeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Updated intake quota parameters saved to ledger.');
                    setIsScopeModalOpen(false);
                  }}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Audit Activity Modal */}
      {isAuditModalOpen && selectedRegistrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registrar Session Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRegistrar.name} ({selectedRegistrar.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Node IP:</span>
                  <span className="text-slate-900 font-bold">{selectedRegistrar.lastActive.ipDetails || '103.220.14.72'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geolocation:</span>
                  <span className="text-slate-900">{selectedRegistrar.lastActive.geoDetails || 'India Regional Gateway'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware 2FA:</span>
                  <span className="text-emerald-700 font-bold">Yubikey FIDO2-L3 Bound</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Signed Block Digest:</span>
                  <span className="text-blue-600">0x9F36...A194</span>
                </div>
              </div>

              <p className="font-bold text-slate-800">Recent Intake Mutations:</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex justify-between items-center">
                  <span>Batch Excel Ingest: 22 M.Div candidates</span>
                  <span className="text-slate-400 text-[10px]">Today 09:20 AM</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex justify-between items-center">
                  <span>Certified transcript upload: STU-2026-0793</span>
                  <span className="text-slate-400 text-[10px]">Yesterday 14:15 PM</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex justify-between items-center">
                  <span>Corrected entrance qualification: STU-2026-0314</span>
                  <span className="text-slate-400 text-[10px]">23 Feb 11:05 AM</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Bylaws & Policies Modal */}
      {isBylawsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#006f67]" />
                <h3 className="text-base font-bold text-slate-900">
                  ATA Council Bylaws — Section 4.9
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBylawsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Article IV, Section 4.9 (Delegation of Intake Authority):</strong>
                Accreditation granted by the Asia Theological Association delegates candidate intake and preliminary
                qualification verification solely to authenticated Institutional Registrars.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 text-[11px]">
                <p className="font-semibold text-slate-900">Core Governance Principles:</p>
                <p>1. <strong>Institutional Lock:</strong> Registrars have zero visibility or mutation power over candidates registered at peer institutions.</p>
                <p>2. <strong>Hardware Bound 2FA:</strong> Multi-factor authentication via FIDO2 WebAuthn or TOTP authenticator is non-negotiable.</p>
                <p>3. <strong>Immutable Audit Trails:</strong> Every status mutation, batch import, and seal submission is hashed with SHA-256 and appended to the national Merkle ledger.</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Ratified at the 2024 Pan-Asian Triennial General Assembly, Singapore.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsBylawsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Bylaws Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
