'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Registration } from '@/lib/types';
import {
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  Database,
  Scan,
  Download,
  Search,
  SlidersHorizontal,
  RefreshCw,
  GraduationCap,
  Building2,
  Award,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Archive,
  Key,
  Shield,
  FileCode,
  Users,
  CheckCircle,
  FileCheck,
  Cloud,
} from 'lucide-react';

export interface AdminVaultDocument {
  id: string;
  title: string;
  fileSpecs: {
    size: string;
    badge?: {
      text: string;
      variant: 'mint' | 'rose' | 'slate';
    };
    note?: string;
  };
  candidate: {
    name: string;
    regNumber: string;
    institution: string;
  };
  category: {
    name: 'Academic Transcript' | 'Church Endorsement' | 'National ID' | 'Degree Scroll';
    variant: 'purple' | 'mint' | 'blue' | 'navy';
  };
  ingestion: {
    actor: string;
    timestamp: string;
  };
  sha256: string;
  isFlagged?: boolean;
  flagReason?: string;
}

interface CentralDocumentVaultViewProps {
  registrations?: Registration[];
  onSelectRegistration?: (reg: Registration) => void;
  onUploadDocument?: (file: File) => Promise<void>;
}

export const INITIAL_ADMIN_VAULT_DOCUMENTS: AdminVaultDocument[] = [
  {
    id: 'doc-adm-01',
    title: 'BTh_Original_Consolidated_Transcript.pdf',
    fileSpecs: {
      size: '3.4 MB',
      badge: {
        text: 'OCR Processed',
        variant: 'mint',
      },
      note: 'PDF/A-2b',
    },
    candidate: {
      name: 'Rev. David Immanuel Sangma',
      regNumber: 'SAIACS/BA/2026/1',
      institution: 'SAIACS Bangalore',
    },
    category: {
      name: 'Academic Transcript',
      variant: 'purple',
    },
    ingestion: {
      actor: 'Rev. M. Thomas',
      timestamp: 'Registrar, SAIACS • Today 09:12 AM',
    },
    sha256: '7f9a8820c441b2190ef992a0149021a88b4012903e198b9f',
  },
  {
    id: 'doc-adm-02',
    title: 'Church_Commendation_CSI_Diocese.pdf',
    fileSpecs: {
      size: '1.1 MB',
      note: 'Bishopric Signature',
    },
    candidate: {
      name: 'Ananya Sengupta',
      regNumber: 'SAIACS/BA-CML/2026/1',
      institution: 'SAIACS Bangalore',
    },
    category: {
      name: 'Church Endorsement',
      variant: 'mint',
    },
    ingestion: {
      actor: 'Dr. Grace Chen (Admin)',
      timestamp: 'Reviewed Yesterday 04:15 PM',
    },
    sha256: '99bf0214a77e8104cde491039821bf8401923ba8712e0911',
  },
  {
    id: 'doc-adm-03',
    title: 'Aadhaar_National_ID_Scan_Masked.jpg',
    fileSpecs: {
      size: '2.8 MB',
      note: 'UIDAI Masked • Match 98.4%',
    },
    candidate: {
      name: 'Joshua R. Sailo',
      regNumber: 'ACPL/BA-CML/2026/1',
      institution: 'Aizawl ATC Mizoram',
    },
    category: {
      name: 'National ID',
      variant: 'blue',
    },
    ingestion: {
      actor: 'System KYC Ingestion Engine',
      timestamp: 'Verified 24 Feb 11:34 AM',
    },
    sha256: '3ca1980ff21a88190bc91840291e01298492019abf182903',
  },
  {
    id: 'doc-adm-04',
    title: 'MDiv_Provisional_Certificate_Serampore.pdf',
    fileSpecs: {
      size: '4.2 MB',
      badge: {
        text: 'Missing Watermark Seal',
        variant: 'rose',
      },
    },
    candidate: {
      name: 'Priya Sharma',
      regNumber: 'COTR-TS/BA-CML/2026/1',
      institution: 'COTR Theological College',
    },
    category: {
      name: 'Academic Transcript',
      variant: 'purple',
    },
    ingestion: {
      actor: 'Registrar Office, COTR',
      timestamp: 'Uploaded 23 Feb 02:45 PM',
    },
    sha256: 'd1983021e84019ba9012401f9a8820c441b2190ef992a014',
    isFlagged: true,
    flagReason: 'Missing Watermark Seal from Registrar of Senate of Serampore College. Seal check required.',
  },
  {
    id: 'doc-adm-05',
    title: 'MTh_Thesis_Defense_Approval.pdf',
    fileSpecs: {
      size: '890 KB',
      note: 'Deanery Signed',
    },
    candidate: {
      name: 'Deborah Lalthanzami',
      regNumber: 'SAIACS/BA-CML/2026/2',
      institution: 'AICS Mizoram',
    },
    category: {
      name: 'Degree Scroll',
      variant: 'navy',
    },
    ingestion: {
      actor: 'Dean Academic Affairs, AICS',
      timestamp: 'Submitted 22 Feb 06:10 PM',
    },
    sha256: '55e881029ba8820c441b2190ef992a0149021a88b4012903',
  },
];

export const CentralDocumentVaultView: React.FC<CentralDocumentVaultViewProps> = ({
  registrations = [],
  onSelectRegistration,
  onUploadDocument,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'FLAGGED'>('ALL');
  const [categoryTab, setCategoryTab] = useState<string>('ALL');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<AdminVaultDocument | null>(null);
  const [flaggedDocModal, setFlaggedDocModal] = useState<AdminVaultDocument | null>(null);

  // Merge database registrations if available
  const allDocuments = useMemo(() => {
    const list: AdminVaultDocument[] = [...INITIAL_ADMIN_VAULT_DOCUMENTS];

    // Append any extra dynamic registrations from Supabase
    registrations.forEach((r, idx) => {
      const match = list.some(d => d.candidate.regNumber === r.registration_number);
      if (!match && r.student) {
        list.push({
          id: `doc-dyn-${r.id}`,
          title: `${r.program?.code || 'ATA'}_Official_Dossier_Record.pdf`,
          fileSpecs: {
            size: '2.1 MB',
            badge: r.status === 'APPROVED' ? { text: 'OCR Processed', variant: 'mint' } : undefined,
            note: 'PDF/A-2b',
          },
          candidate: {
            name: `${r.student.first_name} ${r.student.last_name}`,
            regNumber: r.registration_number,
            institution: r.institution?.name || 'Accredited Seminary',
          },
          category: {
            name: 'Academic Transcript',
            variant: 'purple',
          },
          ingestion: {
            actor: 'Registrar Operations',
            timestamp: `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          },
          sha256: `sha256-${r.id.slice(0, 16)}...`,
          isFlagged: r.status === 'CORRECTION_REQUIRED',
          flagReason: r.notes || undefined,
        });
      }
    });

    return list;
  }, [registrations]);

  // Filtering
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter(doc => {
      // Category filter
      if (categoryTab === 'TRANSCRIPTS' && doc.category.name !== 'Academic Transcript') return false;
      if (categoryTab === 'COMMENDATIONS' && doc.category.name !== 'Church Endorsement') return false;
      if (categoryTab === 'IDS' && doc.category.name !== 'National ID') return false;
      if (categoryTab === 'SCROLLS' && doc.category.name !== 'Degree Scroll') return false;

      // Status filter
      if (statusFilter === 'FLAGGED' && !doc.isFlagged) return false;
      if (statusFilter === 'VERIFIED' && doc.isFlagged) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesName = doc.candidate.name.toLowerCase().includes(q);
        const matchesReg = doc.candidate.regNumber.toLowerCase().includes(q);
        const matchesInst = doc.candidate.institution.toLowerCase().includes(q);
        const matchesHash = doc.sha256.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesReg && !matchesInst && !matchesHash) {
          return false;
        }
      }

      return true;
    });
  }, [allDocuments, categoryTab, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryTab, statusFilter, searchQuery]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const toggleSelectDoc = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDocIds(next);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRefreshEnclave = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Protocol Sub-Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span>ATA Central Governance</span>
          <span className="text-slate-400 font-mono">&gt;</span>
          <span className="text-slate-800 font-bold">Document Locker &amp; Verification Vault</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-slate-600">
            HSM VAULT NODE ACTIVE: SG-ASIA-01 • Block #ATA-IND-94821
          </span>
        </div>
      </div>

      {/* 2. Top Tag, Header & Executive Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-[#006f67]" />
            <span>Asia-Wide Cryptographic Verification Vault • WORM Compliance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Central Document Locker &amp; Verification Vault
          </h1>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Cryptographically sealed repository of candidate academic transcripts, institutional church recommendations,
            government identification credentials, and degree scrolls across all 142 seminaries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setAuditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#99efe5] bg-white text-[#006f67] text-xs font-semibold hover:bg-teal-50/50 shadow-2xs transition-colors"
          >
            <Scan className="h-4 w-4 text-[#006f67]" />
            <span>Run Vault Hash Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs transition-colors"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Bulk Export Certified Vault (.zip)</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Secured Credentials */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL SECURED CREDENTIALS
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              1,842
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Across 482 active candidates
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: Cryptographic Clearance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CRYPTOGRAPHIC CLEARANCE
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">96.4%</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑+1.2%
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Serampore / Senate DB sync OK
            </div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>

        {/* Card 3: Audit / Re-inspection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                AUDIT / RE-INSPECTION
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">48</span>
              <span className="text-2xl font-extrabold text-slate-900">Files</span>
              <button
                type="button"
                onClick={() => setFlaggedDocModal(INITIAL_ADMIN_VAULT_DOCUMENTS[3])}
                className="text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition-colors"
              >
                Seal Check
              </button>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Requires physical registrar audit
            </div>
          </div>
          <div className="h-1 w-12 bg-rose-500 rounded-full mt-4" />
        </div>

        {/* Card 4: Vault Storage Utilized */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                VAULT STORAGE UTILIZED
              </span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">38.6 GB</span>
              <span className="text-[11px] font-medium text-slate-400">15.4% alloc</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              AWS S3 Asia-South (WORM locked)
            </div>
          </div>
          <div className="h-1 w-12 bg-slate-900 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Cryptographic Proof & SHA-256 Ledger Consensus Banner (Dark Card) */}
      <div className="bg-[#17202e] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-white">
                Cryptographic Proof &amp; SHA-256 Ledger Consensus
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                Live Consensus Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synchronized with <span className="text-slate-300 font-semibold">SG-ASIA-01 Node</span> • Current Master Root Block{' '}
              <span className="font-mono font-bold text-teal-300">#ATA-IND-94821</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-start md:self-auto">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              AUDIT SECURITY LOG
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Zero Tamper Incidents (Rolling 90d)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLedgerModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileCode className="h-3.5 w-3.5 text-teal-300" />
            <span>Verify Master Ledger</span>
          </button>
        </div>
      </div>

      {/* 5. Search, Filter & Tabs Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, UID, document name, or SHA-256 hash..."
              className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006f67] focus:ring-1 focus:ring-[#006f67] transition-all shadow-2xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                aria-label="Filter documents by verification status"
                className="appearance-none bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#006f67] shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Statuses (Verified, Pending Audit, Flagged)</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="FLAGGED">Flagged / Seal Check</option>
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCategoryTab('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryTab === 'ALL'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Documents (1,842)
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('TRANSCRIPTS')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryTab === 'TRANSCRIPTS'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Academic Transcripts (714)
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('COMMENDATIONS')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryTab === 'COMMENDATIONS'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Church Commendations (482)
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('IDS')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryTab === 'IDS'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Government Photo IDs (482)
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('SCROLLS')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryTab === 'SCROLLS'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Degree Scrolls &amp; Approvals (164)
          </button>
        </div>
      </div>

      {/* 6. Table Toolbar & Context Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedDocIds.size > 0 && selectedDocIds.size === filteredDocuments.length}
            onChange={handleSelectAll}
            aria-label="Select all documents currently in view"
            className="h-4 w-4 rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
          />
          <span className="font-bold tracking-wider uppercase text-[11px] text-slate-600">
            SELECT ALL IN-VIEW • Displaying {filteredDocuments.length} of 1,842 Verified Assets
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-500">
            ENCLAVE: S3-AP-SOUTH-1
          </span>
          <button
            type="button"
            onClick={handleRefreshEnclave}
            aria-label="Refresh Enclave status"
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#006f67]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 7. Central Document Vault Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="py-3 px-4 font-bold">DOCUMENT TITLE &amp; FILE SPECS</th>
                <th className="py-3 px-4 font-bold">CANDIDATE &amp; INSTITUTION</th>
                <th className="py-3 px-4 font-bold">CREDENTIAL CATEGORY</th>
                <th className="py-3 px-4 font-bold">INGESTION ACTOR &amp; TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedDocuments.map(doc => {
                const isSelected = selectedDocIds.has(doc.id);
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      doc.isFlagged ? 'bg-rose-50/20' : ''
                    } ${isSelected ? 'bg-teal-50/30' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDoc(doc.id)}
                        aria-label={`Select document ${doc.title}`}
                        className="h-4 w-4 rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                      />
                    </td>

                    {/* Document Title & File Specs */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                            doc.isFlagged
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {doc.isFlagged ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setInspectDoc(doc)}
                            className="font-bold text-slate-900 hover:text-[#006f67] hover:underline text-left block truncate"
                          >
                            {doc.title}
                          </button>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>{doc.fileSpecs.size}</span>
                            <span>•</span>
                            {doc.fileSpecs.badge && (
                              <>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    doc.fileSpecs.badge.variant === 'mint'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : doc.fileSpecs.badge.variant === 'rose'
                                      ? 'bg-rose-100 text-rose-700 cursor-pointer hover:bg-rose-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                  onClick={() => {
                                    if (doc.isFlagged) {
                                      setFlaggedDocModal(doc);
                                    }
                                  }}
                                >
                                  {doc.fileSpecs.badge.text}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            {doc.fileSpecs.note && (
                              <span
                                className={
                                  doc.fileSpecs.note.includes('Match 98.4%')
                                    ? 'text-emerald-600 font-semibold'
                                    : 'text-slate-500'
                                }
                              >
                                {doc.fileSpecs.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Candidate & Institution */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{doc.candidate.name}</p>
                        <p className="text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-[#006f67] hover:underline cursor-pointer">
                            {doc.candidate.regNumber}
                          </span>{' '}
                          • {doc.candidate.institution}
                        </p>
                      </div>
                    </td>

                    {/* Credential Category */}
                    <td className="py-3.5 px-4">
                      {doc.category.variant === 'purple' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f3e8ff] text-[#7e22ce]">
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>Academic Transcript</span>
                        </span>
                      )}

                      {doc.category.variant === 'mint' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ccfbf1] text-[#0f766e]">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Church Endorsement</span>
                        </span>
                      )}

                      {doc.category.variant === 'blue' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0369a1]">
                          <Shield className="h-3.5 w-3.5" />
                          <span>National ID</span>
                        </span>
                      )}

                      {doc.category.variant === 'navy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1e293b] text-white">
                          <Award className="h-3.5 w-3.5" />
                          <span>Degree Scroll</span>
                        </span>
                      )}
                    </td>

                    {/* Ingestion Actor & Timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{doc.ingestion.actor}</p>
                        <p className="text-[11px] text-slate-500">{doc.ingestion.timestamp}</p>
                      </div>
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
              Showing {filteredDocuments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} vault entries
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

      {/* 8. Bottom 3 Compliance & Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: WORM Retention Policy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>WORM Retention Policy</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Credentials are fixed to Write-Once-Read-Many storage in AWS Mumbai (ap-south-1). Immutability locked under
              50-year retention rule by ATA Executive Synod Decree.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Compliance: ISO/IEC 27001</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              SEAL: COMPLIANT
            </span>
          </div>
        </div>

        {/* Card 2: Senate Federation Sync */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Building2 className="h-4 w-4 text-slate-700" />
              <span>Senate Federation Sync</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cross-validated with Senate of Serampore College &amp; South Asian Theological Accreditation registries.
              Automated hash reconciliation runs daily at 02:00 UTC.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Last Inter-Sync: 4h 18m ago</span>
            <span className="font-semibold text-emerald-600">100% In Consensus</span>
          </div>
        </div>

        {/* Card 3: Dual Quorum Attestation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Users className="h-4 w-4 text-slate-700" />
              <span>Dual Quorum Attestation</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Discrepancy resolution and document de-archiving mandate cryptographic dual keys: Academic Dean signature
              paired with ATA Central Council Secretarial token.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Current Signatory Session:</span>
            <span className="font-mono font-bold text-slate-800">Dr. Grace Chen [CA-01]</span>
          </div>
        </div>
      </div>

      {/* 9. Bottom Architecture Bar */}
      <div className="p-3.5 rounded-2xl bg-[#f0fdfa]/70 border border-[#ccfbf1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-full bg-teal-100 text-[#006f67] flex items-center justify-center shrink-0">
            <Cloud className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium text-slate-700">
            Immutable Cloud Repository synchronized with Supabase Storage &amp; Asia Council Master Key Enclave
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">KMS HSM ID: 884-X9-ATA-KEY-VAULT</span>
          <span>•</span>
          <span>TLS 1.3 / ChaCha20-Poly1305</span>
        </div>
      </div>

      {/* 10. Modals */}

      {/* Modal 1: Run Vault Hash Audit */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <Scan className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Run Vault Hash Audit</h3>
                  <p className="text-xs text-slate-500">Node SG-ASIA-01 Merkle Cross-Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Repository:</span>
                <span className="font-bold text-slate-800">142 Asian Seminaries Vault</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Scanned Credentials:</span>
                <span className="font-bold text-slate-800">1,842 files</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Consensus Root:</span>
                <span className="font-mono text-[#006f67] font-bold">#ATA-IND-94821</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hash Algorithm:</span>
                <span className="font-mono text-slate-700">SHA-256 (FIPS 180-4)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Cryptographic Integrity Confirmed</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  1,842 of 1,842 credential digests match on-chain Merkle hashes with zero bit-rot or tampering detected.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Vault Audit Certificate dispatched to ATA Central Secretariat.');
                  setAuditModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#006f67] text-white hover:bg-[#005a54] shadow-xs"
              >
                Sign &amp; Download Audit Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Export Certified Vault */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Archive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Export Certified Vault Archive</h3>
                  <p className="text-xs text-slate-500">Cryptographically signed ZIP package</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export all 1,842 secured credentials or the selected {selectedDocIds.size > 0 ? selectedDocIds.size : '5'} assets
              with corresponding SHA-256 checksums and secretarial attestation certificates.
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
                <input type="radio" name="export-format" defaultChecked className="text-[#006f67]" />
                <div>
                  <p className="font-bold text-slate-800">Encrypted ZIP Archive (.zip)</p>
                  <p className="text-[11px] text-slate-500">Includes original PDF/A files + SHA256 checksums</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
                <input type="radio" name="export-format" className="text-[#006f67]" />
                <div>
                  <p className="font-bold text-slate-800">Cryptographic JSON Ledger Manifest</p>
                  <p className="text-[11px] text-slate-500">Metadata, Merkle proofs, and WORM timestamps</p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Generating certified archive... Download will begin shortly.');
                  setExportModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800 shadow-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Start Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Verify Master Ledger */}
      {ledgerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Master Ledger Consensus</h3>
                  <p className="text-xs text-slate-500">Root Block #ATA-IND-94821</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLedgerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Consensus Engine:</span>
                  <span className="font-bold text-slate-800">Raft-BFT v2.4 Multi-Master</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Root Digest:</span>
                  <span className="font-mono text-[11px] text-teal-700 font-bold">
                    sha256:7f9a8820c441b2190ef992a0149021a8...80e3
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Validators:</span>
                  <span className="font-bold text-emerald-600">3 of 3 Nodes in Quorum</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">SAIACS Academic (Bengaluru)</span>
                  <span className="text-emerald-600 font-bold">● Synced (14ms)</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">ATA Central Council (Singapore HQ)</span>
                  <span className="text-emerald-600 font-bold">● Synced (Master)</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Serampore Senate V. (Kolkata)</span>
                  <span className="text-emerald-600 font-bold">● Synced (28ms)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setLedgerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Document Inspector */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{inspectDoc.title}</h3>
                  <p className="text-xs text-slate-500">
                    Candidate: {inspectDoc.candidate.name} ({inspectDoc.candidate.regNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Institution</span>
                <p className="font-bold text-slate-800">{inspectDoc.candidate.institution}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Credential Category</span>
                <p className="font-bold text-slate-800">{inspectDoc.category.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Ingestion Actor</span>
                <p className="font-bold text-slate-800">{inspectDoc.ingestion.actor}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Timestamp</span>
                <p className="font-bold text-slate-800">{inspectDoc.ingestion.timestamp}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Cryptographic SHA-256 Digest</span>
              <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] flex items-center justify-between gap-2 break-all">
                <span>{inspectDoc.sha256}</span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(inspectDoc.sha256)}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white shrink-0"
                >
                  {copiedHash === inspectDoc.sha256 ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-between text-xs text-[#006f67]">
              <span className="font-medium">WORM Immutability Lock: ACTIVE (50 Years)</span>
              <span className="font-bold">AWS ap-south-1</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert(`Downloading verified copy of ${inspectDoc.title}...`)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-neutral-800 shadow-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Certified Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Flagged Seal Check / Re-Inspection */}
      {flaggedDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Credential Re-Inspection Alert</h3>
                  <p className="text-xs text-rose-600 font-semibold">Physical Seal Check Required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFlaggedDocModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2 text-xs">
              <p className="font-bold text-rose-900">{flaggedDocModal.title}</p>
              <p className="text-rose-700">
                Candidate: <span className="font-semibold">{flaggedDocModal.candidate.name}</span> ({flaggedDocModal.candidate.regNumber}) • {flaggedDocModal.candidate.institution}
              </p>
              <div className="p-3 bg-white rounded-xl border border-rose-200/80 text-rose-800 font-medium">
                Deficiency: {flaggedDocModal.flagReason || 'Missing Watermark Seal from Senate of Serampore College.'}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Available Administrative Actions:</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    alert('Deficiency notification dispatched to Registrar Office, COTR Theological College.');
                    setFlaggedDocModal(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium flex items-center justify-between"
                >
                  <span>1. Dispatch Resubmission Notice to Registrar</span>
                  <span className="text-[#006f67] font-bold">Send Notification →</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Emergency Secretarial Waiver approved with Token #ATA-WVR-2026-09. Status updated to Verified.');
                    setFlaggedDocModal(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium flex items-center justify-between"
                >
                  <span>2. Issue Executive Secretarial Attestation Waiver</span>
                  <span className="text-slate-800 font-bold">Attest Waiver →</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setFlaggedDocModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
