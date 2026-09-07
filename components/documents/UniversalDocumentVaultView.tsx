'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Registration } from '@/lib/types';
import {
  ShieldCheck,
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Search,
  SlidersHorizontal,
  RefreshCw,
  FileText,
  Award,
  Users,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Archive,
  Key,
  Cloud,
  Upload,
  Zap,
  RotateCw,
  Globe,
  FileCheck,
  AlertCircle,
  Filter,
  Copy,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface UniversalVaultDocument {
  id: string;
  title: string;
  fileSpecs: {
    size: string;
    detail: string;
    warning?: boolean;
  };
  candidate: {
    name: string;
    uid: string;
    institution: string;
    avatarUrl?: string;
  };
  category: {
    name: string;
    subtext: string;
    variant: 'mint' | 'blue' | 'red' | 'teal';
  };
  ingestion: {
    actor: string;
    timestamp: string;
    ipOrAudit: string;
    warning?: boolean;
  };
  sha256Hash: string;
  s3Path: string;
  ocrConfidence: number;
}

export const INITIAL_UNIVERSAL_VAULT_DOCUMENTS: UniversalVaultDocument[] = [
  {
    id: 'vault-doc-01',
    title: 'BTh_Original_Consolidated_Transcript.pdf',
    fileSpecs: {
      size: '3.4 MB',
      detail: 'OCR Processed • PDF/A-2b',
    },
    candidate: {
      name: 'Rev. David Immanuel Sangma',
      uid: 'STU-2021-00314',
      institution: 'SAIACS Bengaluru',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    category: {
      name: 'Academic Transcript',
      subtext: 'Serampore Conferred',
      variant: 'mint',
    },
    ingestion: {
      actor: 'Rev. M. Thomas (Registrar)',
      timestamp: 'Today 09:20 AM IST',
      ipOrAudit: 'IP: 103.226.14.72',
    },
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    s3Path: 's3://ata-worm-enclave-mumbai/transcripts/2021/STU-2021-00314-bth-consolidated.pdf',
    ocrConfidence: 99.4,
  },
  {
    id: 'vault-doc-02',
    title: 'Church_Commendation_CSI_Diocese.pdf',
    fileSpecs: {
      size: '1.1 MB',
      detail: 'Bishopric Digital Signature',
    },
    candidate: {
      name: 'Ananya Sengupta',
      uid: 'STU-2026-00012',
      institution: 'SAIACS Bengaluru',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
    category: {
      name: 'Church Endorsement',
      subtext: 'Diocesan Synod Seal',
      variant: 'blue',
    },
    ingestion: {
      actor: 'Dr. Grace Chen (Super-Admin)',
      timestamp: 'Yesterday 04:15 PM',
      ipOrAudit: 'Direct Council Ingest',
    },
    sha256Hash: '9f8c2e1b6a3d4c5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
    s3Path: 's3://ata-worm-enclave-mumbai/endorsements/2026/STU-2026-00012-csi-bishopric.pdf',
    ocrConfidence: 98.8,
  },
  {
    id: 'vault-doc-03',
    title: 'Aadhaar_National_ID_Scan_Masked.jpg',
    fileSpecs: {
      size: '2.6 MB',
      detail: 'UIDAI Masked • Match 98.4%',
    },
    candidate: {
      name: 'Joshua R. Sailo',
      uid: 'STU-2026-00014',
      institution: 'Aizawl ATC Mizoram',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    category: {
      name: 'National ID',
      subtext: 'Biometric Verified',
      variant: 'blue',
    },
    ingestion: {
      actor: 'System KYC Ingestion Engine',
      timestamp: '24 Feb 11:34 AM',
      ipOrAudit: 'Automated Audit ID: 9021',
    },
    sha256Hash: '4e2d8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
    s3Path: 's3://ata-worm-enclave-mumbai/kyc/2026/STU-2026-00014-aadhaar-masked.jpg',
    ocrConfidence: 98.4,
  },
  {
    id: 'vault-doc-04',
    title: 'MDiv_Provisional_Certificate_Serampore.pdf',
    fileSpecs: {
      size: '4.2 MB',
      detail: 'Missing Watermark Seal Warning',
      warning: true,
    },
    candidate: {
      name: 'Priya Sharma',
      uid: 'STU-2023-01182',
      institution: 'COTR Seminary',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    category: {
      name: 'Academic Transcript',
      subtext: 'Seal Discrepancy',
      variant: 'red',
    },
    ingestion: {
      actor: 'Registrar Office, COTR',
      timestamp: '23 Feb 02:45 PM',
      ipOrAudit: 'Flagged by Auditor Node',
      warning: true,
    },
    sha256Hash: 'd3a8b2c4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9',
    s3Path: 's3://ata-worm-enclave-mumbai/quarantine/2026/STU-2023-01182-mdiv-provisional.pdf',
    ocrConfidence: 82.1,
  },
  {
    id: 'vault-doc-05',
    title: 'MTh_Thesis_Defense_Approval.pdf',
    fileSpecs: {
      size: '890 KB',
      detail: 'Deanery Signed',
    },
    candidate: {
      name: 'Deborah Lalthanzami',
      uid: 'STU-2022-00894',
      institution: 'AICS Mizoram',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    },
    category: {
      name: 'Degree Scroll',
      subtext: 'Thesis Committee Signoff',
      variant: 'teal',
    },
    ingestion: {
      actor: 'Dean Academic Affairs',
      timestamp: '22 Feb 05:10 PM',
      ipOrAudit: 'AICS Dean Council Token',
    },
    sha256Hash: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    s3Path: 's3://ata-worm-enclave-mumbai/degrees/2026/STU-2022-00894-mth-defense.pdf',
    ocrConfidence: 99.1,
  },
];

interface UniversalDocumentVaultViewProps {
  registrations?: Registration[];
  onSelectRegistration?: (reg: Registration) => void;
  onUploadDocument?: (file: File) => Promise<void>;
}

export const UniversalDocumentVaultView: React.FC<UniversalDocumentVaultViewProps> = ({
  registrations = [],
  onSelectRegistration,
  onUploadDocument,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TRANSCRIPTS' | 'CHURCH' | 'ID' | 'SCROLLS'>('ALL');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [merkleAuditModalOpen, setMerkleAuditModalOpen] = useState(false);
  const [merkleAuditing, setMerkleAuditing] = useState(false);
  const [merkleAuditComplete, setMerkleAuditComplete] = useState(false);

  const [emergencyInvalidationModalOpen, setEmergencyInvalidationModalOpen] = useState(false);
  const [invalidationTargetDoc, setInvalidationTargetDoc] = useState<UniversalVaultDocument | null>(null);
  const [invalidationSynodRef, setInvalidationSynodRef] = useState('');

  const [directIngestModalOpen, setDirectIngestModalOpen] = useState(false);
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [credentialInspectorDoc, setCredentialInspectorDoc] = useState<UniversalVaultDocument | null>(null);
  const [verifyMasterLedgerModalOpen, setVerifyMasterLedgerModalOpen] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return INITIAL_UNIVERSAL_VAULT_DOCUMENTS.filter((doc) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchName = doc.candidate.name.toLowerCase().includes(q);
        const matchUid = doc.candidate.uid.toLowerCase().includes(q);
        const matchInst = doc.candidate.institution.toLowerCase().includes(q);
        const matchHash = doc.sha256Hash.toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchUid && !matchInst && !matchHash) {
          return false;
        }
      }

      // Dropdown status
      if (selectedStatus === 'VERIFIED' && doc.fileSpecs.warning) return false;
      if (selectedStatus === 'AUDIT' && !doc.fileSpecs.warning) return false;
      if (selectedStatus === 'DISCREPANCY' && !doc.fileSpecs.warning) return false;

      // Tab
      if (activeTab === 'TRANSCRIPTS' && doc.category.name !== 'Academic Transcript') return false;
      if (activeTab === 'CHURCH' && doc.category.name !== 'Church Endorsement') return false;
      if (activeTab === 'ID' && doc.category.name !== 'National ID') return false;
      if (activeTab === 'SCROLLS' && doc.category.name !== 'Degree Scroll') return false;

      return true;
    });
  }, [searchQuery, selectedStatus, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, activeTab]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocIds(next);
  };

  // Handle Merkle Audit
  const handleRunMerkleAudit = () => {
    setMerkleAuditing(true);
    setMerkleAuditComplete(false);
    setTimeout(() => {
      setMerkleAuditing(false);
      setMerkleAuditComplete(true);
    }, 1600);
  };

  // Handle Emergency Invalidation
  const handleCommitInvalidation = () => {
    if (!invalidationSynodRef.trim()) {
      alert('Formal Synod Resolution / Decree Reference is strictly required to invalidate a WORM credential.');
      return;
    }
    setEmergencyInvalidationModalOpen(false);
    showToast(`Credential revoked and sealed as QUARANTINED under Synod Ref: ${invalidationSynodRef}`);
    setInvalidationSynodRef('');
    setInvalidationTargetDoc(null);
  };

  // Handle Bulk Export Certified Vault
  const handleExportZip = () => {
    const manifest = {
      archiveTitle: 'ATA Central Document Locker & Verification Vault Certified Export',
      exportedAt: new Date().toISOString(),
      enclave: 'AWS S3 AP-SOUTH-1 (Mumbai WORM)',
      merkleRootBlock: '#ATA-IND-94821',
      totalDocuments: 1842,
      manifestRecords: INITIAL_UNIVERSAL_VAULT_DOCUMENTS.map((d) => ({
        id: d.id,
        filename: d.title,
        candidateUid: d.candidate.uid,
        candidateName: d.candidate.name,
        category: d.category.name,
        sha256: d.sha256Hash,
        s3Uri: d.s3Path,
        integrityStatus: d.fileSpecs.warning ? 'DISCREPANCY_FLAGGED' : 'VERIFIED_VALID',
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATA_Certified_Vault_Manifest_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Certified Vault Manifest (.json) downloaded with SHA-256 signatures.');
  };

  // Handle Direct Ingest
  const handleCommitIngest = async () => {
    if (!ingestFile) return;
    setIsUploading(true);
    try {
      if (onUploadDocument) {
        await onUploadDocument(ingestFile);
      }
      setDirectIngestModalOpen(false);
      setIngestFile(null);
      showToast(`Document ${ingestFile.name} successfully committed to WORM S3 Enclave.`);
    } catch (err: any) {
      alert(`Ingest failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
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
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Compliance &amp; Vault</span>
          <span>&rsaquo;</span>
          <span className="text-slate-900 font-bold">Central Document Locker &amp; Cryptographic Verification Vault</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dcfce7]/70 text-[#006f67] border border-[#86efac]/60 font-semibold shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>ROOT CONSENSUS OK • WORM S3 Enclave Active • Ed25519 Verified • SG-ASIA-01 Node</span>
        </div>
      </div>

      {/* 2. Category Tag & Page Title */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            <span>LEVEL-0 LEDGER REPOSITORY</span>
            <span>•</span>
            <span className="text-[#006f67]">142 Member Seminaries Synchronized</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Central Document Locker &amp; Verification Vault
          </h1>

          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Pan-Asian cryptographic repository of all candidate academic transcripts, institutional church recommendations,
            government identification credentials, and degree scrolls across 142 seminaries. Execute root hash audits, emergency
            seal invalidations, and certified bulk exports.
          </p>
        </div>

        {/* 4 Top Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMerkleAuditComplete(false);
              setMerkleAuditModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Shield className="h-4 w-4 text-slate-600" />
            <span>Run Full Vault Merkle Audit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInvalidationTargetDoc(INITIAL_UNIVERSAL_VAULT_DOCUMENTS[3]);
              setEmergencyInvalidationModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Zap className="h-4 w-4 text-red-600" />
            <span>Emergency Credential Invalidation</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Archive className="h-4 w-4 text-slate-600" />
            <span>Bulk Export Certified Vault (.zip)</span>
          </button>

          <button
            type="button"
            onClick={() => setDirectIngestModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Upload className="h-4 w-4 text-white" />
            <span>Direct Ingest Document</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL SECURED CREDENTIALS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TOTAL SECURED CREDENTIALS
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">1,842</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Across 482 active candidates</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#006f67] border border-teal-200">
                <Lock className="h-3 w-3" />
                <span>100% WORM</span>
              </span>
            </div>
          </div>
          <div className="h-1 w-12 bg-[#006f67] rounded-full mt-4" />
        </div>

        {/* Card 2: CRYPTOGRAPHIC CLEARANCE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                CRYPTOGRAPHIC CLEARANCE
              </span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">96.4%</span>
              <span className="text-xs font-bold text-emerald-600">+1.2% cycle</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">Serampore / Senate DB sync OK</div>
          </div>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-4" />
        </div>

        {/* Card 3: AUDIT / RE-INSPECTION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                AUDIT / RE-INSPECTION
              </span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">48 Files</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Seal Check required</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                Physical flags
              </span>
            </div>
          </div>
          <div className="h-1 w-12 bg-rose-600 rounded-full mt-4" />
        </div>

        {/* Card 4: VAULT STORAGE UTILIZED */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                VAULT STORAGE UTILIZED
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">38.6 GB</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">15.4% of 250 GB AWS S3 AP-SOUTH-1</span>
              <span className="font-bold text-slate-600">WORM Enclave</span>
            </div>
          </div>
          <div className="h-1 w-12 bg-blue-600 rounded-full mt-4" />
        </div>
      </div>

      {/* 4. Cryptographic Proof & SHA-256 Ledger Consensus Card (Dark Navy Banner) */}
      <div className="bg-[#131b26] rounded-2xl p-5 border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white text-base">
                Cryptographic Proof &amp; SHA-256 Ledger Consensus
              </h3>
              <span className="bg-[#004d40] text-emerald-300 font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                LIVE VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Status: Live Consensus Verified • Node SG-ASIA-01 • Master Root Block{' '}
              <span className="font-mono text-teal-300 font-bold">#ATA-IND-94821</span>: Zero Tamper Incidents recorded
              across rolling 90-day cycle. WORM Immutable Retention Rule enforced by Synod Protocol 11.2/B.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setVerifyMasterLedgerModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileCheck className="h-4 w-4 text-teal-300" />
            <span>Verify Master Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showToast('Merkle Proof Path generated: proof_root_block_94821.dat (12 node branches confirmed)');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Layers className="h-4 w-4 text-teal-300" />
            <span>Export Merkle Proof Path</span>
          </button>
        </div>
      </div>

      {/* 5. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, UID, document title, or SHA-256..."
              className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006f67]/20 focus:border-[#006f67]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-400 font-mono">
              Ctrl+K
            </span>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-64 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006f67]/20"
          >
            <option value="ALL">All Statuses (Verified, Under Audit, Discrepancy)</option>
            <option value="VERIFIED">Verified Clean (1,794)</option>
            <option value="AUDIT">Under Audit Inspection (32)</option>
            <option value="DISCREPANCY">Discrepancy Flagged (16)</option>
          </select>

          {/* Advanced Button */}
          <button
            type="button"
            onClick={() => showToast('Advanced Filter: WORM bucket partition & Serampore signature filter engaged')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <span>Advanced</span>
          </button>
        </div>

        {/* Filter Tabs Row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Documents (1,842)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSCRIPTS')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'TRANSCRIPTS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Academic Transcripts (714)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHURCH')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'CHURCH'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Church Commendations (482)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ID')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'ID'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Government Photo IDs (482)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCROLLS')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeTab === 'SCROLLS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Degree Scrolls (164)
          </button>
        </div>
      </div>

      {/* 6. Vault Ledger Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Subheader bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/60 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              Showing 1-{filteredDocuments.length} of 1,842 Verified Assets
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500 font-bold">
              Enclave: <span className="text-slate-800">AWS-AP-SOUTH-1 (Mumbai WORM)</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>All Hashes Matched Root</span>
            </div>

            <button
              type="button"
              onClick={() => showToast('Batch Recalculation Triggered: All 1,842 SHA-256 hashes synchronized.')}
              className="font-bold text-[#006f67] hover:underline"
            >
              Batch Recalculate
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/40 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                  />
                </th>
                <th className="py-3.5 px-4">DOCUMENT TITLE &amp; SPECS</th>
                <th className="py-3.5 px-4">CANDIDATE PROFILE &amp; UID</th>
                <th className="py-3.5 px-4">CREDENTIAL CATEGORY</th>
                <th className="py-3.5 px-4">INGESTION ACTOR &amp; TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedDocuments.map((doc) => {
                const isChecked = selectedDocIds.has(doc.id);
                return (
                  <tr
                    key={doc.id}
                    onClick={() => setCredentialInspectorDoc(doc)}
                    className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${
                      isChecked ? 'bg-teal-50/50' : ''
                    } ${doc.fileSpecs.warning ? 'bg-red-50/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectRow(doc.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectRow(doc.id)}
                        className="rounded border-slate-300 text-[#006f67] focus:ring-[#006f67]"
                      />
                    </td>

                    {/* Document Title & Specs */}
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                            doc.fileSpecs.warning
                              ? 'bg-red-100 text-red-600'
                              : doc.category.name === 'Degree Scroll'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {doc.fileSpecs.warning ? (
                            <AlertCircle className="h-5 w-5" />
                          ) : doc.category.name === 'Degree Scroll' ? (
                            <Award className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{doc.title}</span>
                          </div>
                          <p
                            className={`text-[11px] font-medium ${
                              doc.fileSpecs.warning ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {doc.fileSpecs.size} • {doc.fileSpecs.detail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Candidate Profile & UID */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {doc.candidate.avatarUrl ? (
                          <img
                            src={doc.candidate.avatarUrl}
                            alt={doc.candidate.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {doc.candidate.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{doc.candidate.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            <span className="font-mono text-blue-600 font-semibold">{doc.candidate.uid}</span> •{' '}
                            <span>{doc.candidate.institution}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Credential Category */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        {doc.category.variant === 'mint' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {doc.category.name}
                          </span>
                        )}
                        {doc.category.variant === 'blue' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {doc.category.name}
                          </span>
                        )}
                        {doc.category.variant === 'red' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            {doc.category.name}
                          </span>
                        )}
                        {doc.category.variant === 'teal' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#006f67] border border-teal-200">
                            {doc.category.name}
                          </span>
                        )}
                        <p
                          className={`text-[11px] ${
                            doc.category.variant === 'red' ? 'text-red-700 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {doc.category.subtext}
                        </p>
                      </div>
                    </td>

                    {/* Ingestion Actor & Time */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{doc.ingestion.actor}</div>
                        <div className="text-[11px] text-slate-500">
                          <span>{doc.ingestion.timestamp}</span>
                        </div>
                        <div
                          className={`text-[11px] font-mono ${
                            doc.ingestion.warning ? 'text-rose-600 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {doc.ingestion.ipOrAudit}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredDocuments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} documents
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

      {/* 7. Bottom 3 Policy & Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: WORM Retention Policy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">WORM Retention Policy</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Credentials are fixed to Write-Once-Read-Many storage in AWS Mumbai. Immutability locked under 50-year
              retention rule by ATA Executive Synod Decree. Neither administrators nor cloud providers can modify or
              prematurely purge objects.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Compliance: ISO 27001 / SEC 17a-4</span>
            <Globe className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Card 2: Senate Federation Sync */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Senate Federation Sync</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-validated with Senate of Serampore College and South Asian Theological Accreditation registries. Daily
              automated hash reconciliation identifies counterfeit certificates and invalid notarial seals across member
              colleges.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daily Sync: 03:00 AM UTC (Success)</span>
            <Cloud className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Card 3: Dual Quorum Attestation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Key className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Dual Quorum Attestation</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Discrepancy resolution and document de-archiving mandate cryptographic dual keys: Academic Dean signature
              paired with ATA Central Council Secretariat token. No unilateral modification or deletion is physically
              permissible.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Consensus Threshold: 2 of 2 Required</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* MODAL 1: Run Full Vault Merkle Audit */}
      {merkleAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Run Full Vault Merkle Audit</h3>
                  <p className="text-xs text-slate-500">Cryptographic audit of 1,842 assets across AWS S3 WORM enclaves</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMerkleAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Enclave Scope:</span>
                  <span className="text-[#006f67]">AWS S3 AP-SOUTH-1 (Mumbai)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Objects in Scope:</span>
                  <span>1,842 Cryptographic Assets</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Root Block Reference:</span>
                  <span className="font-mono">#ATA-IND-94821</span>
                </div>
              </div>

              {merkleAuditing && (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-2">
                  <div className="inline-block h-6 w-6 border-2 border-[#006f67] border-t-transparent rounded-full animate-spin" />
                  <p className="font-bold text-[#006f67]">Hashing WORM S3 binary chunks &amp; verifying Merkle leaf nodes...</p>
                  <p className="text-[11px] text-slate-500 font-mono">1,842 / 1,842 verified</p>
                </div>
              )}

              {merkleAuditComplete && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Merkle Audit Passed (0 Drift)</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    All 1,842 binary assets matched their registered SHA-256 digests. 1 object remains quarantined under
                    standing Deanery review.
                  </p>
                  <div className="font-mono text-[11px] bg-white/80 p-2 rounded border border-emerald-200">
                    Audit Seal: #MERKLE-2026-SG-ASIA-01-PASS-OK
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMerkleAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              {!merkleAuditComplete ? (
                <button
                  type="button"
                  onClick={handleRunMerkleAudit}
                  disabled={merkleAuditing}
                  className="px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {merkleAuditing ? 'Auditing Enclave...' : 'Start Merkle Audit'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMerkleAuditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                >
                  Acknowledge Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Credential Invalidation */}
      {emergencyInvalidationModalOpen && invalidationTargetDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Emergency Credential Invalidation</h3>
                  <p className="text-xs text-slate-500">Universal Super-Admin Revocation Authority</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyInvalidationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Permanent Quarantine Protocol</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Invalidating this credential flags the student roll, revokes regional recognition of the credential, and
                  locks subsequent program progression until an authorized Synod review board convenes.
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target File:</span>
                  <span className="font-bold text-slate-900">{invalidationTargetDoc.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidate:</span>
                  <span className="font-bold text-slate-900">{invalidationTargetDoc.candidate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SHA-256 Digest:</span>
                  <span className="font-mono text-[10px] text-slate-700">{invalidationTargetDoc.sha256Hash.slice(0, 24)}...</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Synod Resolution / Executive Decree Ref *
                </label>
                <input
                  type="text"
                  value={invalidationSynodRef}
                  onChange={(e) => setInvalidationSynodRef(e.target.value)}
                  placeholder="e.g. ATA-SYNOD-2026-REVOKE-048"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmergencyInvalidationModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitInvalidation}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Sign &amp; Commit Invalidation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Direct Ingest Document Modal */}
      {directIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Direct Ingest Document</h3>
                  <p className="text-xs text-slate-500">Universal authority bypass into AWS Mumbai WORM Enclave</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDirectIngestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 text-center space-y-2 bg-slate-50/50">
                <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800">
                  {ingestFile ? ingestFile.name : 'Select or drag certified theological credential'}
                </p>
                <p className="text-[11px] text-slate-500">Accepted formats: PDF, PDF/A, JPG, PNG (Max 25MB)</p>
                <input
                  type="file"
                  onChange={(e) => setIngestFile(e.target.files?.[0] || null)}
                  className="block mx-auto text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-black file:text-white file:text-xs"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1 text-slate-700">
                <div className="font-bold text-[#006f67] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Automated Ingestion Pipeline:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  File will undergo OCR text extraction, SHA-256 fingerprinting, Serampore watermark reconciliation, and
                  immediate immutable commit into AWS S3 WORM bucket.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDirectIngestModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitIngest}
                disabled={!ingestFile || isUploading}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {isUploading ? 'Ingesting into WORM...' : 'Commit to Enclave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Credential Inspector Modal */}
      {credentialInspectorDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{credentialInspectorDoc.title}</h3>
                  <p className="text-xs text-slate-500">
                    {credentialInspectorDoc.candidate.name} ({credentialInspectorDoc.candidate.uid})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialInspectorDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Credential Category</span>
                  <span className="font-bold text-slate-900">{credentialInspectorDoc.category.name}</span>
                  <p className="text-[11px] text-slate-500">{credentialInspectorDoc.category.subtext}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">OCR Confidence</span>
                  <span className="font-bold text-emerald-600">{credentialInspectorDoc.ocrConfidence}%</span>
                  <p className="text-[11px] text-slate-500">Tesseract-v5 Neural Engine</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">SHA-256 Hash Digest</span>
                <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 break-all border border-slate-200">
                  {credentialInspectorDoc.sha256Hash}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">WORM S3 Enclave URI</span>
                <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 break-all border border-slate-200">
                  {credentialInspectorDoc.s3Path}
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                <span className="font-bold text-[#006f67] block">Provenance &amp; Attestation Trail:</span>
                <p className="text-[11px] text-slate-600">
                  Committed by {credentialInspectorDoc.ingestion.actor} at {credentialInspectorDoc.ingestion.timestamp}.
                  Signed with ATA Asia Regional Master Node key.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(credentialInspectorDoc.sha256Hash);
                  showToast('SHA-256 Hash copied to clipboard.');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#006f67] hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Cryptographic Hash</span>
              </button>

              <button
                type="button"
                onClick={() => setCredentialInspectorDoc(null)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Verify Master Ledger Modal */}
      {verifyMasterLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Live Consensus Telemetry</h3>
                  <p className="text-xs text-slate-500">Root Block #ATA-IND-94821</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyMasterLedgerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 font-mono text-xs text-slate-700 bg-slate-50 m-5 rounded-xl border border-slate-200">
              <div className="text-emerald-700 font-bold">[NODE-SG-01] CONSENSUS STATUS: VERIFIED OK</div>
              <div>Master Block: #ATA-IND-94821 (Height: 89,402)</div>
              <div>WORM Retention Lock: ACTIVE (50 Years)</div>
              <div>Peer Enclave Sync: Mumbai (100%), Singapore (100%), Manila (100%)</div>
              <div>Tamper Flags Detected: 0</div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setVerifyMasterLedgerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
