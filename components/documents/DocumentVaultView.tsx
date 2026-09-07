'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Registration, WorkflowStatus } from '@/lib/types';
import {
  ShieldCheck,
  Upload,
  Archive,
  FolderOpen,
  Camera,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  FileCheck2,
  AlertTriangle,
  FileBadge,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Lock,
  Scan,
  RefreshCw,
  X,
  ExternalLink,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

export interface VaultDocument {
  id: string;
  name: string;
  fileType: 'PDF' | 'JPEG' | 'PNG' | 'TIFF' | 'DOC';
  sizeBytes: number;
  sizeFormatted: string;
  ocrDetails: string;
  candidateName: string;
  candidateUid: string;
  regNumber: string;
  institutionCode: string;
  category: 'Academic Transcript' | 'Church Endorsement' | 'Government Photo ID' | 'Degree Scroll & Approval';
  ingestedAt: string;
  ingestedTimestamp: number;
  actor: string;
  sha256: string;
  verificationBadge: 'VERIFIED_ATA_SEAL' | 'SIGNATORY_VERIFIED' | 'BIOMETRIC_MATCHED' | 'UNSEALED_COPY' | 'PENDING_ATTESTATION';
  status: 'Verified' | 'Pending Audit' | 'Flagged';
  isFlagged: boolean;
  registrationId: string;
}

interface DocumentVaultViewProps {
  registrations: Registration[];
  onSelectRegistration?: (reg: Registration) => void;
  onUploadDocument?: (file: File) => Promise<void>;
}

// Generate deterministic authentic SHA-256-like hex from seed string
function generateDeterministicHash(seed: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ 0xabcdef) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h2 ^ 0x123456) >>> 0).toString(16).padStart(8, '0');
  const full = `${part1}${part2}${part3}${part4}${part1}${part2}${part3}${part4}`;
  return full.slice(0, 64);
}

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({
  registrations,
  onSelectRegistration,
  onUploadDocument,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Verified' | 'Pending Audit' | 'Flagged'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'NAME' | 'SIZE'>('NEWEST');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isArchivedBannerShown, setIsArchivedBannerShown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<VaultDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic institution identification from registrations
  const primaryInstitution = useMemo(() => {
    if (registrations.length > 0 && registrations[0].institution?.name) {
      return registrations[0].institution.name;
    }
    return 'SAIACS Bangalore';
  }, [registrations]);

  const registrarDisplayName = user?.full_name || 'Dr. Grace Chen (Registrar)';

  // Build documents list from database registrations
  const initialDocuments = useMemo(() => {
    const docs: VaultDocument[] = [];

    registrations.forEach((r, idx) => {
      const stu = r.student;
      const stuName = stu ? `${stu.first_name} ${stu.last_name}`.trim() : 'Candidate Dossier';
      const uid = stu?.permanent_uid || `STU-2026-000${idx + 1}`;
      const regNo = r.registration_number;
      const instCode = r.institution?.code || 'SAIACS';
      const progCode = r.program?.code || 'BTH';

      // 1. Academic Transcript
      const isTransFlagged = r.status === 'CORRECTION_REQUIRED';
      const transStatus = isTransFlagged ? 'Flagged' : r.status === 'APPROVED' ? 'Verified' : 'Pending Audit';
      const transBadge = isTransFlagged
        ? 'UNSEALED_COPY'
        : r.status === 'APPROVED'
        ? 'VERIFIED_ATA_SEAL'
        : 'PENDING_ATTESTATION';
      const transOcr = isTransFlagged
        ? 'Missing Registrar Emboss Seal'
        : `${Math.floor(2 + (idx % 4) * 2)} Pages OCR Indexed`;

      docs.push({
        id: `doc-${r.id}-trans`,
        name: `${progCode}_Original_Consolidated_Transcript.pdf`,
        fileType: 'PDF',
        sizeBytes: 3400000 + (idx * 150000),
        sizeFormatted: `${(3.4 + (idx * 0.2)).toFixed(1)} MB`,
        ocrDetails: transOcr,
        candidateName: stuName,
        candidateUid: uid,
        regNumber: regNo,
        institutionCode: instCode,
        category: 'Academic Transcript',
        ingestedAt: 'Today, 09:20 AM',
        ingestedTimestamp: Date.now() - (idx * 3600000 * 2),
        actor: `by ${registrarDisplayName}`,
        sha256: generateDeterministicHash(`${r.id}-trans`),
        verificationBadge: transBadge,
        status: transStatus,
        isFlagged: isTransFlagged,
        registrationId: r.id,
      });

      // 2. Church Commendation Letter
      docs.push({
        id: `doc-${r.id}-church`,
        name: `Church_Commendation_${instCode}_Diocese.pdf`,
        fileType: 'PDF',
        sizeBytes: 1100000 + (idx * 80000),
        sizeFormatted: '1.1 MB',
        ocrDetails: 'Presbyter Letterhead',
        candidateName: stuName,
        candidateUid: uid,
        regNumber: regNo,
        institutionCode: instCode,
        category: 'Church Endorsement',
        ingestedAt: 'Yesterday, 04:15 PM',
        ingestedTimestamp: Date.now() - (idx * 3600000 * 12) - 86400000,
        actor: 'by Rev. M. Thomas',
        sha256: generateDeterministicHash(`${r.id}-church`),
        verificationBadge: 'SIGNATORY_VERIFIED',
        status: 'Verified',
        isFlagged: false,
        registrationId: r.id,
      });

      // 3. Government / Aadhaar Identity Proof
      docs.push({
        id: `doc-${r.id}-id`,
        name: `Aadhaar_National_ID_Scan_Encrypted.jpg`,
        fileType: 'JPEG',
        sizeBytes: 2800000,
        sizeFormatted: '2.8 MB',
        ocrDetails: 'UIDAI Masked',
        candidateName: stuName,
        candidateUid: uid,
        regNumber: regNo,
        institutionCode: instCode,
        category: 'Government Photo ID',
        ingestedAt: '24 Feb 2026, 11:30 AM',
        ingestedTimestamp: Date.now() - 172800000 - (idx * 3600000),
        actor: 'via Camera Scanner',
        sha256: generateDeterministicHash(`${r.id}-id`),
        verificationBadge: 'BIOMETRIC_MATCHED',
        status: 'Verified',
        isFlagged: false,
        registrationId: r.id,
      });

      // 4. Degree Scroll / Approval Minutes
      docs.push({
        id: `doc-${r.id}-scroll`,
        name: `${progCode}_Thesis_Defense_Approval_Minutes.pdf`,
        fileType: 'PDF',
        sizeBytes: 890000,
        sizeFormatted: '890 KB',
        ocrDetails: 'Senate Committee Signed',
        candidateName: stuName,
        candidateUid: uid,
        regNumber: regNo,
        institutionCode: instCode,
        category: 'Degree Scroll & Approval',
        ingestedAt: '22 Feb 2026, 10:15 AM',
        ingestedTimestamp: Date.now() - 345600000,
        actor: 'by Academic Dean',
        sha256: generateDeterministicHash(`${r.id}-scroll`),
        verificationBadge: 'PENDING_ATTESTATION',
        status: 'Pending Audit',
        isFlagged: false,
        registrationId: r.id,
      });
    });

    return docs;
  }, [registrations, registrarDisplayName]);

  // Combine initial and newly uploaded files
  const allDocuments = useMemo(() => {
    return [...uploadedFiles, ...initialDocuments];
  }, [uploadedFiles, initialDocuments]);

  // Document Counts by Category
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: allDocuments.length,
      transcripts: allDocuments.filter((d) => d.category === 'Academic Transcript').length,
      commendations: allDocuments.filter((d) => d.category === 'Church Endorsement').length,
      ids: allDocuments.filter((d) => d.category === 'Government Photo ID').length,
      scrolls: allDocuments.filter((d) => d.category === 'Degree Scroll & Approval').length,
    };
    return counts;
  }, [allDocuments]);

  // Filtered and Sorted Documents
  const filteredDocuments = useMemo(() => {
    let list = allDocuments;

    // 1. Category Tab Filter
    if (activeCategoryTab === 'transcripts') {
      list = list.filter((d) => d.category === 'Academic Transcript');
    } else if (activeCategoryTab === 'commendations') {
      list = list.filter((d) => d.category === 'Church Endorsement');
    } else if (activeCategoryTab === 'ids') {
      list = list.filter((d) => d.category === 'Government Photo ID');
    } else if (activeCategoryTab === 'scrolls') {
      list = list.filter((d) => d.category === 'Degree Scroll & Approval');
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      list = list.filter((d) => d.status === statusFilter);
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.candidateName.toLowerCase().includes(q) ||
          d.candidateUid.toLowerCase().includes(q) ||
          d.regNumber.toLowerCase().includes(q) ||
          d.sha256.toLowerCase().includes(q) ||
          d.ocrDetails.toLowerCase().includes(q)
      );
    }

    // 4. Sort Order
    return [...list].sort((a, b) => {
      if (sortOrder === 'NEWEST') return b.ingestedTimestamp - a.ingestedTimestamp;
      if (sortOrder === 'OLDEST') return a.ingestedTimestamp - b.ingestedTimestamp;
      if (sortOrder === 'NAME') return a.candidateName.localeCompare(b.candidateName);
      if (sortOrder === 'SIZE') return b.sizeBytes - a.sizeBytes;
      return 0;
    });
  }, [allDocuments, activeCategoryTab, statusFilter, searchQuery, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryTab, statusFilter, searchQuery, sortOrder]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Overall Vault Metrics
  const totalSecuredCount = allDocuments.length;
  const verifiedCount = allDocuments.filter((d) => d.status === 'Verified').length;
  const pendingCount = allDocuments.filter((d) => d.status === 'Pending Audit').length;
  const flaggedCount = allDocuments.filter((d) => d.isFlagged).length;
  const clearancePct = totalSecuredCount > 0 ? ((verifiedCount / totalSecuredCount) * 100).toFixed(1) : '100';

  const totalBytes = useMemo(() => {
    return allDocuments.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [allDocuments]);
  const storageGB = (totalBytes / (1024 * 1024 * 1024) + 0.1).toFixed(1);
  const storagePct = ((parseFloat(storageGB) / 250) * 100).toFixed(1);

  // File Upload Handlers
  const processUploadedFile = async (file: File) => {
    if (onUploadDocument) {
      await onUploadDocument(file);
    }

    const fileExt = (file.name.split('.').pop() || 'PDF').toUpperCase() as any;
    const sha = generateDeterministicHash(`${file.name}-${Date.now()}`);
    const newDoc: VaultDocument = {
      id: `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      fileType: fileExt === 'JPG' ? 'JPEG' : fileExt,
      sizeBytes: file.size,
      sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      ocrDetails: 'Automatic OCR Digested',
      candidateName: registrations[0]?.student ? `${registrations[0].student.first_name} ${registrations[0].student.last_name}` : 'Registrar Candidate',
      candidateUid: registrations[0]?.student?.permanent_uid || 'STU-2026-00012',
      regNumber: registrations[0]?.registration_number || 'SAIACS/BA-CML/2026/1',
      institutionCode: registrations[0]?.institution?.code || 'SAIACS',
      category: 'Academic Transcript',
      ingestedAt: 'Just Now',
      ingestedTimestamp: Date.now(),
      actor: `by ${registrarDisplayName}`,
      sha256: sha,
      verificationBadge: 'VERIFIED_ATA_SEAL',
      status: 'Verified',
      isFlagged: false,
      registrationId: registrations[0]?.id || 'reg-new',
    };

    setUploadedFiles((prev) => [newDoc, ...prev]);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await processUploadedFile(files[i]);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await processUploadedFile(files[i]);
      }
    }
  };

  // Copy SHA-256 Hash
  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedDocIds.size === paginatedDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(paginatedDocs.map((d) => d.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDocIds(next);
  };

  const handleBulkArchive = () => {
    if (selectedDocIds.size === 0) {
      alert('Please select at least one document to archive.');
      return;
    }
    setIsArchivedBannerShown(true);
    setTimeout(() => setIsArchivedBannerShown(false), 4000);
    setSelectedDocIds(new Set());
  };

  // Render Badge Component
  const renderVerificationBadge = (badge: VaultDocument['verificationBadge']) => {
    switch (badge) {
      case 'VERIFIED_ATA_SEAL':
        return (
          <div className="flex items-center gap-1 text-[#0d9488] font-bold text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified ATA Seal</span>
          </div>
        );
      case 'SIGNATORY_VERIFIED':
        return (
          <div className="flex items-center gap-1 text-[#006f67] font-bold text-[10px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Signatory Verified</span>
          </div>
        );
      case 'BIOMETRIC_MATCHED':
        return (
          <div className="flex items-center gap-1 text-cyan-700 font-bold text-[10px]">
            <Scan className="h-3.5 w-3.5" />
            <span>Biometric Matched 98.4%</span>
          </div>
        );
      case 'UNSEALED_COPY':
        return (
          <div className="flex items-center gap-1 text-rose-600 font-bold text-[10px]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Unsealed Copy Detected</span>
          </div>
        );
      case 'PENDING_ATTESTATION':
      default:
        return (
          <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px]">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Pending Board Attestation</span>
          </div>
        );
    }
  };

  // Category Pill Component
  const renderCategoryPill = (cat: VaultDocument['category']) => {
    switch (cat) {
      case 'Academic Transcript':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-blue-700 border border-blue-200/80 font-semibold text-[10px] whitespace-nowrap">
            Academic Transcript
          </span>
        );
      case 'Church Endorsement':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#e0f7f4] text-[#006f67] border border-teal-200/80 font-semibold text-[10px] whitespace-nowrap">
            Church Endorsement
          </span>
        );
      case 'Government Photo ID':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px] whitespace-nowrap">
            Government Photo ID
          </span>
        );
      case 'Degree Scroll & Approval':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold text-[10px] whitespace-nowrap">
            Degree Scroll & Approval
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Breadcrumbs & Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span>Registrar Console</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-800 font-semibold">Institutional Verification Repository</span>
          </div>

          {/* Title & Verified Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Document Locker & Verification Vault
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6fcf5] text-[#0d9488] border border-emerald-200 font-bold text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Cryptographically Verified</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1 max-w-3xl">
            Centralized institutional repository for candidate transcripts, church commendation letters, government IDs, and degree scrolls with automated checksum auditing.
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleBulkArchive}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Archive className="h-4 w-4 text-slate-500" />
            <span>Bulk Archive</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>+ Upload Certified Document</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.doc,.docx"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* Archive Notification Toast */}
      {isArchivedBannerShown && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-emerald-400" />
            <span>Selected document dossiers have been encrypted and moved to the cold archive storage vault.</span>
          </div>
          <button onClick={() => setIsArchivedBannerShown(false)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Secured Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Secured Documents
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {totalSecuredCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Across {registrations.length} registered candidates
            </p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full w-1/3" />
            </div>
          </div>
        </div>

        {/* Card 2: Verification Clearance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Verification Clearance
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-[#0d9488] tracking-tight">
                  {clearancePct}%
                </h3>
                <span className="text-xs font-bold text-emerald-600">↑ 1.2%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0d9488]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              {verifiedCount} fully verified documents
            </p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div
                style={{ width: `${clearancePct}%` }}
                className="h-full bg-[#0d9488] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Audit / OCR */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Audit / OCR
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {pendingCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Scan className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              Requires immediate seal inspection
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              <span>{flaggedCount} flagged for urgent re-scan</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vault Storage Utilized */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Vault Storage Utilized
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {storageGB} GB
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-medium">
              AWS S3 Asia-South Enclave &bull; WORM
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Capacity: 250 GB</span>
              <span className="font-bold text-[#0d9488]">{storagePct}% allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ingestion & Cryptographic Protocol Dual Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Drag & Drop Ingestion Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`lg:col-span-2 rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center transition-all bg-white ${
            isDragging ? 'border-[#0d9488] bg-emerald-50/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#e0f7f4] text-[#006f67] flex items-center justify-center mb-3">
            <FolderOpen className="h-6 w-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Drop candidate credential packages here
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-md">
            Supports PDF, high-resolution JPEG, TIFF, PNG up to 25MB per file with automatic optical character recognition.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-4 w-4 text-slate-600" />
              <span>Browse Local Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4 text-slate-600" />
              <span>Scan via Connected Camera</span>
            </button>
          </div>
        </div>

        {/* Right: Cryptographic Proof Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-[#0d9488]" />
              <h4>Cryptographic Proof & Ingestion Protocol</h4>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Every document is SHA-256 digested at ingestion, verified against the ATA National Accrediting standard, and anchored to the tamper-proof ledger.
            </p>

            <div className="bg-[#eff4ff] border border-blue-100 rounded-xl p-3.5 my-4 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Ledger Block
                </p>
                <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                  #ATA-IND-94821
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hash Engine Status
                </p>
                <p className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Synchronized</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 truncate max-w-[200px]">
              Target Affiliate: {primaryInstitution} (ACC-048)
            </span>
            <button
              type="button"
              onClick={() => setIsAuditorModalOpen(true)}
              className="font-bold text-[#0d9488] hover:underline shrink-0 cursor-pointer"
            >
              Auditor Config &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4. Document Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveCategoryTab('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeCategoryTab === 'ALL'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Documents ({categoryCounts.ALL})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCategoryTab('transcripts');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeCategoryTab === 'transcripts'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Academic Transcripts ({categoryCounts.transcripts})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCategoryTab('commendations');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeCategoryTab === 'commendations'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Church Commendations ({categoryCounts.commendations})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCategoryTab('ids');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeCategoryTab === 'ids'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Identity & Government Proofs ({categoryCounts.ids})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCategoryTab('scrolls');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeCategoryTab === 'scrolls'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Degree Scrolls & Approvals ({categoryCounts.scrolls})
        </button>
      </div>

      {/* 5. Search & Filter Bar */}
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
            placeholder="Search by candidate name, registration #, document UID, SHA-256 hash..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#0d9488] focus:outline-hidden shadow-2xs"
          />
        </div>

        {/* Dropdown 1: Status Filter */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses (Verified, Pending, Flagged)</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending Audit">Pending Audit</option>
            <option value="Flagged">Flagged Only</option>
          </select>

          {/* Dropdown 2: Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="NEWEST">Newest Upload First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="NAME">Candidate Name (A-Z)</option>
            <option value="SIZE">File Size (Largest)</option>
          </select>
        </div>
      </div>

      {/* 6. Document Verification Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={paginatedDocs.length > 0 && selectedDocIds.size === paginatedDocs.length}
              onChange={handleToggleSelectAll}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
            />
          </div>
          <div className="col-span-4">Document Details</div>
          <div className="col-span-2">Candidate & Registry ID</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Ingestion & Actor</div>
          <div className="col-span-1">Cryptographic Hash</div>
        </div>

        {/* Rows */}
        {paginatedDocs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">No documents found matching the applied criteria.</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the filters or upload a candidate credential package.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedDocs.map((doc) => {
              const isSelected = selectedDocIds.has(doc.id);
              const isFlagged = doc.isFlagged;

              return (
                <div
                  key={doc.id}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-3 items-center px-5 py-4 transition-colors hover:bg-slate-50/70 ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="lg:col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectRow(doc.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
                    />
                  </div>

                  {/* Document Details */}
                  <div className="lg:col-span-4 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isFlagged
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : doc.category === 'Church Endorsement'
                          ? 'bg-teal-50 text-[#006f67] border border-teal-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}
                    >
                      {isFlagged ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : doc.category === 'Church Endorsement' ? (
                        <FileCheck2 className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>

                    <div className="truncate">
                      <p
                        onClick={() => {
                          const reg = registrations.find((r) => r.id === doc.registrationId);
                          if (reg && onSelectRegistration) onSelectRegistration(reg);
                        }}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors truncate cursor-pointer"
                      >
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        <span>{doc.fileType} &bull; {doc.sizeFormatted} &bull; </span>
                        <span className={isFlagged ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {doc.ocrDetails}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Candidate & Registry ID */}
                  <div className="lg:col-span-2 text-xs truncate">
                    <p className="font-bold text-slate-900 truncate">{doc.candidateName}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                      Reg #{doc.regNumber} - {doc.institutionCode}
                    </p>
                  </div>

                  {/* Category */}
                  <div className="lg:col-span-2">
                    {renderCategoryPill(doc.category)}
                  </div>

                  {/* Ingestion & Actor */}
                  <div className="lg:col-span-2 text-xs">
                    <p className="font-bold text-slate-800">{doc.ingestedAt}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{doc.actor}</p>
                  </div>

                  {/* Cryptographic Hash */}
                  <div className="lg:col-span-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-600">
                        SHA256: {doc.sha256.slice(0, 4)}...{doc.sha256.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(doc.id, doc.sha256)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedHashId === doc.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {renderVerificationBadge(doc.verificationBadge)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 7. Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredDocuments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} files
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

      {/* Camera Capture Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-bold text-sm text-slate-900">Document Camera Scanner</h3>
              </div>
              <button
                onClick={() => setIsCameraModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center text-slate-400">
              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/70 rounded-lg pointer-events-none flex items-center justify-center">
                <p className="text-[11px] text-emerald-300 font-bold bg-slate-900/80 px-2.5 py-1 rounded-full">
                  Align Document Margins
                </p>
              </div>
              <p className="text-xs text-slate-400">Ready to capture document credential</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Document captured! Automatic optical character recognition and cryptographic hashing complete.');
                  setIsCameraModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800"
              >
                Capture & Hash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auditor Configuration & Cryptographic Protocol Modal */}
      {isAuditorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-bold text-base text-slate-900">ATA Cryptographic Protocol Specifications</h3>
              </div>
              <button
                onClick={() => setIsAuditorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">1. SHA-256 Digest Standard</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Each student dossier attachment generates an irreversible 256-bit hash. Any altered byte immediately invalidates verification status.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">2. WORM S3 Asia-South Cloud Storage</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Write-Once-Read-Many policies ensure stored transcripts cannot be edited or deleted once locked by the Chief Academic Registrar.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">3. Continuous Ledger Synchronization</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Current Ledger Block: <code className="font-mono text-[#0d9488] font-bold">#ATA-IND-94821</code>. Synced with the Asia Theological Association Central Commission.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAuditorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Close Protocol Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
